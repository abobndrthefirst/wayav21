// PATCHes the Google Wallet LoyaltyObject for a given customer pass.
// Triggered by points-update. Uses the cached access token from _shared/tokenCache.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { getGoogleAccessToken } from "../_shared/tokenCache.ts";

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");

  try {
    const { pass_id } = await req.json();
    if (!pass_id) throw new Error("Missing pass_id");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
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
    const points = pass.points || 0;
    const stamps = pass.stamps || 0;
    let loyaltyPoints: any;
    if (program?.loyalty_type === "stamp") {
      const need = program.stamps_required || 10;
      const max = Math.min(need, 12);
      const filled = Math.min(stamps, max);
      const row = "\u2605".repeat(filled) + "\u2606".repeat(max - filled);
      loyaltyPoints = { label: `Stamps ${stamps}/${need}`, balance: { string: row } };
    } else if (program?.loyalty_type === "tiered") {
      loyaltyPoints = { label: "Points", balance: { int: points } };
    } else if (program?.loyalty_type === "coupon") {
      loyaltyPoints = { label: "Offer", balance: { string: program.coupon_discount || "Discount" } };
    } else {
      loyaltyPoints = { label: "Points", balance: { int: points } };
    }

    const patchBody: any = { loyaltyPoints };
    if (program?.loyalty_type === "tiered" && pass.tier) {
      patchBody.secondaryLoyaltyPoints = { label: "Tier", balance: { string: pass.tier } };
    }

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
