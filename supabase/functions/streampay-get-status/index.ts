// streampay-get-status — returns the caller's latest subscription. If we have
// a remote StreamPay subscription id and our cache is older than 5 minutes,
// we refresh from StreamPay before responding.
//
// Auth:   Bearer <supabase-user-jwt>
// Method: GET or POST

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { streampay, StreamPayError } from "../_shared/streampay.ts";

const SYNC_TTL_MS = 5 * 60 * 1000;

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(req, "GET, POST, OPTIONS"),
      "content-type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return preflightResponse(req, "GET, POST, OPTIONS");
  if (req.method !== "GET" && req.method !== "POST") {
    return json(req, { error: "method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json(req, { error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Belt-and-braces: the pg_cron job does this every minute, but run it
    // on read too so a user returning to /billing never sees a stale pending
    // row that's already past its 10-min checkout window.
    await supabase.rpc("expire_stale_pending_subscriptions").catch(() => {});

    // Read shop info alongside subscription so the client gets a single
    // truth-of-record for both subscription state AND the shop-level status.
    const [{ data: subs, error: subsErr }, { data: shop }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select(
          "id, shop_id, user_id, plan_id, status, streampay_subscription_id, current_period_end, last_synced_at, updated_at, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("shops")
        .select("id, account_status, first_activated_at, trial_ends_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    if (subsErr) throw subsErr;

    const sub = subs?.[0] ?? null;
    const shopStatus = {
      account_status: shop?.account_status ?? "on_trial",
      first_activated_at: shop?.first_activated_at ?? null,
      trial_ends_at: shop?.trial_ends_at ?? null,
    };

    if (!sub) {
      return json(req, {
        subscription: null,
        hasActive: false,
        shop: shopStatus,
      });
    }

    let current = sub;
    const lastSynced = sub.last_synced_at ? new Date(sub.last_synced_at).getTime() : 0;
    const stale = Date.now() - lastSynced > SYNC_TTL_MS;

    if (stale && sub.streampay_subscription_id) {
      try {
        const remote = await streampay.getSubscription(sub.streampay_subscription_id);
        const remoteStatus = remote.status?.toLowerCase();
        const map: Record<string, string> = {
          active: "active",
          past_due: "past_due",
          canceled: "canceled",
          cancelled: "canceled",
          expired: "expired",
        };
        const mapped = map[remoteStatus ?? ""] ?? sub.status;
        const { data: updated, error: updateErr } = await supabase
          .from("subscriptions")
          .update({
            status: mapped,
            current_period_end: remote.current_period_end ?? sub.current_period_end,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id)
          .select(
            "id, shop_id, user_id, plan_id, status, streampay_subscription_id, current_period_end, last_synced_at, updated_at, created_at",
          )
          .single();
        if (!updateErr && updated) current = updated;
        await supabase.from("payment_attempts").insert({
          subscription_id: sub.id,
          kind: "get_subscription",
          streampay_id: sub.streampay_subscription_id,
          status: mapped,
          raw: { remote },
        });
      } catch (err) {
        console.warn("[streampay-get-status] refresh failed", err);
      }
    }

    return json(req, {
      subscription: current,
      hasActive: current.status === "active",
      shop: shopStatus,
    });
  } catch (err) {
    if (err instanceof StreamPayError) {
      return json(req, {
        error: err.message,
        streampay_status: err.status,
        streampay_code: err.code,
        streampay_body: err.body,
      }, 502);
    }
    console.error("[streampay-get-status]", err);
    const message = err instanceof Error ? err.message : "internal error";
    return json(req, { error: message }, 500);
  }
});
