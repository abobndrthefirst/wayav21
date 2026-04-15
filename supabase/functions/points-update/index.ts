// Bumps points/stamps on a customer_pass and triggers wallet update notifications:
//   - Apple: APNs push to all device registrations for the pass serial
//   - Google: PATCH the LoyaltyObject (delegated to google-wallet-update)
//
// Hardening:
//   - CORS allowlist
//   - Idempotency-Key header (or body.client_request_id) prevents duplicate
//     stamps on retries. Uses activity_log.client_request_id UNIQUE constraint.
//   - APNs JWT cached (50 min TTL) via _shared/tokenCache
//
// Required env (for Apple APNs):
//   APPLE_APNS_AUTH_KEY   APPLE_APNS_KEY_ID   APPLE_TEAM_ID   APPLE_PASS_TYPE_ID

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { getApnsJwt } from "../_shared/tokenCache.ts";

async function sendAPNs(pushToken: string, jwt: string, topic: string): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(`https://api.push.apple.com/3/device/${pushToken}`, {
    method: "POST",
    headers: {
      "authorization": `bearer ${jwt}`,
      "apns-topic": topic,
      "apns-push-type": "background",
      "apns-priority": "5",
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");

  try {
    const payload = await req.json();
    const { pass_id, points_delta, stamps_delta, set_points, set_stamps, set_tier, action } = payload;
    if (!pass_id) throw new Error("Missing pass_id");

    // Idempotency key: required for stamp/points mutations to prevent
    // double-charging on retries. If missing, we generate one so the insert
    // always has a value, but we RECOMMEND clients send a stable key.
    const idempotencyKey: string = req.headers.get("x-idempotency-key")
      || payload.client_request_id
      || crypto.randomUUID();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: pass } = await supabase.from("customer_passes")
      .select("*, shop:shops(user_id), program:loyalty_programs(*)")
      .eq("id", pass_id).single();
    if (!pass) throw new Error("Pass not found");
    if (pass.shop?.user_id !== user.id) throw new Error("Not your customer");

    // Idempotency check: if activity_log already has this (shop_id, client_request_id)
    // pair, short-circuit and return the existing state. Requires UNIQUE index.
    const { data: priorLog } = await supabase
      .from("activity_log")
      .select("id")
      .eq("shop_id", pass.shop_id)
      .eq("client_request_id", idempotencyKey)
      .maybeSingle();
    if (priorLog) {
      return new Response(JSON.stringify({
        success: true,
        idempotent_replay: true,
        pass,
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    const updates: any = { updated_at: new Date().toISOString(), last_visit_at: new Date().toISOString() };
    if (typeof set_points === "number") updates.points = set_points;
    else if (typeof points_delta === "number") updates.points = (pass.points || 0) + points_delta;
    if (typeof set_stamps === "number") updates.stamps = set_stamps;
    else if (typeof stamps_delta === "number") updates.stamps = (pass.stamps || 0) + stamps_delta;
    if (set_tier) updates.tier = set_tier;

    if (pass.program?.loyalty_type === "tiered" && pass.program?.tiers && updates.points != null) {
      const sortedTiers = [...pass.program.tiers].sort((a: any, b: any) => b.threshold - a.threshold);
      const t = sortedTiers.find((x: any) => updates.points >= (x.threshold || 0));
      if (t) updates.tier = t.name;
    }

    await supabase.from("customer_passes").update(updates).eq("id", pass_id);

    // Insert activity_log with idempotency key. UNIQUE constraint makes
    // duplicate retries fail gracefully (we already bailed above).
    try {
      await supabase.from("activity_log").insert({
        shop_id: pass.shop_id,
        customer_name: pass.customer_name,
        action: action || (points_delta ? "add_points" : stamps_delta ? "add_stamp" : "update"),
        points: points_delta || stamps_delta || 0,
        client_request_id: idempotencyKey,
      });
    } catch (err) {
      // Likely a race on the UNIQUE index — fine, another request won.
      console.warn("[points-update] activity_log insert:", (err as Error).message);
    }

    // Trigger Apple APNs push to all registered devices
    const apnsResults: any[] = [];
    if (pass.apple_serial) {
      try {
        const { data: regs } = await supabase
          .from("apple_device_registrations")
          .select("push_token")
          .eq("serial_number", pass.apple_serial);
        if (regs && regs.length > 0) {
          const jwt = await getApnsJwt();
          const topic = Deno.env.get("APPLE_PASS_TYPE_ID")!;
          for (const r of regs) {
            const result = await sendAPNs(r.push_token, jwt, topic);
            apnsResults.push({ token: r.push_token.slice(0, 8) + "...", ...result });
            // Mark dead registrations for later cleanup (410 = unregistered)
            if (result.status === 410) {
              try {
                await supabase.from("apple_device_registrations")
                  .update({ last_apns_status: 410, last_apns_at: new Date().toISOString() })
                  .eq("push_token", r.push_token);
              } catch {}
            }
          }
        }
      } catch (err) {
        console.error("APNs error:", err);
        apnsResults.push({ error: (err as Error).message });
      }
    }

    // Trigger Google Wallet update (delegate)
    let googleResult: any = null;
    if (pass.google_object_id) {
      try {
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/google-wallet-update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pass_id }),
        });
        googleResult = { status: r.status };
      } catch (err) {
        googleResult = { error: (err as Error).message };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      pass: { ...pass, ...updates },
      apns: apnsResults,
      google: googleResult,
      idempotency_key: idempotencyKey,
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
