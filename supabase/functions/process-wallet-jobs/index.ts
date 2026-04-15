// Worker for the wallet_update_jobs queue.
//
// Invoked by pg_cron every 30s (see migration 0008). Each invocation:
//   1. Claims up to BATCH_SIZE pending jobs via claim_wallet_update_jobs()
//      (FOR UPDATE SKIP LOCKED — safe under concurrent workers).
//   2. Dispatches each job to the right handler (apple_apns / google_wallet).
//   3. On success: status='done'.
//      On failure below max_attempts: status='pending', run_after=backoff.
//      On failure at/past max_attempts: status='dead'.
//   4. Emits one `events` row per terminal outcome so /admin/events reflects
//      real push delivery, not merchant-side enqueue.
//
// Auth:
//   Bearer <WAYA_CRON_SECRET>   (same pattern as apple-device-cleanup)
//
// Env it reads:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WAYA_CRON_SECRET
//   APPLE_APNS_AUTH_KEY, APPLE_APNS_KEY_ID, APPLE_TEAM_ID, APPLE_PASS_TYPE_ID

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { getApnsJwt } from "../_shared/tokenCache.ts";
import { events, logEvent } from "../_shared/events.ts";

const BATCH_SIZE = 25;

// Exponential backoff in seconds, capped.
// attempts 1→30s, 2→2m, 3→8m, 4→30m, 5+→2h
function backoffSeconds(attempts: number): number {
  const base = 30 * Math.pow(4, Math.max(0, attempts - 1));
  return Math.min(base, 2 * 60 * 60);
}

interface Job {
  id: string;
  kind: "apple_apns" | "google_wallet";
  customer_pass_id: string | null;
  shop_id: string | null;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
  idempotency_key: string | null;
}

async function sendAPNs(pushToken: string, jwt: string, topic: string) {
  const res = await fetch(`https://api.push.apple.com/3/device/${pushToken}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
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

async function runApple(supabase: any, job: Job) {
  const pushToken = (job.payload?.push_token as string) || "";
  if (!pushToken) throw new Error("Missing push_token in payload");
  const jwt = await getApnsJwt();
  const topic = Deno.env.get("APPLE_PASS_TYPE_ID") || "";
  const r = await sendAPNs(pushToken, jwt, topic);

  // Dead token → don't retry; mark the registration and let nightly cleanup remove it.
  if (r.status === 410) {
    await supabase
      .from("apple_device_registrations")
      .update({ last_apns_status: 410, last_apns_at: new Date().toISOString() })
      .eq("push_token", pushToken);
    return { terminal: true, ok: false, status: r.status, body: r.body, deadToken: true };
  }
  if (!r.ok) {
    return { terminal: false, ok: false, status: r.status, body: r.body };
  }
  return { terminal: true, ok: true, status: r.status };
}

async function runGoogle(_supabase: any, job: Job) {
  const passId = job.customer_pass_id;
  if (!passId) throw new Error("Missing customer_pass_id");
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/google-wallet-update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pass_id: passId }),
  });
  const body = await r.text().catch(() => "");
  return { terminal: r.ok, ok: r.ok, status: r.status, body };
}

async function finalizeJob(supabase: any, job: Job, outcome: {
  ok: boolean;
  terminal: boolean;
  status?: number;
  body?: string;
  deadToken?: boolean;
}) {
  const now = new Date().toISOString();
  if (outcome.ok) {
    await supabase.from("wallet_update_jobs")
      .update({ status: "done", finished_at: now, last_error: null, last_error_code: null })
      .eq("id", job.id);
    return;
  }

  // Failed. Either retry, or mark dead.
  const code = outcome.deadToken ? `${job.kind.toUpperCase()}_410` :
               outcome.status ? `${job.kind.toUpperCase()}_${outcome.status}` : `${job.kind.toUpperCase()}_ERR`;
  const err = (outcome.body || "").slice(0, 500) || `status ${outcome.status || "unknown"}`;

  // Terminal-no-retry (e.g. 410 dead token, or attempts exhausted)
  const dead = outcome.deadToken || job.attempts >= job.max_attempts;

  if (dead) {
    await supabase.from("wallet_update_jobs")
      .update({
        status: "dead",
        finished_at: now,
        last_error: err,
        last_error_code: code,
      })
      .eq("id", job.id);

    if (job.kind === "apple_apns") {
      events.apnsFailed({
        source: "process-wallet-jobs",
        shop_id: job.shop_id || undefined,
        customer_pass_id: job.customer_pass_id || undefined,
        message: `APNs delivery gave up after ${job.attempts} attempts: ${err}`,
        error_code: code,
        metadata: { job_id: job.id, attempts: job.attempts, dead_token: !!outcome.deadToken },
      });
    } else {
      events.googleWalletApiError({
        source: "process-wallet-jobs",
        shop_id: job.shop_id || undefined,
        customer_pass_id: job.customer_pass_id || undefined,
        message: `Google Wallet update gave up after ${job.attempts} attempts: ${err}`,
        error_code: code,
        metadata: { job_id: job.id, attempts: job.attempts },
      });
    }
    return;
  }

  // Retry with backoff
  const delay = backoffSeconds(job.attempts);
  const next = new Date(Date.now() + delay * 1000).toISOString();
  await supabase.from("wallet_update_jobs")
    .update({
      status: "pending",
      run_after: next,
      last_error: err,
      last_error_code: code,
    })
    .eq("id", job.id);
}

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");

  const expected = Deno.env.get("WAYA_CRON_SECRET");
  const given = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!expected || given !== expected) {
    return new Response("Unauthorized", { status: 401, headers: cors });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const t0 = Date.now();
  let claimed = 0;
  let ok = 0;
  let retried = 0;
  let dead = 0;

  try {
    const { data: jobs, error } = await supabase.rpc("claim_wallet_update_jobs", { batch_size: BATCH_SIZE });
    if (error) throw error;
    claimed = (jobs as Job[] | null)?.length || 0;
    if (claimed === 0) {
      return new Response(JSON.stringify({ success: true, claimed: 0 }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Process in parallel — each job is independent.
    await Promise.all((jobs as Job[]).map(async (job) => {
      try {
        const outcome = job.kind === "apple_apns"
          ? await runApple(supabase, job)
          : await runGoogle(supabase, job);
        await finalizeJob(supabase, job, outcome);
        if (outcome.ok) ok++;
        else if (outcome.deadToken || job.attempts >= job.max_attempts) dead++;
        else retried++;
      } catch (jobErr) {
        await finalizeJob(supabase, job, {
          ok: false,
          terminal: false,
          body: (jobErr as Error).message,
        });
        if (job.attempts >= job.max_attempts) dead++; else retried++;
      }
    }));

    const ms = Date.now() - t0;
    return new Response(JSON.stringify({
      success: true, claimed, ok, retried, dead, duration_ms: ms,
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err) {
    logEvent({
      event_type: "wallet_worker_failed",
      category: "tech",
      severity: "error",
      source: "process-wallet-jobs",
      message: (err as Error).message,
      error_code: "WORKER_EXCEPTION",
      metadata: { claimed, ok, retried, dead },
    });
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
