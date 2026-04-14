// PATCHes the Google Wallet LoyaltyObject for a given customer pass to update
// points / stamps / tier / state. Triggered by points-update.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { encode as base64url } from "https://deno.land/std@0.208.0/encoding/base64url.ts";
import { decode as base64decode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function getPrivateKey(): string {
  let raw = Deno.env.get('GOOGLE_WALLET_PRIVATE_KEY') || '';
  if (raw.trimStart().startsWith('{')) {
    try { raw = JSON.parse(raw).private_key; }
    catch { raw = JSON.parse(raw.replace(/\\n/g, '\n')).private_key; }
  }
  return raw.replace(/\\n/g, '\n');
}

async function getAccessToken(): Promise<string> {
  const email = Deno.env.get('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL')!;
  const pem = getPrivateKey();
  const pemBody = pem.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/[\r\n\s]/g, '');
  const der = base64decode(pemBody);
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const enc = new TextEncoder();
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const headerB64 = base64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payloadB64 = base64url(enc.encode(JSON.stringify(claims)));
  const data = `${headerB64}.${payloadB64}`;
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(data));
  const jwt = `${data}.${base64url(new Uint8Array(sig))}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const json = await res.json();
  if (!res.ok) throw new Error('Google OAuth failed: ' + JSON.stringify(json));
  return json.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { pass_id } = await req.json();
    if (!pass_id) throw new Error('Missing pass_id');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: pass } = await supabase
      .from('customer_passes')
      .select('*, program:loyalty_programs(*)')
      .eq('id', pass_id).single();
    if (!pass) throw new Error('Pass not found');
    if (!pass.google_object_id) {
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const program = pass.program;
    const points = pass.points || 0;
    const stamps = pass.stamps || 0;
    let loyaltyPoints: any;
    if (program?.loyalty_type === 'stamp') {
      loyaltyPoints = { label: 'Stamps', balance: { string: `${stamps}/${program.stamps_required || 10}` } };
    } else if (program?.loyalty_type === 'tiered') {
      loyaltyPoints = { label: 'Points', balance: { int: points } };
    } else if (program?.loyalty_type === 'coupon') {
      loyaltyPoints = { label: 'Offer', balance: { string: program.coupon_discount || 'Discount' } };
    } else {
      loyaltyPoints = { label: 'Points', balance: { int: points } };
    }

    const patchBody: any = { loyaltyPoints };
    if (program?.loyalty_type === 'tiered' && pass.tier) {
      patchBody.secondaryLoyaltyPoints = { label: 'Tier', balance: { string: pass.tier } };
    }

    const accessToken = await getAccessToken();
    const objId = encodeURIComponent(pass.google_object_id);
    const res = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchBody),
    });
    const text = await res.text();
    return new Response(JSON.stringify({ success: res.ok, status: res.status, body: text.slice(0, 400) }), {
      status: res.ok ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
