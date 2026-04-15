// Nightly cleanup for stale Apple device registrations.
// Any registration whose last APNs response was 410 (Unregistered) more than
// 7 days ago is removed — Apple says don't keep pushing to dead tokens.
//
// Invoked by pg_cron every 24h:  select net.http_post(
//   url := 'https://<project>.supabase.co/functions/v1/apple-device-cleanup',
//   headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
// );
//
// Requires env: WAYA_CRON_SECRET (must match header) so random callers can't DoS us.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");

  const expected = Deno.env.get("WAYA_CRON_SECRET");
  const given = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!expected || given !== expected) {
    return new Response("Unauthorized", { status: 401, headers: cors });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("apple_device_registrations")
      .delete()
      .eq("last_apns_status", 410)
      .lt("last_apns_at", cutoff)
      .select("id");

    if (error) throw error;
    const deleted = data?.length || 0;
    console.log(`[apple-device-cleanup] removed ${deleted} stale registrations`);
    return new Response(JSON.stringify({ success: true, deleted }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
