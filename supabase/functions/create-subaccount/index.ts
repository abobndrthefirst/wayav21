// create-subaccount — owner creates (or replaces) a single staff sub-account
// for their shop. MVP: exactly one sub-account per shop, enforced by a
// unique index on shop_members.shop_id.
//
// Flow:
//   1. Auth: caller must own a shop (joined via shops.user_id = auth.uid()).
//   2. Validate: name, email, password (>=8), role ∈ {branch_manager,cashier}.
//   3. Refuse if shop already has a member row.
//   4. Create auth user with admin API (auto-confirm email — no verification
//      loop, since owner is provisioning on behalf of the employee).
//   5. Insert shop_members row.
//
// The service_role client is the only way to create auth users without the
// public sign-up flow; the user client is used only to identify the caller.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";

interface Payload {
  name: string;
  email: string;
  password: string;
  role: "branch_manager" | "cashier";
}

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");

  try {
    const { name, email, password, role } = (await req.json()) as Payload;

    if (!name || name.trim().length < 2) throw new Error("Name must be at least 2 characters");
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Invalid email");
    if (!password || password.length < 8) throw new Error("Password must be at least 8 characters");
    if (role !== "branch_manager" && role !== "cashier") throw new Error("Invalid role");

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Identify caller via their JWT
    const authHeader = req.headers.get("authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Caller must own a shop
    const { data: shop } = await svc
      .from("shops")
      .select("id, name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) throw new Error("No shop found for this account");

    // Refuse if sub-account already exists
    const { data: existing } = await svc
      .from("shop_members")
      .select("id")
      .eq("shop_id", shop.id)
      .maybeSingle();
    if (existing) throw new Error("This shop already has a sub-account. Delete the existing one first.");

    // Create the auth user (auto-confirm since owner is vouching for them)
    const { data: created, error: createErr } = await svc.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { shop_id: shop.id, role, name },
    });
    if (createErr || !created?.user) throw new Error(createErr?.message || "Failed to create user");

    // Insert the member row
    const { data: member, error: memberErr } = await svc
      .from("shop_members")
      .insert({
        shop_id: shop.id,
        user_id: created.user.id,
        name: name.trim(),
        role,
      })
      .select()
      .single();

    if (memberErr) {
      // Roll back the auth user if the member insert failed
      await svc.auth.admin.deleteUser(created.user.id);
      throw new Error(memberErr.message);
    }

    return new Response(
      JSON.stringify({ success: true, member: { id: member.id, name: member.name, email, role: member.role } }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = (err as Error).message;
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      {
        status: /unauthorized/i.test(msg) ? 401 : 400,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  }
});
