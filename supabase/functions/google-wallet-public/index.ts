// Public endpoint that mints a Google Wallet "save" JWT for a loyalty program.
// Callers:  public wallet enrollment page (trywaya.com/w/:programId?t=...)
//
// Pattern:
//   1. Upsert the loyalty class via the Google Wallet REST API (walletobjects.googleapis.com).
//      This persists the class on Google's side with the correct fields.
//      Inline class creation via save-to-wallet JWT kept hitting validation
//      errors ("Review status must be set" / "Invalid review status Optional[...]")
//      because the JWT upsert has stricter/different rules than the REST API.
//   2. Sign a save-to-wallet JWT that ONLY contains loyaltyObjects — the class
//      is referenced by classId and already exists.
//
// Hardening:
//   - CORS locked to trywaya.com (+ ALLOWED_ORIGINS)
//   - Per-IP rate limit: 10 req / 10 min (Upstash; no-op if unconfigured)
//   - Signed enrollment token required (x-enrollment-token header or body.t)
//   - Strict input validation (UUID program_id, KSA phone, name length)
//   - Google OAuth token / service-account PEM cached between invocations

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { encode as base64url } from "https://deno.land/std@0.208.0/encoding/base64url.ts";
import { decode as base64decode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { clientIp, rateLimit, rateLimitHeaders } from "../_shared/rateLimit.ts";
import { parseEnrollmentInput, ValidationError } from "../_shared/validation.ts";
import { verifyEnrollmentToken } from "../_shared/enrollmentToken.ts";
import { events } from "../_shared/events.ts";
import { pickLang, labelFor } from "../_shared/passLabels.ts";
import { googleSignatureTextModule, googleSignatureLink } from "../_shared/wayaSignature.ts";
import { GNKJ } from "../_shared/easterEgg.ts";
import { stampRow, stampProgressMessage } from "../_shared/stampRow.ts";

const WALLET_API_BASE = "https://walletobjects.googleapis.com/walletobjects/v1";

function getPrivateKey(): string {
  let raw = Deno.env.get("GOOGLE_WALLET_PRIVATE_KEY") || "";
  if (raw.trimStart().startsWith("{")) {
    try { raw = JSON.parse(raw).private_key; }
    catch {
      try { raw = JSON.parse(raw.replace(/\\n/g, "\n")).private_key; }
      catch { throw new Error("Could not parse GOOGLE_WALLET_PRIVATE_KEY"); }
    }
  }
  return raw.replace(/\\n/g, "\n");
}

let cachedSignerKey: CryptoKey | null = null;
async function getSignerKey(): Promise<CryptoKey> {
  if (cachedSignerKey) return cachedSignerKey;
  const pem = getPrivateKey();
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/[\r\n\s]/g, "");
  const der = base64decode(pemBody);
  cachedSignerKey = await crypto.subtle.importKey(
    "pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"],
  );
  return cachedSignerKey;
}

async function signJwt(payload: Record<string, unknown>): Promise<string> {
  const key = await getSignerKey();
  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(signingInput));
  return `${signingInput}.${base64url(new Uint8Array(sig))}`;
}

