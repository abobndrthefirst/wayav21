// Auth helpers for Waya edge functions. Validates the caller's Supabase JWT
// using the service-role client and returns the authenticated user.

import { createClient, type SupabaseClient, type User } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export function serviceClient(): SupabaseClient {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured for edge function",
    );
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export class AuthError extends Error {
  readonly status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Extracts the Bearer token from the request and returns the authenticated user.
 * Throws `AuthError` with the right HTTP status if the token is missing/invalid.
 */
export async function requireUser(req: Request): Promise<{
  user: User;
  client: SupabaseClient;
  token: string;
}> {
  const authHeader = req.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new AuthError("missing bearer token", 401);
  const token = match[1];

  const client = serviceClient();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    throw new AuthError("invalid or expired session", 401);
  }
  return { user: data.user, client, token };
}

/** Admin-endpoint gate — compares the incoming header to ADMIN_SYNC_TOKEN. */
export function requireAdminToken(req: Request): void {
  const header = req.headers.get("x-admin-token") ?? "";
  const expected = Deno.env.get("ADMIN_SYNC_TOKEN") ?? "";
  if (!expected || !header || header !== expected) {
    throw new AuthError("admin token required", 403);
  }
}
