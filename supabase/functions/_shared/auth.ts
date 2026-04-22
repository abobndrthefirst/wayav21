// Shared JWT verification for Waya edge functions.
//
// Supabase migrated the project to asymmetric (ES256) signing keys. The
// gateway's HS256-only auto-verifier no longer works, so functions set
// verify_jwt=false and call verifyUser() here instead — against the
// project's JWKS. Works for HS256/ES256/RS256. Fast in-memory JWKS cache,
// local crypto, no HTTP hop per request.

import { createRemoteJWKSet, jwtVerify } from "npm:jose@5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

const JWKS = createRemoteJWKSet(
  new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
  { cacheMaxAge: 10 * 60 * 1000 },
);

export type VerifiedUser = {
  id: string;
  email?: string;
  role?: string;
};

export async function verifyUser(req: Request): Promise<VerifiedUser> {
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Unauthorized: missing token");

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `${SUPABASE_URL}/auth/v1`,
  });

  const sub = payload.sub as string | undefined;
  if (!sub) throw new Error("Unauthorized: token has no subject");

  return {
    id: sub,
    email: payload.email as string | undefined,
    role: payload.role as string | undefined,
  };
}
