// GET /health — lightweight liveness + dependency reachability.
// Returns 200 with a JSON status map even if some deps are degraded;
// returns 503 only if Supabase itself is unreachable (core dependency).
// Point your uptime monitor (Better Uptime, UptimeRobot, etc.) at this URL.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";

async function checkSupabase(): Promise<{ ok: boolean; latency_ms: number; error?: string }> {
  const start = Date.now();
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await supabase.from("shops").select("id", { count: "exact", head: true });
    if (error) throw error;
    return { ok: true, latency_ms: Date.now() - start };
  } catch (e) {
    return { ok: false, latency_ms: Date.now() - start, error: (e as Error).message };
  }
}

async function checkGoogleWallet(): Promise<{ ok: boolean; latency_ms: number; error?: string }> {
  const start = Date.now();
  try {
    // Cheap HEAD on the Google Wallet API base. Doesn't consume quota.
    const res = await fetch("https://walletobjects.googleapis.com/walletobjects/v1/", { method: "HEAD" });
    return { ok: res.status < 500, latency_ms: Date.now() - start };
  } catch (e) {
    return { ok: false, latency_ms: Date.now() - start, error: (e as Error).message };
  }
}

async function checkApns(): Promise<{ ok: boolean; latency_ms: number; error?: string }> {
  const start = Date.now();
  try {
    // APNs doesn't answer GET but a TCP connect via fetch HEAD tells us it's reachable.
    const res = await fetch("https://api.push.apple.com/", { method: "HEAD" });
    return { ok: res.status < 500, latency_ms: Date.now() - start };
  } catch (e) {
    return { ok: false, latency_ms: Date.now() - start, error: (e as Error).message };
  }
}

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "GET, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "GET, OPTIONS");

  const [supa, google, apns] = await Promise.all([checkSupabase(), checkGoogleWallet(), checkApns()]);
  const body = {
    status: supa.ok ? "ok" : "degraded",
    version: Deno.env.get("WAYA_BUILD_SHA") || "unknown",
    timestamp: new Date().toISOString(),
    checks: {
      supabase: supa,
      google_wallet: google,
      apns: apns,
    },
  };
  return new Response(JSON.stringify(body), {
    status: supa.ok ? 200 : 503,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
