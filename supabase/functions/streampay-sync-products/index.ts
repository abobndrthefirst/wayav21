// streampay-sync-products — admin-only endpoint that mirrors the plans catalog
// into StreamPay. Idempotent: only acts on rows whose streampay_product_id is
// NULL. Re-runnable after partial failures.
//
// Auth:   x-admin-token header matches ADMIN_SYNC_TOKEN env secret.
// Method: POST
// Body:   none

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { logEvent } from "../_shared/events.ts";
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

function json(
  req: Request,
  body: unknown,
  status = 200,
): Response {
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
    const expected = Deno.env.get("ADMIN_SYNC_TOKEN") ?? "";
    const header = req.headers.get("x-admin-token") ?? "";
    if (!expected || !header || header !== expected) {
      return json(req, { error: "admin token required" }, 403);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: plans, error } = await supabase
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
        // Filter not supported everywhere — fall through and create.
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

      const { error: updateError } = await supabase
        .from("plans")
        .update({ streampay_product_id: productId })
        .eq("id", plan.id);
      if (updateError) throw updateError;

      await supabase.from("payment_attempts").insert({
        kind: "sync_product",
        streampay_id: productId,
        status: "synced",
        amount_sar: plan.price_sar,
        raw: { plan_id: plan.id },
      });

      await logEvent({
        event_type: "streampay_product_synced",
        category: "tech",
        source: "streampay-sync-products",
        message: `Product synced: ${plan.id}`,
        metadata: { plan_id: plan.id, streampay_product_id: productId },
      });

      results.push({ plan_id: plan.id, streampay_product_id: productId, created: true });
    }

    return json(req, { ok: true, results });
  } catch (err) {
    if (err instanceof StreamPayError) {
      return json(req, {
        error: err.message,
        streampay_status: err.status,
        streampay_code: err.code,
        streampay_body: err.body,
      }, 502);
    }
    console.error("[streampay-sync-products]", err);
    const message = err instanceof Error ? err.message : "internal error";
    return json(req, { error: message }, 500);
  }
});
