// Bumps points/stamps on a customer_pass and triggers wallet update notifications:
//   - Apple: APNs push to all device registrations for the pass serial
//   - Google: PATCH the LoyaltyObject (delegated to google-wallet-update)
//
// Requires (for Apple APNs):
//   APPLE_APNS_AUTH_KEY      (the .p8 private key contents)
//   APPLE_APNS_KEY_ID        (10-char key ID from Apple Developer)
//   APPLE_TEAM_ID            (already used by apple-wallet-public)
//   APPLE_PASS_TYPE_ID       (used as APN topic, already set)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── ES256 JWT for APNs ───
function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToBuf(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function makeApnsJwt(): Promise<string> {
  const keyPem = Deno.env.get("APPLE_APNS_AUTH_KEY");
  const keyId = Deno.env.get("APPLE_APNS_KEY_ID");
  const teamId = Deno.env.get("APPLE_TEAM_ID");
  if (!keyPem || !keyId || !teamId) throw new Error("APNs credentials not configured");
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "ES256", kid: keyId })));
  const payload = b64url(new TextEncoder().encode(JSON.stringify({
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
  })));
  const data = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBuf(keyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(data),
  );
  return `${data}.${b64url(sig)}`;
}

async function sendAPNs(pushToken: string, jwt: string, topic: string): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(`https://api.push.apple.com/3/device/${pushToken}`, {
    method: "POST",
    headers: {
      "authorization": `bearer ${jwt}`,
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { pass_id, points_delta, stamps_delta, set_points, set_stamps, set_tier, action } = await req.json();
    if (!pass_id) throw new Error("Missing pass_id");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Auth: business user must own the shop tied to the pass
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

    // Compute new values
    const updates: any = { updated_at: new Date().toISOString(), last_visit_at: new Date().toISOString() };
    if (typeof set_points === "number") updates.points = set_points;
    else if (typeof points_delta === "number") updates.points = (pass.points || 0) + points_delta;
    if (typeof set_stamps === "number") updates.stamps = set_stamps;
    else if (typeof stamps_delta === "number") updates.stamps = (pass.stamps || 0) + stamps_delta;
    if (set_tier) updates.tier = set_tier;

    // Auto-tier (if tiered program)
    if (pass.program?.loyalty_type === "tiered" && pass.program?.tiers && updates.points != null) {
      const sortedTiers = [...pass.program.tiers].sort((a: any, b: any) => b.threshold - a.threshold);
      const t = sortedTiers.find((x: any) => updates.points >= (x.threshold || 0));
      if (t) updates.tier = t.name;
    }

    await supabase.from("customer_passes").update(updates).eq("id", pass_id);

    // Log activity
    try {
      await supabase.from("activity_log").insert({
        shop_id: pass.shop_id,
        customer_name: pass.customer_name,
        action: action || (points_delta ? "add_points" : stamps_delta ? "add_stamp" : "update"),
        points: points_delta || stamps_delta || 0,
      });
    } catch {}

    // ─── Trigger Apple APNs push to all registered devices ───
    let apnsResults: any[] = [];
    if (pass.apple_serial) {
      try {
        const { data: regs } = await supabase
          .from("apple_device_registrations")
          .select("push_token")
          .eq("serial_number", pass.apple_serial);
        if (regs && regs.length > 0) {
          const jwt = await makeApnsJwt();
          const topic = Deno.env.get("APPLE_PASS_TYPE_ID")!;
          for (const r of regs) {
            const result = await sendAPNs(r.push_token, jwt, topic);
            apnsResults.push({ token: r.push_token.slice(0, 8) + "...", ...result });
          }
        }
      } catch (err) {
        console.error("APNs error:", err);
        apnsResults.push({ error: (err as Error).message });
      }
    }

    // ─── Trigger Google Wallet update (delegate) ───
    let googleResult: any = null;
    if (pass.google_object_id) {
      try {
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/google-wallet-update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pass_id }),
        });
        googleResult = { status: r.status };
      } catch (err) {
        googleResult = { error: (err as Error).message };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      pass: { ...pass, ...updates },
      apns: apnsResults,
      google: googleResult,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
