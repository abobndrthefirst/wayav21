// PATCHes the Google Wallet LoyaltyObject for a given customer pass.
// Triggered by points-update. Uses the cached access token from _shared/tokenCache.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { getGoogleAccessToken } from "../_shared/tokenCache.ts";
import { pickLang, labelFor } from "../_shared/passLabels.ts";
import { stampRow, stampProgressMessage } from "../_shared/stampRow.ts";

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");

  try {
    const body = await req.json();
    const { pass_id, google_object_id, message } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Message mode: append a notification to an existing LoyaltyObject ──
    // Invoked by process-wallet-jobs when a merchant sends a broadcast.
    if (message && google_object_id) {
      const accessToken = await getGoogleAccessToken();
      const url = `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${encodeURIComponent(google_object_id)}/addMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            header: (message.header || "").slice(0, 80),
            body: (message.body || "").slice(0, 240),
            messageType: "TEXT_AND_NOTIFY",
          },
        }),
      });
      const text = await res.text().catch(() => "");
      if (!res.ok) {
        return new Response(
          JSON.stringify({ success: false, status: res.status, body: text }),
          { status: res.status, headers: { ...cors, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ success: true, mode: "message" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (!pass_id) throw new Error("Missing pass_id");
    const { data: pass } = await supabase
      .from("customer_passes")
      .select("*, program:loyalty_programs(*)")
      .eq("id", pass_id)
      .single();
    if (!pass) throw new Error("Pass not found");
    if (!pass.google_object_id) {
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const program = pass.program;
    const stamps = pass.stamps || 0;
    const rewards = pass.rewards_balance || 0;
    const lang = pickLang(program?.pass_language, null);
    const need = program?.stamps_required || 10;

    const patchBody: any = {
      loyaltyPoints: {
        label: `${labelFor(lang, "STAMPS")} ${stamps}/${need}`,
        balance: { string: stampRow(stamps, need) },
      },
      // Always set — PATCH merges, so the old "1x Reward" text would
      // linger forever after a redemption if we conditionally omitted this.
      secondaryLoyaltyPoints: {
        label: labelFor(lang, "REWARDS"),
        balance: { string: String(rewards) },
      },
      textModulesData: [{
        body: stampProgressMessage(
          stamps,
          need,
          program?.reward_title || "reward",
          rewards,
          lang,
        ),
        id: "progress",
      }],
    };

    const accessToken = await getGoogleAccessToken();
    const objId = encodeURIComponent(pass.google_object_id);
    const res = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patchBody),
    });
    const text = await res.text();
    return new Response(JSON.stringify({ success: res.ok, status: res.status, body: text.slice(0, 400) }), {
      status: res.ok ? 200 : 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
