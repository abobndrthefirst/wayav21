// streampay-get-status — returns the caller's latest subscription. If there is
// an attached StreamPay subscription id and we haven't synced in the last 5
// minutes, we refresh from StreamPay before answering.
//
// Auth:   Bearer <supabase-user-jwt>
// Method: GET or POST (either works)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { AuthError, requireUser } from "../_shared/auth.ts";
import { streampay, StreamPayError } from "../_shared/streampay.ts";

const SYNC_TTL_MS = 5 * 60 * 1000;

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "GET" && req.method !== "POST") {
    return errorResponse(req, "method not allowed", 405);
  }

  try {
    const { user, client } = await requireUser(req);

    const { data: subs, error } = await client
      .from("subscriptions")
      .select(
        "id, shop_id, user_id, plan_id, status, streampay_subscription_id, current_period_end, last_synced_at, updated_at, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;

    const sub = subs?.[0] ?? null;

    // No subscription at all — fine, tell the client and exit.
    if (!sub) {
      return jsonResponse(req, { subscription: null, hasActive: false });
    }

    // Refresh from StreamPay if we have a remote id and the cache is stale.
    let current = sub;
    const lastSynced = sub.last_synced_at
      ? new Date(sub.last_synced_at).getTime()
      : 0;
    const stale = Date.now() - lastSynced > SYNC_TTL_MS;

    if (stale && sub.streampay_subscription_id) {
      try {
        const remote = await streampay.getSubscription(
          sub.streampay_subscription_id,
        );
        const remoteStatus = remote.status?.toLowerCase();
        const map: Record<string, string> = {
          active: "active",
          past_due: "past_due",
          canceled: "canceled",
          cancelled: "canceled",
          expired: "expired",
        };
        const mapped = map[remoteStatus ?? ""] ?? sub.status;
        const { data: updated, error: updateErr } = await client
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
        await client.from("payment_attempts").insert({
          subscription_id: sub.id,
          kind: "get_subscription",
          streampay_id: sub.streampay_subscription_id,
          status: mapped,
          raw: { remote },
        });
      } catch (err) {
        // Don't fail the whole status call just because the refresh failed —
        // return the cached row instead.
        console.warn("[streampay-get-status] refresh failed", err);
      }
    }

    return jsonResponse(req, {
      subscription: current,
      hasActive: current.status === "active",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(req, err.message, err.status);
    }
    if (err instanceof StreamPayError) {
      return errorResponse(req, err.message, 502, {
        streampay_status: err.status,
        streampay_code: err.code,
        streampay_body: err.body,
      });
    }
    const message = err instanceof Error ? err.message : "internal error";
    console.error("[streampay-get-status]", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        ...corsHeaders(req),
        "content-type": "application/json",
      },
    });
  }
});
