// Public endpoint that mints a Google Wallet "save" JWT for a loyalty program.
// Callers:  public wallet enrollment page (trywaya.com/w/:programId?t=...)
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

// Cached CryptoKey import so we don't re-import the PEM on every invocation.
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

function isImageUrl(u?: string | null): boolean {
  if (!u) return false;
  return u.includes("/storage/") || /\.(png|jpg|jpeg|webp)/i.test(u);
}

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");

  // Rate limit first — 10 req / 10 min per IP
  const rl = await rateLimit("rl:google-wallet-public", clientIp(req), 10, 10 * 60_000);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...cors, ...rateLimitHeaders(rl), "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const input = parseEnrollmentInput(body);

    // Verify the signed enrollment token
    const token = req.headers.get("x-enrollment-token") || body.t || body.enrollment_token;
    if (!token || typeof token !== "string") {
      throw new ValidationError("Missing enrollment token", "enrollment_token");
    }
    await verifyEnrollmentToken(token, input.program_id);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: program, error } = await supabase
      .from("loyalty_programs")
      .select("*, shop:shops(*)")
      .eq("id", input.program_id)
      .single();
    if (error || !program) throw new Error("Program not found");
    const shop = (program as any).shop;
    const programWithShopName: any = { ...program, shop_name: shop?.name };

    const GW_ISSUER_ID = Deno.env.get("GOOGLE_WALLET_ISSUER_ID");
    const GW_SERVICE_ACCOUNT_EMAIL = Deno.env.get("GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL");
    if (!GW_ISSUER_ID || !GW_SERVICE_ACCOUNT_EMAIL) {
      throw new Error("Google Wallet credentials not configured");
    }

    const idClean = input.program_id.replace(/-/g, "_");
    const phoneClean = input.customer_phone.replace(/[^\w]/g, "_");
    const classId = `${GW_ISSUER_ID}.waya_loyalty_${idClean}`;
    const objectId = `${GW_ISSUER_ID}.waya_member_${idClean}_${phoneClean}`;

    // Look up / create / update customer_pass
    const { data: existing } = await supabase
      .from("customer_passes")
      .select("*")
      .eq("program_id", input.program_id)
      .eq("customer_phone", input.customer_phone)
      .maybeSingle();
    if (existing) {
      if (existing.google_object_id !== objectId) {
        await supabase
          .from("customer_passes")
          .update({ google_object_id: objectId, customer_name: input.customer_name })
          .eq("id", existing.id);
      }
    } else {
      await supabase.from("customer_passes").insert({
        program_id: input.program_id,
        shop_id: shop.id,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        google_object_id: objectId,
      });
    }

    // Build the loyalty class
    const hexColor = programWithShopName.card_color || "#10B981";
    const loyaltyClass: Record<string, unknown> = {
      id: classId,
      issuerName: "Waya",
      reviewStatus: "UNDER_REVIEW",
      programName: programWithShopName.name || programWithShopName.shop_name,
      hexBackgroundColor: hexColor,
      countryCode: "SA",
    };
    if (isImageUrl(programWithShopName.logo_url || shop?.logo_url)) {
      loyaltyClass.programLogo = {
        sourceUri: { uri: programWithShopName.logo_url || shop.logo_url },
        contentDescription: { defaultValue: { language: "en", value: programWithShopName.shop_name } },
      };
    }
    if (isImageUrl(programWithShopName.background_url)) {
      loyaltyClass.heroImage = {
        sourceUri: { uri: programWithShopName.background_url },
        contentDescription: { defaultValue: { language: "en", value: programWithShopName.name || "Loyalty" } },
      };
    }

    const textModules: any[] = [
      { header: "Shop", body: programWithShopName.name || programWithShopName.shop_name, id: "shop" },
    ];
    if (programWithShopName.reward_title) {
      textModules.push({
        header: "Reward",
        body: programWithShopName.reward_title + (programWithShopName.reward_description ? " — " + programWithShopName.reward_description : ""),
        id: "reward",
      });
    }
    if (programWithShopName.terms) textModules.push({ header: "Terms", body: programWithShopName.terms, id: "terms" });

    const linksModule: any = { uris: [] };
    if (programWithShopName.google_maps_url) linksModule.uris.push({ uri: programWithShopName.google_maps_url, description: "Find us on Maps", id: "maps" });
    if (programWithShopName.website_url) linksModule.uris.push({ uri: programWithShopName.website_url, description: "Website", id: "web" });
    if (programWithShopName.phone) linksModule.uris.push({ uri: `tel:${programWithShopName.phone}`, description: "Call", id: "phone" });

    const loyaltyObject: any = {
      id: objectId,
      classId,
      state: "ACTIVE",
      accountId: input.customer_phone,
      accountName: input.customer_name,
      barcode: { type: "QR_CODE", value: objectId, alternateText: input.customer_name },
      textModulesData: textModules,
    };
    if (linksModule.uris.length > 0) loyaltyObject.linksModuleData = linksModule;

    if (programWithShopName.loyalty_type === "stamp") {
      const need = programWithShopName.stamps_required || 10;
      const max = Math.min(need, 12);
      const row = "\u2606".repeat(max);
      loyaltyObject.loyaltyPoints = { label: `Stamps 0/${need}`, balance: { string: row } };
    } else if (programWithShopName.loyalty_type === "tiered") {
      loyaltyObject.loyaltyPoints = { label: "Points", balance: { int: 0 } };
      loyaltyObject.secondaryLoyaltyPoints = { label: "Tier", balance: { string: "Bronze" } };
    } else if (programWithShopName.loyalty_type === "coupon") {
      loyaltyObject.loyaltyPoints = { label: "Offer", balance: { string: programWithShopName.coupon_discount || "Discount" } };
    } else {
      loyaltyObject.loyaltyPoints = { label: "Points", balance: { int: 0 } };
    }

    if (programWithShopName.expires_at) {
      loyaltyObject.validTimeInterval = { end: { date: new Date(programWithShopName.expires_at).toISOString() } };
    }

    const shopLocations = Array.isArray(shop?.locations) ? shop.locations : [];
    const googleLocations = shopLocations
      .filter((l: any) => typeof l.latitude === "number" && typeof l.longitude === "number")
      .slice(0, 10)
      .map((l: any) => ({ latitude: l.latitude, longitude: l.longitude }));
    if (googleLocations.length > 0) {
      (loyaltyClass as any).locations = googleLocations;
      loyaltyObject.locations = googleLocations;
    }

    const now = Math.floor(Date.now() / 1000);
    const claims = {
      iss: GW_SERVICE_ACCOUNT_EMAIL,
      aud: "google",
      origins: ["https://trywaya.com", "https://www.trywaya.com"],
      typ: "savetowallet",
      iat: now,
      payload: { loyaltyClasses: [loyaltyClass], loyaltyObjects: [loyaltyObject] },
    };

    const jwt = await signJwt(claims);
    const saveUrl = `https://pay.google.com/gp/v/save/${jwt}`;

    try {
      await supabase.from("activity_log").insert({
        shop_id: shop.id,
        customer_name: input.customer_name,
        action: "google_wallet_add",
        points: 0,
      });
    } catch (_) { /* non-fatal */ }

    return new Response(JSON.stringify({ success: true, saveUrl, classId, objectId }), {
      headers: { ...cors, ...rateLimitHeaders(rl), "Content-Type": "application/json" },
    });
  } catch (error) {
    const status = error instanceof ValidationError ? 422 : 400;
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status,
      headers: { ...cors, ...rateLimitHeaders(rl), "Content-Type": "application/json" },
    });
  }
});
