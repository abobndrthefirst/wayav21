// streampay-verify-payment — called by the client after the user returns from
// StreamPay's hosted checkout. Re-validates everything against StreamPay's API
// (redirect params are only a handoff) and updates the subscription row.
//
// Auth:   Bearer <supabase-user-jwt>
// Method: POST
// Body:   { subscription_id, sig, ts, invoice_id?, payment_id?, subscription_id_sp? }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { AuthError, requireUser } from "../_shared/auth.ts";
import {
  streampay,
  StreamPayError,
  verifyReturnPayload,
  type SPPayment,
  type SPSubscription,
} from "../_shared/streampay.ts";

interface RequestBody {
  subscription_id?: string;
  sig?: string;
  ts?: number;
  invoice_id?: string;
  payment_id?: string;
  subscription_id_sp?: string;
}

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

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") {
    return errorResponse(req, "method not allowed", 405);
  }

  try {
    const { user, client } = await requireUser(req);
    const body: RequestBody = await req.json().catch(() => ({}));

    const subId = (body.subscription_id ?? "").trim();
    const sig = (body.sig ?? "").trim();
    const ts = Number(body.ts);

    if (!subId || !sig || !Number.isFinite(ts)) {
      return errorResponse(req, "missing subscription_id, sig, or ts", 400);
    }

    const { data: sub, error: subErr } = await client
      .from("subscriptions")
      .select(
        "id, shop_id, user_id, plan_id, streampay_consumer_id, streampay_subscription_id, streampay_payment_id, streampay_invoice_id, status",
      )
      .eq("id", subId)
      .maybeSingle();
    if (subErr) throw subErr;
    if (!sub) return errorResponse(req, "subscription not found", 404);
    if (sub.user_id !== user.id) {
      return errorResponse(req, "forbidden", 403);
    }

    const verify = await verifyReturnPayload(subId, sub.plan_id, ts, sig);
    if (!verify.ok) {
      return errorResponse(req, `invalid signature: ${verify.reason}`, 400);
    }

    const paymentId = (body.payment_id ?? sub.streampay_payment_id ?? "").trim();
    const subscriptionIdSP =
      (body.subscription_id_sp ?? sub.streampay_subscription_id ?? "").trim();
    const invoiceId = (body.invoice_id ?? sub.streampay_invoice_id ?? "").trim();

    // Pull the truth from StreamPay. Both queries are optional — we call what
    // we have ids for and tolerate 404s (treat as pending for now).
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

    const { data: updated, error: updateErr } = await client
      .from("subscriptions")
      .update(updatePayload)
      .eq("id", subId)
      .select("*")
      .single();
    if (updateErr) throw updateErr;

    await client.from("payment_attempts").insert({
      subscription_id: subId,
      kind: "verify_payment",
      streampay_id: payment?.id ?? spSubId ?? null,
      status,
      amount_sar: payment?.amount ? Number(payment.amount) : null,
      raw: { payment, subscription: subscriptionRemote },
    });

    return jsonResponse(req, { subscription: updated });
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
    console.error("[streampay-verify-payment]", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        ...corsHeaders(req),
        "content-type": "application/json",
      },
    });
  }
});
