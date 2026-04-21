// Public endpoint that emits a signed Apple Wallet .pkpass.
// Hardening mirrors google-wallet-public:
//   - CORS allowlist
//   - Per-IP rate limit: 10 req / 10 min
//   - Signed enrollment token required
//   - Strict input validation
//   - apple_auth_token hashed before insert; plaintext is only returned once
//     in the generated pass. Legacy plaintext rows are transparently migrated
//     to hashed form on next pass re-issue.
//   - Logos are read from Supabase Storage only (no external URL fetch).
//
// Pass contents:
//   - Bilingual labels (en/ar) driven by program.pass_language.
//   - Stamp primary field now shows {have}/{need}, not "★★★☆☆".
//   - Reward icon (from program.reward_icon_url) used as thumbnail.
//   - Every pass carries a non-removable Waya signature back field
//     and a hidden "Legendary" Easter-egg field.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import forge from "npm:node-forge@1.3.1";
import { zipSync, strToU8 } from "npm:fflate@0.8.2";

import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { clientIp, rateLimit, rateLimitHeaders } from "../_shared/rateLimit.ts";
import { parseEnrollmentInput, ValidationError } from "../_shared/validation.ts";
import { verifyEnrollmentToken } from "../_shared/enrollmentToken.ts";
import { hashSecret } from "../_shared/hash.ts";
import { events } from "../_shared/events.ts";
import { pickLang, labelFor } from "../_shared/passLabels.ts";
import { appleSignatureBackField, passDescription } from "../_shared/wayaSignature.ts";
import { GNKJ } from "../_shared/easterEgg.ts";

const FALLBACK_ICON_29 = Uint8Array.from(atob(
  "iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAAGUlEQVR42mNkYGD4z0AEYBxVSF+FAAEGAAgyAQEAhuNGAAAAAElFTkSuQmCC"
), c => c.charCodeAt(0));
const FALLBACK_ICON_58 = Uint8Array.from(atob(
  "iVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAYAAADhu0ooAAAAIUlEQVR42mNkYGD4z0ABYBxVTF+FAAEGABISAQHO0UzUAAAAAElFTkSuQmCC"
), c => c.charCodeAt(0));

function sha1Hex(bytes: Uint8Array): string {
  const md = forge.md.sha1.create();
  const bin = Array.from(bytes).map(b => String.fromCharCode(b)).join("");
  md.update(bin);
  return md.digest().toHex();
}

function loadPrivateKey(pem: string, password: string | undefined): forge.pki.PrivateKey {
  const isEncrypted = /ENCRYPTED/.test(pem) || /Proc-Type:\s*4,ENCRYPTED/.test(pem);
  if (isEncrypted) {
    if (!password) throw new Error("Signer key encrypted but APPLE_WALLET_SIGNER_KEY_PASSWORD not set");
    const key = forge.pki.decryptRsaPrivateKey(pem, password);
    if (!key) throw new Error("Failed to decrypt signer key");
    return key;
  }
  try { return forge.pki.privateKeyFromPem(pem); } catch (e) {
    if (password) {
      const key = forge.pki.decryptRsaPrivateKey(pem, password);
      if (key) return key;
    }
    throw e;
  }
}

function signManifest(manifestJson: string, signerCertPem: string, signerKeyPem: string, wwdrPem: string, keyPassword: string | undefined): Uint8Array {
  const signerCert = forge.pki.certificateFromPem(signerCertPem);
  const wwdrCert = forge.pki.certificateFromPem(wwdrPem);
  const signerKey = loadPrivateKey(signerKeyPem, keyPassword);
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifestJson, "utf8");
  p7.addCertificate(signerCert);
  p7.addCertificate(wwdrCert);
  p7.addSigner({
    key: signerKey,
    certificate: signerCert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() },
    ],
  });
  p7.sign({ detached: true });
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  const out = new Uint8Array(der.length);
  for (let i = 0; i < der.length; i++) out[i] = der.charCodeAt(i) & 0xff;
  return out;
}

/**
 * Fetches an image from our OWN Supabase Storage bucket. Never follows
 * arbitrary external URLs (SSRF defense). We key on the `/storage/v1/object/`
 * substring, which our storage URLs always contain.
 */
async function fetchStorageImage(supabaseUrl: string, url: string | null | undefined): Promise<Uint8Array | null> {
  if (!url) return null;
  if (!url.includes("/storage/v1/object/")) return null;
  try {
    const u = new URL(url);
    const expected = new URL(supabaseUrl);
    if (u.host !== expected.host) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return buf;
    return null;
  } catch { return null; }
}

/**
 * Decodes a data: URL of the form "data:image/png;base64,AAAA..." to PNG bytes.
 * Returns null if the URL isn't a valid base64 PNG data URL.
 */
