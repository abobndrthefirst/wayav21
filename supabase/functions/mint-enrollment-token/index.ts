// Mints a signed enrollment token for a loyalty program.
// Called by the merchant dashboard after publishing a program; the token
// is then embedded in the shareable https://trywaya.com/w/:programId?t=...
// link and every wallet-public request must carry it.
//
// Auth: requires a valid user JWT AND the user must own the shop that owns
// the program. Service-role callers (e.g. apple-passkit internal re-issue)
// mint their own tokens directly via _shared/enrollmentToken.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { signEnrollmentToken } from "../_shared/enrollmentToken.ts";
import { isUuid } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");

  try {
    const { program_id } = await req.json();
    if (!isUuid(program_id)) throw new Error("Invalid program_id");

    const authHeader = req.headers.get("authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: prog } = await svc
      .from("loyalty_programs")
      .select("id, shop:shops(user_id)")
      .eq("id", program_id)
      .single();
    if (!prog || (prog as any).shop?.user_id !== user.id) {
      throw new Error("Program not found or not yours");
    }

    const token = await signEnrollmentToken(program_id);
    return new Response(JSON.stringify({ success: true, token }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
