// streampay-verify-payment — called by the client after returning from
// StreamPay's hosted checkout. Re-validates everything against StreamPay's API
// (redirect params are only a handoff) and updates the subscription row.
//
// Auth:   Bearer <supabase-user-jwt>
// Method: POST
// Body:   { subscription_id, sig, ts, invoice_id?, payment_id?, subscription_id_sp? }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { logEvent } from "../_shared/events.ts";
import {
  streampay,
  StreamPayError,
  verifyReturnPayload,
  type SPPayment,
  type SPSubscription,
} from "../_shared/streampay.ts";

type WayaStatus =
  | "pending"
  | "active"
  | "past_due"
  | "canceled"
  | "failed"
  | "expired";

function mapStatus(
  payment: SPPayment | null,
  sub: SPSubscription | null,
): WayaStatus {
  const subStatus = sub?.status?.toLowerCase();
  if (subStatus === "active") return "active";
  if (subStatus === "past_due") return "past_due";
  if (subStatus === "canceled" || subStatus === "cancelled") return "canceled";
  if (subStatus === "expired") return "expired";

  const payStatus = payment?.status?.toLowerCase();
  if (payStatus === "paid") return sub ? "active" : "pending";
  if (payStatus === "failed") return "failed";
  if (payStatus === "pending") return "pending";

  return "pending";
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(req, "POST, OPTIONS"),
      "content-type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");
  if (req.method !== "POST") return json(req, { error: "method not allowed" }, 405);

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

    const body = await req.json().catch(() => ({}));
    const subId = String(body?.subscription_id ?? "").trim();
    const sig = String(body?.sig ?? "").trim();
    const ts = Number(body?.ts);

    if (!subId || !sig || !Number.isFinite(ts)) {
      return json(req, { error: "missing subscription_id, sig, or ts" }, 400);
    }

    const { data: sub, error: subErr } = await supabase
      .from("subscriptions")
      .select(
        "id, shop_id, user_id, plan_id, streampay_consumer_id, streampay_subscription_id, streampay_payment_id, streampay_invoice_id, status",
      )
      .eq("id", subId)
      .maybeSingle();
    if (subErr) throw subErr;
    if (!sub) return json(req, { error: "subscription not found" }, 404);
    if (sub.user_id !== user.id) {
      await logEvent({
        event_type: "auth_failed",
        category: "security",
        severity: "warn",
        source: "streampay-verify-payment",
        message: "caller does not own subscription",
        metadata: { subscription_id: subId },
        req,
      });
      return json(req, { error: "forbidden" }, 403);
    }

    const verify = await verifyReturnPayload(subId, sub.plan_id, ts, sig);
    if (!verify.ok) {
      await logEvent({
        event_type: "invalid_signature",
        category: "security",
        severity: "warn",
        source: "streampay-verify-payment",
        message: `Signature check failed: ${verify.reason}`,
        metadata: { subscription_id: subId, reason: verify.reason },
        req,
      });
      return json(req, { error: `invalid signature: ${verify.reason}` }, 400);
    }

    const paymentId = String(body?.payment_id ?? sub.streampay_payment_id ?? "").trim();
    const subscriptionIdSP = String(
      body?.subscription_id_sp ?? sub.streampay_subscription_id ?? "",
    ).trim();
    const invoiceId = String(body?.invoice_id ?? sub.streampay_invoice_id ?? "").trim();

    let payment: SPPayment | null = null;
    if (paymentId) {
      try {
        payment = await streampay.getPayment(paymentId);
      } catch (err) {
        if (!(err instanceof StreamPayError) || err.status !== 404) throw err;
      }
    }

    let subscriptionRemote: SPSubscription | null = null;
    const spSubId = subscriptionIdSP || payment?.subscription_id || "";
    if (spSubId) {
      try {
        subscriptionRemote = await streampay.getSubscription(spSubId);
      } catch (err) {
        if (!(err instanceof StreamPayError) || err.status !== 404) throw err;
      }
    }

    const status = mapStatus(payment, subscriptionRemote);

    const updatePayload: Record<string, unknown> = {
      status,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (payment?.id) updatePayload.streampay_payment_id = payment.id;
    if (invoiceId) updatePayload.streampay_invoice_id = invoiceId;
    else if (payment?.invoice_id) updatePayload.streampay_invoice_id = payment.invoice_id;
    if (spSubId) updatePayload.streampay_subscription_id = spSubId;
    if (subscriptionRemote?.current_period_end) {
      updatePayload.current_period_end = subscriptionRemote.current_period_end;
    }

    const { data: updated, error: updateErr } = await supabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("id", subId)
      .select("*")
      .single();
    if (updateErr) throw updateErr;

    await supabase.from("payment_attempts").insert({
      subscription_id: subId,
      kind: "verify_payment",
      streampay_id: payment?.id ?? spSubId ?? null,
      status,
      amount_sar: payment?.amount ? Number(payment.amount) : null,
      raw: { payment, subscription: subscriptionRemote },
    });

    await logEvent({
      event_type: "streampay_payment_verified",
      category: "business",
      severity: status === "active" ? "info" : status === "failed" ? "error" : "warn",
      source: "streampay-verify-payment",
      shop_id: sub.shop_id,
      metadata: { subscription_id: subId, status },
      req,
    });

    return json(req, { subscription: updated });
  } catch (err) {
    if (err instanceof StreamPayError) {
      return json(req, {
        error: err.message,
        streampay_status: err.status,
        streampay_code: err.code,
        streampay_body: err.body,
      }, 502);
    }
    console.error("[streampay-verify-payment]", err);
    const message = err instanceof Error ? err.message : "internal error";
    return json(req, { error: message }, 500);
  }
});