function decodeDataUrlPng(url: string | null | undefined): Uint8Array | null {
  if (!url || !url.startsWith("data:image/")) return null;
  const commaIdx = url.indexOf(",");
  if (commaIdx < 0) return null;
  const header = url.slice(0, commaIdx);
  if (!header.includes(";base64")) return null;
  try {
    const bytes = Uint8Array.from(atob(url.slice(commaIdx + 1)), c => c.charCodeAt(0));
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return bytes;
    return null;
  } catch { return null; }
}

async function loadImageFromAnySource(supabaseUrl: string, url: string | null | undefined): Promise<Uint8Array | null> {
  if (!url) return null;
  const data = decodeDataUrlPng(url);
  if (data) return data;
  return await fetchStorageImage(supabaseUrl, url);
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`;
}

function buildPassFields(program: any, customer: any, lang: "en" | "ar") {
  const type = program.loyalty_type || "stamp";
  const rewards = customer.rewards_balance || 0;
  const rewardsField = rewards > 0
    ? { key: "rewards", label: labelFor(lang, "REWARDS"), value: `${rewards}x ${program.reward_title || labelFor(lang, "REWARD")}` }
    : { key: "rewards", label: labelFor(lang, "REWARD"), value: program.reward_title || labelFor(lang, "REWARD") };
  const memberName = customer.customer_name || labelFor(lang, "MEMBER_VALUE");

  if (type === "stamp") {
    const need = program.stamps_required || 10;
    const have = customer.stamps || 0;
    return {
      headerFields: [{ key: "count", label: labelFor(lang, "STAMPS"), value: `${have}/${need}` }],
      // Primary shows the count as text (no more star-row unicode).
      primaryFields: [{ key: "stamps", label: memberName, value: `${have} / ${need}` }],
      secondaryFields: [{ key: "shop", label: labelFor(lang, "SHOP"), value: program.name || program.shop_name }],
      auxiliaryFields: [rewardsField],
    };
  }
  if (type === "points") {
    const need = program.reward_threshold || 10;
    const have = customer.points || 0;
    return {
      headerFields: [{ key: "points", label: labelFor(lang, "POINTS"), value: `${have}/${need}` }],
      primaryFields: [{ key: "member", label: labelFor(lang, "MEMBER"), value: memberName }],
      secondaryFields: [{ key: "shop", label: labelFor(lang, "SHOP"), value: program.name || program.shop_name }],
      auxiliaryFields: [rewardsField],
    };
  }
  if (type === "tiered") {
    const tierName = customer.tier || (Array.isArray(program.tiers) && program.tiers[0]?.name) || labelFor(lang, "BRONZE");
    return {
      headerFields: [{ key: "points", label: labelFor(lang, "POINTS"), value: String(customer.points ?? 0) }],
      primaryFields: [{ key: "tier", label: labelFor(lang, "TIER"), value: tierName }],
      secondaryFields: [{ key: "member", label: labelFor(lang, "MEMBER"), value: memberName }],
      auxiliaryFields: [{ key: "shop", label: labelFor(lang, "SHOP"), value: program.name || program.shop_name }],
    };
  }
  // coupon
  return {
    headerFields: [{ key: "value", label: labelFor(lang, "OFFER"), value: program.coupon_discount || "DISCOUNT" }],
    primaryFields: [{ key: "code", label: labelFor(lang, "CODE"), value: program.coupon_code || "—" }],
    secondaryFields: [{ key: "member", label: labelFor(lang, "MEMBER"), value: memberName }],
    auxiliaryFields: [{ key: "shop", label: labelFor(lang, "SHOP"), value: program.name || program.shop_name }],
  };
}

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");

  const rl = await rateLimit("rl:apple-wallet-public", clientIp(req), 10, 10 * 60_000);
  if (!rl.allowed) {
    events.rateLimited({
      source: "apple-wallet-public",
      message: "IP exceeded wallet-public rate limit",
      error_code: "RATE_LIMITED",
      req,
    });
    return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...cors, ...rateLimitHeaders(rl), "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const input = parseEnrollmentInput(body);

    const token = req.headers.get("x-enrollment-token") || body.t || body.enrollment_token;
    if (!token || typeof token !== "string") {
      throw new ValidationError("Missing enrollment token", "enrollment_token");
    }
    await verifyEnrollmentToken(token, input.program_id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data, error } = await supabase
      .from("loyalty_programs")
      .select("*, shop:shops(*)")
      .eq("id", input.program_id)
      .single();
    if (error || !data) throw new Error("Program not found");
    const program: any = { ...data, shop_name: (data as any).shop?.name };
    const shop: any = (data as any).shop;

    const lang = pickLang(program.pass_language, req.headers.get("accept-language"));

    const passTypeId = Deno.env.get("APPLE_PASS_TYPE_ID");
    const teamId = Deno.env.get("APPLE_TEAM_ID");
    const signerCert = Deno.env.get("APPLE_WALLET_SIGNER_CERT");
    const signerKey = Deno.env.get("APPLE_WALLET_SIGNER_KEY");
    const signerKeyPassword = Deno.env.get("APPLE_WALLET_SIGNER_KEY_PASSWORD");
    const wwdr = Deno.env.get("APPLE_WALLET_WWDR_CERT");
    const orgName = Deno.env.get("APPLE_WALLET_ORG_NAME") || "Waya";
    const webServiceURL = Deno.env.get("APPLE_PASSKIT_WEB_SERVICE_URL")
      || `${supabaseUrl}/functions/v1/apple-passkit/`;
    if (!passTypeId || !teamId || !signerCert || !signerKey || !wwdr) {
      throw new Error("Apple Wallet credentials not configured");
    }

    // Look up or create customer_pass row. Auth token is stored HASHED.
    let pass_row: any = null;
    let plaintextAuthToken: string | null = null;

    const { data: existing } = await supabase
      .from("customer_passes")
      .select("*")
      .eq("program_id", input.program_id)
      .eq("customer_phone", input.customer_phone)
      .maybeSingle();
    pass_row = existing;

    if (!pass_row || !pass_row.apple_serial) {
      const phoneClean = input.customer_phone.replace(/[^\w]/g, "_");
      const serial = `waya_${input.program_id.replace(/-/g, "")}_${phoneClean}_${Date.now()}`;
      plaintextAuthToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const hashedAuthToken = await hashSecret(plaintextAuthToken);
      if (!pass_row) {
        const { data: inserted } = await supabase
          .from("customer_passes")
          .insert({
            program_id: input.program_id,
            shop_id: shop.id,
            customer_name: input.customer_name,
            customer_phone: input.customer_phone,
            apple_serial: serial,
            apple_auth_token: hashedAuthToken,
          })
          .select()
          .single();
        pass_row = inserted;
      } else {
        await supabase.from("customer_passes").update({
          apple_serial: serial,
          apple_auth_token: hashedAuthToken,
          customer_name: input.customer_name,
        }).eq("id", pass_row.id);
        pass_row.apple_serial = serial;
      }
    } else {
      plaintextAuthToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const hashedAuthToken = await hashSecret(plaintextAuthToken);
      await supabase.from("customer_passes").update({
        apple_auth_token: hashedAuthToken,
        customer_name: input.customer_name,
      }).eq("id", pass_row.id);
    }

    const fields = buildPassFields(program, { ...pass_row, customer_name: input.customer_name }, lang);
    const bgRgb = (program.card_color || "#10B981").startsWith("#") ? hexToRgb(program.card_color) : program.card_color;
    const fgRgb = (program.text_color || "#FFFFFF").startsWith("#") ? hexToRgb(program.text_color) : program.text_color;

    const backFields: any[] = [];
    if (program.reward_description) backFields.push({ key: "rewardDesc", label: labelFor(lang, "REWARD_DESC"), value: program.reward_description });
    if (program.terms) backFields.push({ key: "terms", label: labelFor(lang, "TERMS"), value: program.terms });
    if (program.expires_at) backFields.push({ key: "expires", label: labelFor(lang, "EXPIRES"), value: new Date(program.expires_at).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US") });
    if (program.google_maps_url) backFields.push({ key: "maps", label: labelFor(lang, "FIND_US"), value: program.google_maps_url, attributedValue: `<a href='${program.google_maps_url}'>${labelFor(lang, "OPEN_IN_MAPS")}</a>` });
    if (program.website_url) backFields.push({ key: "web", label: labelFor(lang, "WEBSITE"), value: program.website_url });
    if (program.phone) backFields.push({ key: "phone", label: labelFor(lang, "PHONE"), value: program.phone });
    if (program.address) backFields.push({ key: "address", label: labelFor(lang, "ADDRESS"), value: program.address });

    // Easter egg — just four letters on the back. No label, no explanation.
    backFields.push({ key: "gnkj", label: "", value: GNKJ });

    // Waya signature — always last, non-removable.
    backFields.push(appleSignatureBackField(lang));

    const passKey = program.loyalty_type === "coupon" ? "coupon" : "storeCard";
    const pass: any = {
      formatVersion: 1,
      passTypeIdentifier: passTypeId,
      serialNumber: pass_row.apple_serial,
      teamIdentifier: teamId,
      organizationName: orgName,
      description: passDescription(program.name || program.shop_name),
      logoText: program.name || program.shop_name,
      foregroundColor: fgRgb,
      backgroundColor: bgRgb,
      labelColor: fgRgb,
      ...(() => {
        const bt = program.barcode_type || "QR";
        if (bt === "NONE") return {};
        const formatMap: Record<string, string> = {
          QR: "PKBarcodeFormatQR",
          CODE128: "PKBarcodeFormatCode128",
          AZTEC: "PKBarcodeFormatAztec",
          PDF417: "PKBarcodeFormatPDF417",
        };
        return {
          barcodes: [{
            message: pass_row.apple_serial,
            format: formatMap[bt] || "PKBarcodeFormatQR",
            messageEncoding: "iso-8859-1",
            altText: input.customer_name,
          }],
        };
      })(),
      webServiceURL,
      authenticationToken: plaintextAuthToken,
      [passKey]: { ...fields, backFields },
    };
    if (program.expires_at) pass.expirationDate = new Date(program.expires_at).toISOString();

    const shopLocations = Array.isArray(shop?.locations) ? shop.locations : [];
    const appleLocations = shopLocations
      .filter((l: any) => typeof l.latitude === "number" && typeof l.longitude === "number")
      .slice(0, 10)
      .map((l: any) => {
        const entry: any = { latitude: l.latitude, longitude: l.longitude };
        if (l.relevant_text) entry.relevantText = l.relevant_text;
        return entry;
      });
    if (appleLocations.length > 0) {
      pass.locations = appleLocations;
      pass.maxDistance = 500;
    }

    const remoteIcon = await fetchStorageImage(supabaseUrl, program.logo_url || shop?.logo_url);
    const remoteBg = await fetchStorageImage(supabaseUrl, program.background_url);
    const rewardIcon = await loadImageFromAnySource(supabaseUrl, program.reward_icon_url);
    const icon29 = remoteIcon || FALLBACK_ICON_29;
    const icon58 = remoteIcon || FALLBACK_ICON_58;
    const files: Record<string, Uint8Array> = {
      "pass.json": strToU8(JSON.stringify(pass)),
      "icon.png": icon29,
      "icon@2x.png": icon58,
      "logo.png": icon29,
      "logo@2x.png": icon58,
    };
    if (remoteBg) {
      files["strip.png"] = remoteBg;
      files["strip@2x.png"] = remoteBg;
    }
    // Thumbnail reflects the merchant's reward icon (coffee, scissors, etc.)
    // Apple renders thumbnail.png on the pass front for storeCard/coupon/eventTicket.
    if (rewardIcon) {
      files["thumbnail.png"] = rewardIcon;
      files["thumbnail@2x.png"] = rewardIcon;
    }

    const manifestObj: Record<string, string> = {};
    for (const [n, b] of Object.entries(files)) manifestObj[n] = sha1Hex(b);
    const manifestStr = JSON.stringify(manifestObj);
    const manifestBytes = strToU8(manifestStr);
    const signatureBytes = signManifest(manifestStr, signerCert, signerKey, wwdr, signerKeyPassword);

    const archive = zipSync({
      ...files,
      "manifest.json": manifestBytes,
      "signature": signatureBytes,
    }, { level: 6 });

    try {
      await supabase.from("activity_log").insert({
        shop_id: shop.id,
        customer_name: input.customer_name,
        action: "apple_wallet_add",
        points: 0,
      });
    } catch (_) { /* non-fatal */ }

    events.cardIssued({
      source: "apple-wallet-public",
      shop_id: shop.id,
      program_id: input.program_id,
      customer_pass_id: pass_row?.id ?? null,
      message: `Apple Wallet pass issued for ${program.name || program.shop_name}`,
      metadata: { platform: "apple", loyalty_type: program.loyalty_type, serial: pass_row?.apple_serial, lang },
      req,
    });

    return new Response(archive, {
      headers: {
        ...cors,
        ...rateLimitHeaders(rl),
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${(program.shop_name || "loyalty").replace(/[^\w]/g, "_")}.pkpass"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const isValidation = err instanceof ValidationError;
    const status = isValidation ? 422 : 400;
    const msg = (err as Error).message;
    if (isValidation) {
      events.validationFailed({
        source: "apple-wallet-public",
        message: msg,
        error_code: "VALIDATION_FAILED",
        req,
      });
    } else if (/enrollment token|signature|expired/i.test(msg)) {
      events.invalidToken({
        source: "apple-wallet-public",
        message: msg,
        error_code: "INVALID_ENROLLMENT_TOKEN",
        req,
      });
    } else if (/sign|pkcs|certificate/i.test(msg)) {
      events.pkpassSignFailed({
        source: "apple-wallet-public",
        message: msg,
        error_code: "PKPASS_SIGN_FAIL",
        req,
      });
    } else {
      events.cardFailed({
        source: "apple-wallet-public",
        message: msg,
        error_code: "APPLE_WALLET_FAIL",
        metadata: { platform: "apple" },
        req,
      });
    }
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status,
      headers: { ...cors, ...rateLimitHeaders(rl), "Content-Type": "application/json" },
    });
  }
});
