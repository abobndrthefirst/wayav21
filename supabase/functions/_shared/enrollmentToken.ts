// Signed enrollment tokens for the public wallet endpoints.
//
// When a merchant publishes a loyalty program, the server mints a short HMAC
// token bound to (program_id, issued_at, version). The wizard emits
// https://trywaya.com/w/:programId?t=<token>. apple-wallet-public and
// google-wallet-public refuse requests without a valid token. This prevents
// random scripts from enumerating program_ids and spawning fake passes.
//
// We use HMAC-SHA256 over "program_id.iat.v" with a server secret.
// Tokens don't expire by default (merchant may print QR on a sticker), but
// rotating WAYA_ENROLLMENT_SECRET invalidates all outstanding tokens.

const encoder = new TextEncoder();

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function hmac(message: string): Promise<string> {
  const secret = Deno.env.get("WAYA_ENROLLMENT_SECRET");
  if (!secret) throw new Error("WAYA_ENROLLMENT_SECRET not configured");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64Url(sig);
}

export interface EnrollmentTokenPayload {
  program_id: string;
  iat: number;
  v: number;
}

/** Mint a token for a published program. Called server-side only. */
export async function signEnrollmentToken(programId: string): Promise<string> {
  const payload: EnrollmentTokenPayload = {
    program_id: programId,
    iat: Math.floor(Date.now() / 1000),
    v: 1,
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await hmac(body);
  return `${body}.${sig}`;
}

/** Verify a token. Returns payload on success, throws on failure. */
export async function verifyEnrollmentToken(token: string, expectedProgramId: string): Promise<EnrollmentTokenPayload> {
  if (!token || !token.includes(".")) throw new Error("Invalid enrollment token format");
  const [body, sig] = token.split(".");
  const expectedSig = await hmac(body);
  if (!timingSafeEqualStr(expectedSig, sig)) throw new Error("Invalid enrollment token signature");
  let payload: EnrollmentTokenPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
  } catch {
    throw new Error("Malformed enrollment token payload");
  }
  if (payload.v !== 1) throw new Error("Unsupported enrollment token version");
  if (payload.program_id !== expectedProgramId) throw new Error("Enrollment token program_id mismatch");
  return payload;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
