// POST /delete-account — lets an authenticated merchant permanently delete
// their own account and all owned data.
//
// Required by App Store Guideline 5.1.1(v): apps that let users create an
// account must also offer an in-app way to delete it.
//
// What gets deleted:
//   - auth.users row via admin API — this cascades through the schema:
//     shops.user_id has ON DELETE CASCADE → shop + customer_passes +
//     activity_log + wallet_update_jobs + loyalty_programs all vanish with it.
//
// Hardening:
//   - CORS allowlist
//   - Requires valid JWT — we re-verify with the anon client, never trust
//     a user_id supplied in the body
//   - Idempotent: re-invoking after deletion still returns 200

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");

  try {
    if (req.method !== "POST") throw new Error("Method not allowed");

    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      throw new Error("Unauthorized");
    }

    // Re-verify the JWT so the user_id we act on is derived from the token,
    // never a body-supplied value.
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) throw new Error("Unauthorized");
    const userId = user.id;

    // Service-role client for the admin delete. The `auth.users` row has
    // ON DELETE CASCADE set on `shops.user_id`, so removing the auth row
    // wipes the entire merchant data tree (shops → customer_passes →
    // activity_log → wallet_update_jobs → loyalty_programs) atomically.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: authErr } = await admin.auth.admin.deleteUser(userId);
    if (authErr && !/User not found/i.test(authErr.message)) throw authErr;

    return new Response(
      JSON.stringify({ ok: true, user_id: userId }),
      { status: 200, headers: { ...cors, "content-type": "application/json" } },
    );
  } catch (e) {
    const msg = (e as Error).message || "Internal error";
    const status = /unauthorized/i.test(msg) ? 401 : 400;
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status, headers: { ...cors, "content-type": "application/json" } },
    );
  }
});
