// streampay-create-checkout — creates a StreamPay consumer (if missing), opens
// a hosted payment link pointing at the selected plan, and returns the URL
// for the client to redirect to. Pre-inserts a `subscriptions` row so we have
// an id to sign into the return URL.
//
// Auth:   Bearer <supabase-user-jwt>
// Method: POST
// Body:   { plan_id: string, phone: string }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { logEvent } from "../_shared/events.ts";
import { normalizeKsaPhone } from "../_shared/validation.ts";
import {
  signReturnPayload,
  streampay,
  StreamPayError,
  type SPConsumer,
} from "../_shared/streampay.ts";

const PLAN_ID_RE = /^tier[1-3]_(monthly|annual)$/;

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
    // ── Auth: validate caller's JWT via user-scoped client ──
    const authHeader = req.headers.get("authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      await logEvent({
        event_type: "auth_failed",
        category: "security",
        severity: "warn",
        source: "streampay-create-checkout",
        req,
      });
      return json(req, { error: "unauthorized" }, 401);
    }

    // ── Service-role client for all writes (bypasses RLS) ──
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const planId = String(body?.plan_id ?? "").trim();
    const phone = normalizeKsaPhone(body?.phone);

    if (!PLAN_ID_RE.test(planId)) {
      return json(req, { error: "invalid plan_id" }, 400);
    }
    if (!phone) {
      return json(req, { error: "invalid phone" }, 400);
    }

    // ── Resolve shop for this user ──
    const { data: shop, error: shopErr } = await supabase
      .from("shops")
      .select("id, name, phone")
      .eq("user_id", user.id)
      .maybeSingle();
    if (shopErr) throw shopErr;
    if (!shop) {
      return json(req, { error: "shop not found — finish setup first" }, 412);
    }

    if (shop.phone !== phone) {
      const { error: updErr } = await supabase
        .from("shops")
        .update({ phone, updated_at: new Date().toISOString() })
        .eq("id", shop.id);
      if (updErr) throw updErr;
    }

    // ── Load plan ──
    const { data: plan, error: planErr } = await supabase
      .from("plans")
      .select("id, tier, interval, price_sar, streampay_product_id")
      .eq("id", planId)
      .maybeSingle();
    if (planErr) throw planErr;
    if (!plan) return json(req, { error: "plan not found" }, 404);
    if (!plan.streampay_product_id) {
      return json(req, {
        error: "plan not yet synced with StreamPay — run streampay-sync-products",
      }, 409);
    }

    // ── Reject if there is already an active/pending subscription ──
    const { data: existing, error: existingErr } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("shop_id", shop.id)
      .in("status", ["pending", "active", "past_due"])
      .maybeSingle();
    if (existingErr) throw existingErr;
    if (existing) {
      return json(req, {
        error: "existing subscription",
        existing_subscription_id: existing.id,
        status: existing.status,
      }, 409);
    }

    // ── Create or reuse StreamPay consumer ──
    // StreamPay sandbox mode rejects any consumer whose email/phone doesn't
    // match the organization owner's. When testing in sandbox, set both
    // STREAMPAY_SANDBOX_EMAIL and STREAMPAY_SANDBOX_PHONE to override what
    // we send to StreamPay (the real user's email/phone are still persisted
    // on the local `shops` and `subscriptions` tables). Leave both unset in
    // production.
    const sandboxEmail = Deno.env.get("STREAMPAY_SANDBOX_EMAIL")?.trim();
    const sandboxPhone = Deno.env.get("STREAMPAY_SANDBOX_PHONE")?.trim();
    const email = sandboxEmail || user.email || undefined;
    const streampayPhone = sandboxPhone || phone;
    let consumer: SPConsumer | null = null;
    try {
      consumer = await streampay.createConsumer({
        name: shop.name ?? email ?? "Waya shop",
        email,
        phone_number: streampayPhone,
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
            .listConsumers({ phone_number: streampayPhone })
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

    // ── Pre-insert pending subscription so we have an id to sign into the URL ──
    const { data: subRow, error: subErr } = await supabase
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

    // ── Create the payment link ──
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

    await supabase
      .from("subscriptions")
      .update({
        streampay_payment_link_id: link.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    await supabase.from("payment_attempts").insert({
      subscription_id: subscriptionId,
      kind: "create_link",
      streampay_id: link.id,
      status: link.status ?? "created",
      amount_sar: plan.price_sar,
      raw: { link_id: link.id, plan_id: plan.id },
    });

    await logEvent({
      event_type: "streampay_checkout_created",
      category: "business",
      source: "streampay-create-checkout",
      shop_id: shop.id,
      metadata: { subscription_id: subscriptionId, plan_id: plan.id },
      req,
    });

    return json(req, {
      subscription_id: subscriptionId,
      checkout_url: link.url,
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
    console.error("[streampay-create-checkout]", err);
    const message = err instanceof Error ? err.message : "internal error";
    return json(req, { error: message }, 500);
  }
});
