// Bumps points/stamps on a customer_pass and ENQUEUES wallet update jobs.
// The actual outbound push (APNs + Google Wallet) is handled async by the
// `process-wallet-jobs` worker, so merchants don't wait 200-2000ms per stamp
// and transient push failures don't surface as merchant errors.
//
// Hardening:
//   - CORS allowlist
//   - Idempotency-Key header (or body.client_request_id) prevents duplicate
//     stamps on retries. Uses activity_log.client_request_id UNIQUE constraint.
//   - Queue insert uses the same idempotency_key so retries don't enqueue
//     duplicate pushes (UNIQUE partial index on wallet_update_jobs).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { events, logEvent } from "../_shared/events.ts";

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

    // ── Reward accumulation loop ──
    // When stamps or points cross the threshold, increment rewards_balance
    // and reset the counter to the remainder so the customer loops again.
    const program = pass.program;
    let rewardsEarned = 0;

    if (program?.loyalty_type === "stamp" && updates.stamps != null) {
      const need = program.stamps_required || 10;
      if (updates.stamps >= need) {
        rewardsEarned = Math.floor(updates.stamps / need);
        updates.stamps = updates.stamps % need;
        updates.rewards_balance = (pass.rewards_balance || 0) + rewardsEarned;
      }
    } else if (program?.loyalty_type === "points" && updates.points != null) {
      const need = program.reward_threshold || 10;
      if (updates.points >= need) {
        rewardsEarned = Math.floor(updates.points / need);
        updates.points = updates.points % need;
        updates.rewards_balance = (pass.rewards_balance || 0) + rewardsEarned;
      }
    }

    if (program?.loyalty_type === "tiered" && program?.tiers && updates.points != null) {
      const sortedTiers = [...program.tiers].sort((a: any, b: any) => b.threshold - a.threshold);
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

    // ─────────────────────────────────────────────────────────────────────────
    // ENQUEUE push jobs (async). We don't await delivery — the worker does it.
    // ─────────────────────────────────────────────────────────────────────────
    const enqueued: { kind: string; count: number }[] = [];

    // Apple: one job per registered device (separate jobs so partial failures
    // can retry independently).
    if (pass.apple_serial) {
      try {
        const { data: regs } = await supabase
          .from("apple_device_registrations")
          .select("push_token")
          .eq("serial_number", pass.apple_serial);
        const rows = (regs || []).map((r: any) => ({
          kind: "apple_apns",
          customer_pass_id: pass.id,
          shop_id: pass.shop_id,
          payload: { push_token: r.push_token },
          idempotency_key: idempotencyKey,
        }));
        if (rows.length > 0) {
          // Use upsert on the unique (kind, customer_pass_id, idempotency_key)
          // partial index so retries don't double-enqueue.
          const { error: insErr } = await supabase.from("wallet_update_jobs")
            .upsert(rows, { onConflict: "kind,customer_pass_id,idempotency_key", ignoreDuplicates: true });
          if (insErr) throw insErr;
          enqueued.push({ kind: "apple_apns", count: rows.length });
        }
      } catch (err) {
        // Enqueue failure isn't fatal to the merchant request; log and move on.
        console.error("enqueue apple jobs:", err);
        logEvent({
          event_type: "wallet_enqueue_failed",
          category: "tech",
          severity: "warn",
          source: "points-update",
          shop_id: pass.shop_id,
          customer_pass_id: pass.id,
          message: `Failed to enqueue apple_apns jobs: ${(err as Error).message}`,
          error_code: "ENQUEUE_APPLE_FAIL",
        });
      }
    }

    // Google: one job per pass (the google-wallet-update function handles the
    // single LoyaltyObject PATCH).
    if (pass.google_object_id) {
      try {
        const { error: insErr } = await supabase.from("wallet_update_jobs")
          .upsert([{
            kind: "google_wallet",
            customer_pass_id: pass.id,
            shop_id: pass.shop_id,
            payload: { google_object_id: pass.google_object_id },
            idempotency_key: idempotencyKey,
          }], { onConflict: "kind,customer_pass_id,idempotency_key", ignoreDuplicates: true });
        if (insErr) throw insErr;
        enqueued.push({ kind: "google_wallet", count: 1 });
      } catch (err) {
        console.error("enqueue google job:", err);
        logEvent({
          event_type: "wallet_enqueue_failed",
          category: "tech",
          severity: "warn",
          source: "points-update",
          shop_id: pass.shop_id,
          customer_pass_id: pass.id,
          message: `Failed to enqueue google_wallet job: ${(err as Error).message}`,
          error_code: "ENQUEUE_GOOGLE_FAIL",
        });
      }
    }

    // Business event: what actually happened (points vs stamp vs reward redemption)
    const actionStr = action || (points_delta ? "add_points" : stamps_delta ? "add_stamp" : "update");
    const isRedemption = actionStr === "redeem_reward" || (typeof set_points === "number" && set_points === 0 && (pass.points || 0) > 0);
    if (isRedemption) {
      events.rewardRedeemed({
        source: "points-update",
        shop_id: pass.shop_id,
        program_id: pass.program_id,
        customer_pass_id: pass.id,
        message: `Reward redeemed for ${pass.customer_name || "member"}`,
        metadata: { prior_points: pass.points, prior_stamps: pass.stamps, enqueued },
        request_id: idempotencyKey,
      });
    } else {
      events.pointsAdded({
        source: "points-update",
        shop_id: pass.shop_id,
        program_id: pass.program_id,
        customer_pass_id: pass.id,
        message: `${actionStr}: Δpoints=${points_delta || 0} Δstamps=${stamps_delta || 0}`,
        metadata: {
          action: actionStr, points_delta, stamps_delta,
          new_points: updates.points, new_stamps: updates.stamps, new_tier: updates.tier,
          enqueued,
        },
        request_id: idempotencyKey,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      pass: { ...pass, ...updates },
      enqueued,
      idempotency_key: idempotencyKey,
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = (err as Error).message;
    logEvent({
      event_type: "points_update_failed",
      category: "tech",
      severity: /unauthorized|not your/i.test(msg) ? "warn" : "error",
      source: "points-update",
      message: msg,
      error_code: /unauthorized/i.test(msg) ? "AUTH_FAILED" : "POINTS_UPDATE_FAIL",
      req,
    });
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
