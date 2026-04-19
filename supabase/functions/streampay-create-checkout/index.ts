// streampay-create-checkout — creates a StreamPay consumer (if missing), opens
// a payment link pointing at the selected plan, and returns the hosted
// checkout URL for the client to redirect to.
//
// Auth:   Bearer <supabase-user-jwt>
// Method: POST
// Body:   { plan_id: string, phone: string }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { AuthError, requireUser } from "../_shared/auth.ts";
import {
  signReturnPayload,
  streampay,
  StreamPayError,
  type SPConsumer,
} from "../_shared/streampay.ts";

interface RequestBody {
  plan_id?: string;
  phone?: string;
}

const PHONE_RE = /^\+9665[0-9]{8}$/;
const PLAN_ID_RE = /^tier[1-3]_(monthly|annual)$/;

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") {
    return errorResponse(req, "method not allowed", 405);
  }

  try {
    const { user, client } = await requireUser(req);

    const body: RequestBody = await req.json().catch(() => ({}));
    const planId = (body.plan_id ?? "").trim();
    const phone = (body.phone ?? "").trim();

    if (!PLAN_ID_RE.test(planId)) {
      return errorResponse(req, "invalid plan_id", 400);
    }
    if (!PHONE_RE.test(phone)) {
      return errorResponse(req, "invalid phone (expected +9665XXXXXXXX)", 400);
    }

    // ── Resolve shop ────────────────────────────────────────────────────────
    const { data: shop, error: shopError } = await client
      .from("shops")
      .select("id, name, phone")
      .eq("user_id", user.id)
      .maybeSingle();
    if (shopError) throw shopError;
    if (!shop) {
      return errorResponse(req, "shop not found — finish setup first", 412);
    }

    // Persist the phone we collected.
    if (shop.phone !== phone) {
      const { error: updErr } = await client
        .from("shops")
        .update({ phone, updated_at: new Date().toISOString() })
        .eq("id", shop.id);
      if (updErr) throw updErr;
    }

    // ── Load plan ───────────────────────────────────────────────────────────
    const { data: plan, error: planError } = await client
      .from("plans")
      .select("id, tier, interval, price_sar, streampay_product_id")
      .eq("id", planId)
      .maybeSingle();
    if (planError) throw planError;
    if (!plan) return errorResponse(req, "plan not found", 404);
    if (!plan.streampay_product_id) {
      return errorResponse(
        req,
        "plan not yet synced with StreamPay — run streampay-sync-products",
        409,
      );
    }

    // ── Reject if there is already an active/pending subscription ──────────
    const { data: existing, error: existingErr } = await client
      .from("subscriptions")
      .select("id, status")
      .eq("shop_id", shop.id)
      .in("status", ["pending", "active", "past_due"])
      .maybeSingle();
    if (existingErr) throw existingErr;
    if (existing) {
      return errorResponse(req, "existing subscription", 409, {
        existing_subscription_id: existing.id,
        status: existing.status,
      });
    }

    // ── Create or reuse the StreamPay consumer ─────────────────────────────
    const email = user.email ?? undefined;
    let consumer: SPConsumer | null = null;

    try {
      consumer = await streampay.createConsumer({
        name: shop.name ?? email ?? "Waya shop",
        email,
        phone_number: phone,
        external_id: shop.id,
        communication_methods: email ? ["EMAIL"] : ["SMS"],
      });
    } catch (err) {
      if (err instanceof StreamPayError && err.code === "DUPLICATE_CONSUMER") {
        const byEmail = email
          ? await streampay.listConsumers({ email }).catch(() => null)
          : null;
        const items = Array.isArray(byEmail)
          ? byEmail
          : (byEmail as { items?: SPConsumer[] } | null)?.items ?? [];
        consumer = items[0] ?? null;
        if (!consumer) {
          const byPhone = await streampay
            .listConsumers({ phone_number: phone })
            .catch(() => null);
          const phoneItems = Array.isArray(byPhone)
            ? byPhone
            : (byPhone as { items?: SPConsumer[] } | null)?.items ?? [];
          consumer = phoneItems[0] ?? null;
        }
        if (!consumer) throw err;
      } else {
        throw err;
      }
    }

    // ── Pre-insert the pending subscription (so we have an id for the redirect) ──
    const { data: subRow, error: subErr } = await client
      .from("subscriptions")
      .insert({
        shop_id: shop.id,
        user_id: user.id,
        plan_id: plan.id,
        streampay_consumer_id: consumer!.id,
        status: "pending",
      })
      .select("id")
      .single();
    if (subErr) throw subErr;

    const subscriptionId = subRow.id as string;
    const ts = Math.floor(Date.now() / 1000);
    const sig = await signReturnPayload(subscriptionId, plan.id, ts);
    const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");
    if (!siteUrl) throw new Error("SITE_URL env secret is not configured");

    const successUrl =
      `${siteUrl}/billing/return?sub=${encodeURIComponent(subscriptionId)}&sig=${encodeURIComponent(sig)}&ts=${ts}`;
    const failureUrl =
      `${siteUrl}/billing/cancel?sub=${encodeURIComponent(subscriptionId)}`;

    // ── Create the payment link ────────────────────────────────────────────
    const link = await streampay.createPaymentLink({
      name: `Waya — ${plan.id}`,
      description: `Waya subscription (${plan.interval})`,
      items: [{ product_id: plan.streampay_product_id, quantity: 1 }],
      contact_information_type: email ? "EMAIL" : "PHONE",
      currency: "SAR",
      max_number_of_payments: 1,
      organization_consumer_id: consumer!.id,
      success_redirect_url: successUrl,
      failure_redirect_url: failureUrl,
      custom_metadata: {
        waya_subscription_id: subscriptionId,
        waya_shop_id: shop.id,
        waya_plan_id: plan.id,
      },
    });

    // Patch the payment-link id onto the subscription row + log the attempt.
    await client
      .from("subscriptions")
      .update({
        streampay_payment_link_id: link.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    await client.from("payment_attempts").insert({
      subscription_id: subscriptionId,
      kind: "create_link",
      streampay_id: link.id,
      status: link.status ?? "created",
      amount_sar: plan.price_sar,
      raw: { link_id: link.id, plan_id: plan.id },
    });

    return jsonResponse(req, {
      subscription_id: subscriptionId,
      checkout_url: link.url,
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
    console.error("[streampay-create-checkout]", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        ...corsHeaders(req),
        "content-type": "application/json",
      },
    });
  }
});
