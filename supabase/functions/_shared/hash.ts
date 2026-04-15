// Small hashing helpers. Used to avoid storing wallet auth tokens in plaintext.

const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < b.length; i++) out += b[i].toString(16).padStart(2, "0");
  return out;
}

/**
 * SHA-256 of (secret-pepper || value). The pepper defends against
 * offline rainbow-table attacks if the DB leaks. Tokens are 128-bit random,
 * so this is sufficient — no per-value salting needed for our threat model.
 */
export async function hashSecret(value: string): Promise<string> {
  const pepper = Deno.env.get("WAYA_HASH_PEPPER") || "waya-default-pepper-change-me";
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(pepper + "::" + value));
  return toHex(buf);
}

export async function verifySecret(plaintext: string, hashed: string | null | undefined): Promise<boolean> {
  if (!hashed) return false;
  // Support legacy plaintext tokens during rollout: if DB still holds plaintext,
  // accept either exact match or hash match, then callers rewrite on next update.
  if (plaintext === hashed) return true;
  const computed = await hashSecret(plaintext);
  return timingSafeEqual(computed, hashed);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
