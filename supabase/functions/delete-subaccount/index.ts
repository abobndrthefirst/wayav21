// delete-subaccount — owner removes the single sub-account on their shop.
// Deletes the shop_members row AND the auth.users row so the email is
// freed for re-use. ON DELETE CASCADE from auth.users → shop_members
// also cleans up, but we're explicit to stay in one transaction path.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");

  try {
    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: shop } = await svc
      .from("shops")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) throw new Error("No shop found");

    const { data: member } = await svc
      .from("shop_members")
      .select("id, user_id")
      .eq("shop_id", shop.id)
      .maybeSingle();
    if (!member) {
      return new Response(JSON.stringify({ success: true, removed: null }),
        { headers: { ...cors, "Content-Type": "application/json" } });
    }

    await svc.from("shop_members").delete().eq("id", member.id);
    await svc.auth.admin.deleteUser(member.user_id);

    return new Response(JSON.stringify({ success: true, removed: member.id }),
      { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = (err as Error).message;
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: /unauthorized/i.test(msg) ? 401 : 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
