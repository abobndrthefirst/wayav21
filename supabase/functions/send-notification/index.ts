// send-notification — merchant-triggered wallet broadcast.
//
// Flow:
//   1. Auth: merchant JWT. Must own the shop_id in the payload.
//   2. Validate title/body length.
//   3. Call notif_check_and_increment() — atomic quota check + bump. If blocked,
//      return 429 with the current usage so the UI can show "3 of 4 used".
//   4. Create notification_campaigns row (status='sending').
//   5. Find all customer_passes for this shop → one wallet_update_jobs row per
//      platform target (apple_apns device OR google_object_id), kind tagged
//      'wallet_message' so the worker knows to include the push payload.
//   6. Return the campaign id + recipient count. Actual delivery happens async
//      via process-wallet-jobs (runs every 30s).
//
// Safety:
//   - CORS allowlist
//   - Merchant can only send to their own shop (RLS + explicit check)
//   - Quota enforced server-side (client cannot bypass by crafting requests)
//   - Idempotency: pass a stable `client_request_id` to dedupe retries

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { events, logEvent } from "../_shared/events.ts";

interface Payload {
  shop_id: string;
  title: string;
  body: string;
  deep_link?: string;
  audience_tier?: string;
  client_request_id?: string;
}

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");

  try {
    const payload = (await req.json()) as Payload;
    const { shop_id, title, body, deep_link, audience_tier } = payload;

    if (!shop_id) throw new Error("Missing shop_id");
    if (!title || title.length < 1 || title.length > 80) {
      throw new Error("Title must be 1–80 characters");
    }
    if (!body || body.length < 1 || body.length > 240) {
      throw new Error("Body must be 1–240 characters");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Auth: decode the user's JWT via anon client
    const authHeader = req.headers.get("authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Ownership check
    const { data: shop } = await supabase
      .from("shops")
      .select("id, user_id, name")
      .eq("id", shop_id)
      .maybeSingle();
    if (!shop || shop.user_id !== user.id) {
      throw new Error("Shop not found or not owned by you");
    }

    // Quota check + atomic increment
    const { data: quota, error: quotaErr } = await supabase.rpc(
      "notif_check_and_increment",
      { p_shop_id: shop_id, p_amount: 1 },
    );
    if (quotaErr) throw quotaErr;
    if (!quota?.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: quota.reason, quota }),
        {
          status: 429,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      );
    }

    // Create the campaign row
    const { data: campaign, error: cErr } = await supabase
      .from("notification_campaigns")
      .insert({
        shop_id,
        created_by: user.id,
        kind: "broadcast",
        title,
        body,
        deep_link: deep_link || null,
        audience_tier: audience_tier || null,
        status: "sending",
      })
      .select()
      .single();
    if (cErr) throw cErr;

    // Find recipient passes for this shop (filtered by audience_tier if provided)
    let passQuery = supabase
      .from("customer_passes")
      .select("id, apple_serial, google_object_id, tier")
      .eq("shop_id", shop_id);
    if (audience_tier) passQuery = passQuery.eq("tier", audience_tier);
    const { data: passes, error: pErr } = await passQuery;
    if (pErr) throw pErr;

    let appleTargets = 0;
    let googleTargets = 0;
    const sendRows: Array<Record<string, unknown>> = [];
    const jobRows: Array<Record<string, unknown>> = [];
    const idempotencyKey = payload.client_request_id || campaign.id;

    for (const p of passes || []) {
      if (p.apple_serial) {
        const { data: regs } = await supabase
          .from("apple_device_registrations")
          .select("push_token")
          .eq("serial_number", p.apple_serial);
        for (const r of regs || []) {
          jobRows.push({
            kind: "wallet_message",
            customer_pass_id: p.id,
            shop_id,
            payload: {
              platform: "apple",
              push_token: r.push_token,
              campaign_id: campaign.id,
              title,
              body,
              deep_link: deep_link || null,
            },
            idempotency_key: `${idempotencyKey}:apple:${p.id}:${r.push_token}`,
          });
          appleTargets++;
        }
        sendRows.push({
          campaign_id: campaign.id,
          customer_pass_id: p.id,
          shop_id,
          platform: "apple",
        });
      }
      if (p.google_object_id) {
        jobRows.push({
          kind: "wallet_message",
          customer_pass_id: p.id,
          shop_id,
          payload: {
            platform: "google",
            google_object_id: p.google_object_id,
            campaign_id: campaign.id,
            title,
            body,
            deep_link: deep_link || null,
          },
          idempotency_key: `${idempotencyKey}:google:${p.id}`,
        });
        googleTargets++;
        sendRows.push({
          campaign_id: campaign.id,
          customer_pass_id: p.id,
          shop_id,
          platform: "google",
        });
      }
    }

    // Insert send records (for analytics / per-recipient status tracking)
    if (sendRows.length > 0) {
      await supabase.from("notification_sends").insert(sendRows);
    }

    // Enqueue jobs
    if (jobRows.length > 0) {
      const { error: jErr } = await supabase
        .from("wallet_update_jobs")
        .upsert(jobRows, {
          onConflict: "kind,customer_pass_id,idempotency_key",
          ignoreDuplicates: true,
        });
      if (jErr) throw jErr;
    }

    // Update campaign with recipient count
    await supabase
      .from("notification_campaigns")
      .update({
        recipient_count: sendRows.length,
        status: sendRows.length > 0 ? "sending" : "sent",
        sent_at: sendRows.length === 0 ? new Date().toISOString() : null,
      })
      .eq("id", campaign.id);

    events.pointsAdded({
      source: "send-notification",
      shop_id,
      message: `Broadcast '${title}' → ${sendRows.length} recipients (${appleTargets} apple, ${googleTargets} google)`,
      metadata: {
        campaign_id: campaign.id,
        apple_targets: appleTargets,
        google_targets: googleTargets,
        audience_tier: audience_tier || null,
        quota,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id: campaign.id,
        recipient_count: sendRows.length,
        apple_targets: appleTargets,
        google_targets: googleTargets,
        quota,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = (err as Error).message;
    logEvent({
      event_type: "notification_send_failed",
      category: "tech",
      severity: /unauthorized|not owned/i.test(msg) ? "warn" : "error",
      source: "send-notification",
      message: msg,
      error_code: /unauthorized/i.test(msg) ? "AUTH_FAILED" : "NOTIFICATION_SEND_FAIL",
      req,
    });
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
