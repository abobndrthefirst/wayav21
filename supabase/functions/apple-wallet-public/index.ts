import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import forge from "npm:node-forge@1.3.1";
import { zipSync, strToU8 } from "npm:fflate@0.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

async function fetchImage(url: string | null | undefined): Promise<Uint8Array | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return buf;
    return null;
  } catch { return null; }
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`;
}

function buildPassFields(program: any, customer: any) {
  const type = program.loyalty_type || "stamp";
  if (type === "stamp") {
    const need = program.stamps_required || 10;
    const have = customer.stamps || 0;
    const max = Math.min(need, 12);
    const filled = Math.min(have, max);
    const stampRow = "\u2605".repeat(filled) + "\u2606".repeat(max - filled);
    return {
      headerFields: [{ key: "count", label: "STAMPS", value: `${have}/${need}` }],
      primaryFields: [{ key: "stamps", label: customer.customer_name || "Member", value: stampRow }],
      secondaryFields: [{ key: "shop", label: "SHOP", value: program.name || program.shop_name }],
      auxiliaryFields: [{ key: "reward", label: "REWARD", value: program.reward_title || "Reward" }],
    };
  }
  if (type === "points") {
    const need = program.reward_threshold || 10;
    const have = customer.points || 0;
    return {
      headerFields: [{ key: "points", label: "POINTS", value: `${have}/${need}` }],
      primaryFields: [{ key: "member", label: "MEMBER", value: customer.customer_name || "Member" }],
      secondaryFields: [{ key: "shop", label: "SHOP", value: program.name || program.shop_name }],
      auxiliaryFields: [{ key: "reward", label: "REWARD", value: program.reward_title || "Reward" }],
    };
  }
  if (type === "tiered") {
    return {
      headerFields: [{ key: "points", label: "POINTS", value: customer.points || 0 }],
      primaryFields: [{ key: "tier", label: "TIER", value: customer.tier || "Bronze" }],
      secondaryFields: [{ key: "member", label: "MEMBER", value: customer.customer_name || "Member" }],
      auxiliaryFields: [{ key: "shop", label: "SHOP", value: program.name || program.shop_name }],
    };
  }
  // coupon
  return {
    headerFields: [{ key: "value", label: "OFFER", value: program.coupon_discount || "DISCOUNT" }],
    primaryFields: [{ key: "code", label: "CODE", value: program.coupon_code || "—" }],
    secondaryFields: [{ key: "member", label: "MEMBER", value: customer.customer_name || "Member" }],
    auxiliaryFields: [{ key: "shop", label: "SHOP", value: program.name || program.shop_name }],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { program_id, shop_id, customer_name, customer_phone } = body;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve program (preferred) or fall back to legacy shop-only mode
    let program: any = null;
    let shop: any = null;
    if (program_id) {
      const { data, error } = await supabase
        .from("loyalty_programs").select("*, shop:shops(*)").eq("id", program_id).single();
      if (error || !data) throw new Error("Program not found");
      program = { ...data, shop_name: data.shop?.name };
      shop = data.shop;
    } else {
      if (!shop_id) throw new Error("Missing program_id or shop_id");
      const { data, error } = await supabase.from("shops").select("*").eq("id", shop_id).single();
      if (error || !data) throw new Error("Shop not found");
      shop = data;
      program = {
        id: null,
        shop_id: shop.id,
        loyalty_type: "points",
        reward_threshold: shop.reward_threshold || 10,
        reward_title: "Reward",
        reward_description: shop.reward_description,
        card_color: shop.card_color || "#10B981",
        text_color: "#FFFFFF",
        logo_url: shop.logo_url,
        shop_name: shop.name,
        terms: null,
        expires_at: null,
        google_maps_url: null,
        website_url: null,
      };
    }

    const passTypeId = Deno.env.get("APPLE_PASS_TYPE_ID");
    const teamId = Deno.env.get("APPLE_TEAM_ID");
    const signerCert = Deno.env.get("APPLE_WALLET_SIGNER_CERT");
    const signerKey = Deno.env.get("APPLE_WALLET_SIGNER_KEY");
    const signerKeyPassword = Deno.env.get("APPLE_WALLET_SIGNER_KEY_PASSWORD");
    const wwdr = Deno.env.get("APPLE_WALLET_WWDR_CERT");
    const orgName = Deno.env.get("APPLE_WALLET_ORG_NAME") || "Waya";
    const webServiceURL = Deno.env.get("APPLE_PASSKIT_WEB_SERVICE_URL")
      || `${Deno.env.get("SUPABASE_URL")}/functions/v1/apple-passkit/`;
    if (!passTypeId || !teamId || !signerCert || !signerKey || !wwdr) {
      throw new Error("Apple Wallet credentials not configured");
    }

    // Look up or create customer_pass row
    let pass_row: any = null;
    if (program.id && customer_phone) {
      const { data: existing } = await supabase
        .from("customer_passes")
        .select("*").eq("program_id", program.id).eq("customer_phone", customer_phone).maybeSingle();
      if (existing) pass_row = existing;
    }
    if (!pass_row) {
      const phoneClean = (customer_phone || String(Date.now())).replace(/[^\w]/g, "_");
      const serial = `waya_${(program.id || shop.id).replace(/-/g, "")}_${phoneClean}_${Date.now()}`;
      const authToken = crypto.randomUUID().replace(/-/g, "");
      if (program.id) {
        const { data: inserted } = await supabase
          .from("customer_passes")
          .insert({
            program_id: program.id,
            shop_id: shop.id,
            customer_name,
            customer_phone,
            apple_serial: serial,
            apple_auth_token: authToken,
          }).select().single();
        pass_row = inserted;
      } else {
        pass_row = { apple_serial: serial, apple_auth_token: authToken, points: 0, stamps: 0, customer_name, customer_phone };
      }
    } else if (!pass_row.apple_serial) {
      const phoneClean = (customer_phone || String(Date.now())).replace(/[^\w]/g, "_");
      const serial = `waya_${program.id.replace(/-/g, "")}_${phoneClean}_${Date.now()}`;
      const authToken = crypto.randomUUID().replace(/-/g, "");
      await supabase.from("customer_passes").update({
        apple_serial: serial, apple_auth_token: authToken, customer_name,
      }).eq("id", pass_row.id);
      pass_row.apple_serial = serial;
      pass_row.apple_auth_token = authToken;
    }

    const fields = buildPassFields(program, { ...pass_row, customer_name });
    const bgRgb = (program.card_color || "#10B981").startsWith("#") ? hexToRgb(program.card_color) : program.card_color;
    const fgRgb = (program.text_color || "#FFFFFF").startsWith("#") ? hexToRgb(program.text_color) : program.text_color;

    const backFields: any[] = [];
    if (program.reward_description) backFields.push({ key: "rewardDesc", label: "Reward", value: program.reward_description });
    if (program.terms) backFields.push({ key: "terms", label: "Terms & Conditions", value: program.terms });
    if (program.expires_at) backFields.push({ key: "expires", label: "Expires", value: new Date(program.expires_at).toLocaleDateString() });
    if (program.google_maps_url) backFields.push({ key: "maps", label: "Find us", value: program.google_maps_url, attributedValue: `<a href='${program.google_maps_url}'>Open in Maps</a>` });
    if (program.website_url) backFields.push({ key: "web", label: "Website", value: program.website_url });
    if (program.phone) backFields.push({ key: "phone", label: "Phone", value: program.phone });
    if (program.address) backFields.push({ key: "address", label: "Address", value: program.address });
    backFields.push({ key: "powered", label: "Powered by", value: "Waya \u2014 trywaya.com" });

    const passKey = program.loyalty_type === "coupon" ? "coupon" : "storeCard";
    const pass: any = {
      formatVersion: 1,
      passTypeIdentifier: passTypeId,
      serialNumber: pass_row.apple_serial,
      teamIdentifier: teamId,
      organizationName: orgName,
      description: `${program.name || program.shop_name} Loyalty`,
      logoText: program.name || program.shop_name,
      foregroundColor: fgRgb,
      backgroundColor: bgRgb,
      labelColor: fgRgb,
      barcodes: [{
        message: pass_row.apple_serial,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: customer_name || "Member",
      }],
      // Live update support
      webServiceURL,
      authenticationToken: pass_row.apple_auth_token,
      [passKey]: { ...fields, backFields },
    };
    if (program.expires_at) pass.expirationDate = new Date(program.expires_at).toISOString();

    // Lock-screen geo relevance: include shop locations so the pass surfaces when the customer is nearby
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
      pass.maxDistance = 500; // meters
    }

    const remoteIcon = await fetchImage(program.logo_url || shop.logo_url);
    const remoteBg = await fetchImage(program.background_url);
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
        customer_name: customer_name || "Unknown",
        action: "apple_wallet_add",
        points: 0,
      });
    } catch (_) {}

    return new Response(archive, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${(program.shop_name || "loyalty").replace(/[^\w]/g, "_")}.pkpass"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
