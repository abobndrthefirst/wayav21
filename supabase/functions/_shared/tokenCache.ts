// Module-scope caches for Google OAuth access token and APNs JWT.
// Supabase edge runtime reuses isolates for warm invocations, so caching
// here eliminates the OAuth round-trip and the JWT signing for most calls.

import { encode as base64url } from "https://deno.land/std@0.208.0/encoding/base64url.ts";
import { decode as base64decode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

// ─── Google OAuth access-token cache ───
// Google tokens live for 1h; cache for 55 min to give a 5-min safety margin.
interface GoogleTokenCacheEntry { token: string; expiresAt: number; }
let googleTokenCache: GoogleTokenCacheEntry | null = null;

function getGooglePrivateKey(): string {
  let raw = Deno.env.get("GOOGLE_WALLET_PRIVATE_KEY") || "";
  if (raw.trimStart().startsWith("{")) {
    try { raw = JSON.parse(raw).private_key; }
    catch { raw = JSON.parse(raw.replace(/\\n/g, "\n")).private_key; }
  }
  return raw.replace(/\\n/g, "\n");
}

export async function getGoogleAccessToken(): Promise<string> {
  const now = Date.now();
  if (googleTokenCache && googleTokenCache.expiresAt > now + 60_000) {
    return googleTokenCache.token;
  }
  const email = Deno.env.get("GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL");
  if (!email) throw new Error("GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL not configured");
  const pem = getGooglePrivateKey();
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/[\r\n\s]/g, "");
  const der = base64decode(pemBody);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const enc = new TextEncoder();
  const iat = Math.floor(now / 1000);
  const claims = {
    iss: email,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp: iat + 3600,
  };
  const header = base64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = base64url(enc.encode(JSON.stringify(claims)));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(`${header}.${payload}`));
  const jwt = `${header}.${payload}.${base64url(new Uint8Array(sig))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const json = await res.json();
  if (!res.ok) throw new Error("Google OAuth failed: " + JSON.stringify(json));
  googleTokenCache = {
    token: json.access_token,
    expiresAt: now + 55 * 60_000, // cache for 55 minutes
  };
  return json.access_token;
}

// ─── APNs JWT cache ───
// APNs tokens valid for 60 min; cache for 50 to be safe.
interface ApnsJwtCacheEntry { jwt: string; expiresAt: number; }
let apnsJwtCache: ApnsJwtCacheEntry | null = null;

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToBuf(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

export async function getApnsJwt(): Promise<string> {
  const now = Date.now();
  if (apnsJwtCache && apnsJwtCache.expiresAt > now + 60_000) {
    return apnsJwtCache.jwt;
  }
  const keyPem = Deno.env.get("APPLE_APNS_AUTH_KEY");
  const keyId = Deno.env.get("APPLE_APNS_KEY_ID");
  const teamId = Deno.env.get("APPLE_TEAM_ID");
  if (!keyPem || !keyId || !teamId) throw new Error("APNs credentials not configured");
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "ES256", kid: keyId })));
  const payload = b64url(new TextEncoder().encode(JSON.stringify({
    iss: teamId,
    iat: Math.floor(now / 1000),
  })));
  const data = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBuf(keyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(data),
  );
  const jwt = `${data}.${b64url(sig)}`;
  apnsJwtCache = { jwt, expiresAt: now + 50 * 60_000 };
  return jwt;
}