// OAuth 2.0 access token for Wallet REST API calls. Service-account JWT
// flow: sign a JWT with our key and scope, exchange at Google's token endpoint.
let cachedAccessToken: { token: string; exp: number } | null = null;
async function getAccessToken(serviceAccountEmail: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // Reuse cached token if it's still valid for at least 60 more seconds.
  if (cachedAccessToken && cachedAccessToken.exp > now + 60) return cachedAccessToken.token;

  const jwt = await signJwt({
    iss: serviceAccountEmail,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google OAuth ${res.status}: ${text}`);
  }
  const json = await res.json();
  cachedAccessToken = { token: json.access_token, exp: now + (json.expires_in || 3600) };
  return cachedAccessToken.token;
}

/**
 * Upsert a loyalty class via the Wallet REST API. Checks if it exists; if
 * not, POSTs; if yes, PATCHes with the new fields. Throws on HTTP errors
 * with the response body so we can see Google's actual complaint.
 */
async function upsertLoyaltyClass(accessToken: string, classId: string, classDef: Record<string, unknown>): Promise<void> {
  // GET first — 404 means we need to create.
  const getRes = await fetch(`${WALLET_API_BASE}/loyaltyClass/${encodeURIComponent(classId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (getRes.status === 404) {
    const createRes = await fetch(`${WALLET_API_BASE}/loyaltyClass`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(classDef),
    });
    if (!createRes.ok) {
      const text = await createRes.text();
      throw new Error(`Wallet class create ${createRes.status}: ${text}`);
    }
    return;
  }

  if (!getRes.ok) {
    const text = await getRes.text();
    throw new Error(`Wallet class get ${getRes.status}: ${text}`);
  }

  // Exists — PATCH with our fields. Google merges.
  const patchRes = await fetch(`${WALLET_API_BASE}/loyaltyClass/${encodeURIComponent(classId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(classDef),
  });
  if (!patchRes.ok) {
    const text = await patchRes.text();
    throw new Error(`Wallet class patch ${patchRes.status}: ${text}`);
  }
}

function isImageUrl(u?: string | null): boolean {
  if (!u) return false;
  return u.includes("/storage/") || /\.(png|jpg|jpeg|webp)/i.test(u);
}

function walletOrigins(): string[] {
  const raw = Deno.env.get("GOOGLE_WALLET_ORIGINS") || Deno.env.get("ALLOWED_ORIGINS") || "";
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length > 0 ? list : ["https://trywaya.com", "https://www.trywaya.com"];
}

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");

  const rl = await rateLimit("rl:google-wallet-public", clientIp(req), 10, 10 * 60_000);
  if (!rl.allowed) {
    events.rateLimited({ source: "google-wallet-public", message: "IP exceeded wallet-public rate limit", error_code: "RATE_LIMITED", req });
    return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...cors, ...rateLimitHeaders(rl), "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const input = parseEnrollmentInput(body);

    const token = req.headers.get("x-enrollment-token") || body.t || body.enrollment_token;
    if (!token || typeof token !== "string") throw new ValidationError("Missing enrollment token", "enrollment_token");
    await verifyEnrollmentToken(token, input.program_id);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: program, error } = await supabase
      .from("loyalty_programs").select("*, shop:shops(*)").eq("id", input.program_id).single();
    if (error || !program) throw new Error("Program not found");
    const shop = (program as any).shop;
    const programWithShopName: any = { ...program, shop_name: shop?.name };
    const lang = pickLang((program as any).pass_language, req.headers.get("accept-language"));

    const GW_ISSUER_ID = Deno.env.get("GOOGLE_WALLET_ISSUER_ID");
    const GW_SERVICE_ACCOUNT_EMAIL = Deno.env.get("GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL");
    if (!GW_ISSUER_ID || !GW_SERVICE_ACCOUNT_EMAIL) throw new Error("Google Wallet credentials not configured");

    const idClean = input.program_id.replace(/-/g, "_");
    const phoneClean = input.customer_phone.replace(/[^\w]/g, "_");
    // v5 — class is now created via REST API so we can safely use a stable id
    const classId = `${GW_ISSUER_ID}.waya_loyalty_v5_${idClean}`;
    const objectId = `${GW_ISSUER_ID}.waya_member_v5_${idClean}_${phoneClean}`;

    const { data: existing } = await supabase
      .from("customer_passes").select("*")
      .eq("program_id", input.program_id).eq("customer_phone", input.customer_phone).maybeSingle();
    if (existing) {
      if (existing.google_object_id !== objectId) {
        await supabase.from("customer_passes")
          .update({ google_object_id: objectId, customer_name: input.customer_name })
          .eq("id", existing.id);
      }
    } else {
      await supabase.from("customer_passes").insert({
        program_id: input.program_id, shop_id: shop.id,
        customer_name: input.customer_name, customer_phone: input.customer_phone,
        google_object_id: objectId,
      });
    }

    const rawColor = programWithShopName.card_color || "#10B981";
    const hexColor = /^#[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor : "#10B981";

    // Class-level static modules — same across all customers on this program.
    // Living on the class (not the object) means google-wallet-update can
    // freely replace the object's textModulesData with just the dynamic
    // progress message on each scan, without wiping shop/reward/GNKJ/signature.
    const classTextModules: any[] = [
      { header: labelFor(lang, "SHOP"), body: programWithShopName.name || programWithShopName.shop_name, id: "shop" },
    ];
    if (programWithShopName.reward_title) {
      classTextModules.push({
        header: labelFor(lang, "REWARD"),
        body: programWithShopName.reward_title + (programWithShopName.reward_description ? " — " + programWithShopName.reward_description : ""),
        id: "reward",
      });
    }
    if (programWithShopName.terms) classTextModules.push({ header: labelFor(lang, "TERMS"), body: (programWithShopName.terms as string).slice(0, 500), id: "terms" });
    classTextModules.push({ body: GNKJ, id: "gnkj" });
    classTextModules.push(googleSignatureTextModule(lang));

    const classLinksModule: any = { uris: [] };
    if (programWithShopName.google_maps_url) classLinksModule.uris.push({ uri: programWithShopName.google_maps_url, description: labelFor(lang, "FIND_US"), id: "maps" });
    if (programWithShopName.website_url) classLinksModule.uris.push({ uri: programWithShopName.website_url, description: labelFor(lang, "WEBSITE"), id: "web" });
    if (programWithShopName.phone) classLinksModule.uris.push({ uri: `tel:${programWithShopName.phone}`, description: labelFor(lang, "PHONE"), id: "phone" });
    classLinksModule.uris.push({ ...googleSignatureLink(), id: "waya_link" });

    // Loyalty class — posted to REST API, not embedded in JWT.
    // issuerName is the MERCHANT name on the pass front (what the customer sees
    // as the brand). Waya-branding lives in the "Powered by" text module.
    const merchantName = programWithShopName.name || programWithShopName.shop_name || "Loyalty";
    const loyaltyClass: Record<string, unknown> = {
      id: classId,
      issuerName: merchantName,
      reviewStatus: "UNDER_REVIEW",
      programName: merchantName,
      hexBackgroundColor: hexColor,
      countryCode: "SA",
      textModulesData: classTextModules,
      linksModuleData: classLinksModule,
    };
    if (isImageUrl(programWithShopName.logo_url || shop?.logo_url)) {
      loyaltyClass.programLogo = {
        sourceUri: { uri: programWithShopName.logo_url || shop.logo_url },
        contentDescription: { defaultValue: { language: "en", value: programWithShopName.shop_name } },
      };
    }
    const bgUrl = programWithShopName.background_url;
    const isAutoStrip = typeof bgUrl === "string" && bgUrl.includes("/strip-auto-");
    if (isImageUrl(bgUrl) && !isAutoStrip) {
      loyaltyClass.heroImage = {
        sourceUri: { uri: bgUrl },
        contentDescription: { defaultValue: { language: "en", value: programWithShopName.name || "Loyalty" } },
      };
    }
    const shopLocations = Array.isArray(shop?.locations) ? shop.locations : [];
    const googleLocations = shopLocations
      .filter((l: any) => typeof l.latitude === "number" && typeof l.longitude === "number")
      .slice(0, 10).map((l: any) => ({ latitude: l.latitude, longitude: l.longitude }));
    if (googleLocations.length > 0) loyaltyClass.locations = googleLocations;

    // Create/update class in Google's system via REST API BEFORE minting the JWT.
    const accessToken = await getAccessToken(GW_SERVICE_ACCOUNT_EMAIL);
    await upsertLoyaltyClass(accessToken, classId, loyaltyClass);

    // Stamps-only product: loyaltyPoints is always the stamp row.
    const haveStamps = existing?.stamps ?? 0;
    const haveRewards = existing?.rewards_balance ?? 0;
    const need = programWithShopName.stamps_required || 10;

    const loyaltyObject: any = {
      id: objectId,
      classId,
      state: "ACTIVE",
      accountId: input.customer_phone,
      accountName: input.customer_name,
      barcode: { type: "QR_CODE", value: objectId, alternateText: input.customer_name },
      textModulesData: [{
        body: stampProgressMessage(
          haveStamps,
          need,
          programWithShopName.reward_title || labelFor(lang, "REWARD"),
          haveRewards,
          lang,
        ),
        id: "progress",
      }],
      loyaltyPoints: {
        label: `${labelFor(lang, "STAMPS")} ${haveStamps}/${need}`,
        balance: { string: stampRow(haveStamps, need) },
      },
    };
    if (haveRewards > 0) {
      loyaltyObject.secondaryLoyaltyPoints = {
        label: labelFor(lang, "REWARDS"),
        balance: { string: `${haveRewards}x ${programWithShopName.reward_title || labelFor(lang, "REWARD")}` },
      };
    }

    if (programWithShopName.expires_at) {
      const expiryDate = new Date(programWithShopName.expires_at);
      if (expiryDate.getTime() > Date.now()) loyaltyObject.validTimeInterval = { end: { date: expiryDate.toISOString() } };
    }
    if (googleLocations.length > 0) loyaltyObject.locations = googleLocations;

    const now = Math.floor(Date.now() / 1000);
    const origins = walletOrigins();
    const claims = {
      iss: GW_SERVICE_ACCOUNT_EMAIL,
      aud: "google",
      origins,
      typ: "savetowallet",
      iat: now,
      exp: now + 3600,
      // JWT only carries the object — class is already upserted via REST API.
      payload: { loyaltyObjects: [loyaltyObject] },
    };

    const jwt = await signJwt(claims);
    const saveUrl = `https://pay.google.com/gp/v/save/${jwt}`;

    try {
      await supabase.from("activity_log").insert({
        shop_id: shop.id, customer_name: input.customer_name,
        action: "google_wallet_add", points: 0,
      });
    } catch (_) { /* non-fatal */ }

    events.cardIssued({
      source: "google-wallet-public",
      shop_id: shop.id,
      program_id: input.program_id,
      message: `Google Wallet pass issued for ${programWithShopName.name}`,
      metadata: {
        platform: "google",
        loyalty_type: programWithShopName.loyalty_type,
        object_id: objectId,
        class_id: classId,
        issuer_id: GW_ISSUER_ID,
        service_account: GW_SERVICE_ACCOUNT_EMAIL?.replace(/(.{4}).+(@.+)/, "$1…$2"),
        origins,
      },
      req,
    });

    return new Response(JSON.stringify({ success: true, saveUrl, classId, objectId }), {
      headers: { ...cors, ...rateLimitHeaders(rl), "Content-Type": "application/json" },
    });
  } catch (error) {
    const isValidation = error instanceof ValidationError;
    const status = isValidation ? 422 : 400;
    const msg = (error as Error).message;
    if (isValidation) {
      events.validationFailed({ source: "google-wallet-public", message: msg, error_code: "VALIDATION_FAILED", req });
    } else if (/enrollment token|signature|expired/i.test(msg)) {
      events.invalidToken({ source: "google-wallet-public", message: msg, error_code: "INVALID_ENROLLMENT_TOKEN", req });
    } else {
      events.cardFailed({
        source: "google-wallet-public",
        message: msg,
        error_code: "GOOGLE_WALLET_FAIL",
        metadata: {
          platform: "google",
          issuer_id: Deno.env.get("GOOGLE_WALLET_ISSUER_ID") || null,
          service_account: (Deno.env.get("GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL") || "")
            .replace(/(.{4}).+(@.+)/, "$1…$2") || null,
          origins: walletOrigins(),
        },
        req,
      });
    }
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status,
      headers: { ...cors, ...rateLimitHeaders(rl), "Content-Type": "application/json" },
    });
  }
});
