// streampay-sync-products — admin-only endpoint that creates the StreamPay
// products mirroring our `plans` catalog. Idempotent: only touches rows where
// streampay_product_id is null. Re-runnable after partial failures.
//
// Auth:   x-admin-token matches ADMIN_SYNC_TOKEN env secret
// Method: POST
// Body:   none

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, errorResponse, jsonResponse, preflight } from "../_shared/cors.ts";
import { AuthError, requireAdminToken, serviceClient } from "../_shared/auth.ts";
import { streampay, StreamPayError } from "../_shared/streampay.ts";

interface PlanRow {
  id: string;
  tier: number;
  interval: "monthly" | "annual";
  price_sar: number | string;
  streampay_product_id: string | null;
}

const TIER_NAMES: Record<number, string> = {
  1: "Waya Starter",
  2: "Waya Growth",
  3: "Waya Pro",
};

function productName(plan: PlanRow): string {
  const tier = TIER_NAMES[plan.tier] ?? `Waya Tier ${plan.tier}`;
  const cadence = plan.interval === "annual" ? "Annual" : "Monthly";
  return `${tier} — ${cadence}`;
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") {
    return errorResponse(req, "method not allowed", 405);
  }

  try {
    requireAdminToken(req);

    const client = serviceClient();
    const { data: plans, error } = await client
      .from("plans")
      .select("id, tier, interval, price_sar, streampay_product_id")
      .order("tier", { ascending: true })
      .order("interval", { ascending: true });
    if (error) throw error;

    const results: Array<{
      plan_id: string;
      streampay_product_id: string;
      created: boolean;
    }> = [];

    for (const plan of (plans ?? []) as PlanRow[]) {
      if (plan.streampay_product_id) {
        results.push({
          plan_id: plan.id,
          streampay_product_id: plan.streampay_product_id,
          created: false,
        });
        continue;
      }

      const externalId = `waya:${plan.id}`;
      let productId: string | null = null;

      // Check if a product with this external id already exists on StreamPay.
      try {
        const existing = await streampay.listProducts({ external_id: externalId });
        const items = Array.isArray(existing)
          ? existing
          : (existing as { items?: unknown[] }).items ?? [];
        const first = items.find(
          (p): p is { id: string } =>
            !!p && typeof p === "object" && typeof (p as { id?: unknown }).id === "string",
        );
        if (first) productId = first.id;
      } catch (_) {
        // listProducts may not support external_id filter on every deploy — fall through.
      }

      if (!productId) {
        const created = await streampay.createProduct({
          name: productName(plan),
          description: `${plan.price_sar} SAR / ${plan.interval}`,
          price: Number(plan.price_sar),
          currency: "SAR",
          type: "RECURRING",
          recurring_interval: plan.interval === "annual" ? "YEAR" : "MONTH",
          recurring_interval_count: 1,
          external_id: externalId,
        });
        productId = created.id;
      }

      const { error: updateError } = await client
        .from("plans")
        .update({ streampay_product_id: productId })
        .eq("id", plan.id);
      if (updateError) throw updateError;

      await client.from("payment_attempts").insert({
        kind: "sync_product",
        streampay_id: productId,
        status: "synced",
        amount_sar: plan.price_sar,
        raw: { plan_id: plan.id },
      });

      results.push({ plan_id: plan.id, streampay_product_id: productId, created: true });
    }

    return jsonResponse(req, { ok: true, results });
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
    console.error("[streampay-sync-products]", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        ...corsHeaders(req),
        "content-type": "application/json",
      },
    });
  }
});
