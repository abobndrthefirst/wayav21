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
    catch {
      try { raw = JSON.parse(raw.replace(/\\n/g, '\n')).private_key; }
      catch { throw new Error('Could not parse GOOGLE_WALLET_PRIVATE_KEY'); }
    }
  }
  return raw.replace(/\\n/g, '\n');
}

async function signJwt(payload: Record<string, unknown>, privateKeyPem: string): Promise<string> {
  const pemBody = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/[\r\n\s]/g, '');
  const binaryDer = base64decode(pemBody);
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryDer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, enc.encode(signingInput));
  return `${signingInput}.${base64url(new Uint8Array(sig))}`;
}

function isImageUrl(u?: string | null): boolean {
  if (!u) return false;
  return u.includes('/storage/') || /\.(png|jpg|jpeg|webp)/i.test(u);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { program_id, shop_id, customer_name, customer_phone } = body;

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Resolve program (preferred) or fall back to shop legacy mode
    let program: any = null;
    let shop: any = null;
    if (program_id) {
      const { data, error } = await supabase
        .from('loyalty_programs').select('*, shop:shops(*)').eq('id', program_id).single();
      if (error || !data) throw new Error('Program not found');
      program = { ...data, shop_name: data.shop?.name };
      shop = data.shop;
    } else {
      if (!shop_id) throw new Error('Missing program_id or shop_id');
      const { data, error } = await supabase.from('shops').select('*').eq('id', shop_id).single();
      if (error || !data) throw new Error('Shop not found');
      shop = data;
      program = {
        id: null, shop_id: shop.id, loyalty_type: 'points',
        reward_threshold: shop.reward_threshold || 10,
        reward_title: 'Reward',
        reward_description: shop.reward_description,
        card_color: shop.card_color || '#10B981',
        logo_url: shop.logo_url, background_url: null,
        shop_name: shop.name, terms: null, expires_at: null,
      };
    }

    const GW_ISSUER_ID = Deno.env.get('GOOGLE_WALLET_ISSUER_ID');
    const GW_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL');
    const privateKey = getPrivateKey();
    if (!GW_ISSUER_ID || !GW_SERVICE_ACCOUNT_EMAIL || !privateKey) throw new Error('Google Wallet credentials not configured');

    const idClean = (program.id || shop.id).replace(/-/g, '_');
    const phoneClean = (customer_phone || String(Date.now())).replace(/[^\w]/g, '_');
    const classId = `${GW_ISSUER_ID}.waya_loyalty_${idClean}`;
    const objectId = `${GW_ISSUER_ID}.waya_member_${idClean}_${phoneClean}`;

    // Look up / create / update customer_pass
    if (program.id) {
      const { data: existing } = await supabase
        .from('customer_passes')
        .select('*').eq('program_id', program.id).eq('customer_phone', customer_phone).maybeSingle();
      if (existing) {
        if (existing.google_object_id !== objectId) {
          await supabase.from('customer_passes').update({ google_object_id: objectId, customer_name }).eq('id', existing.id);
        }
      } else {
        await supabase.from('customer_passes').insert({
          program_id: program.id, shop_id: shop.id,
          customer_name, customer_phone, google_object_id: objectId,
        });
      }
    }

    // Build the loyalty class
    const hexColor = program.card_color || '#10B981';
    const loyaltyClass: Record<string, unknown> = {
      id: classId,
      issuerName: 'Waya',
      reviewStatus: 'UNDER_REVIEW',
      programName: program.shop_name,
      hexBackgroundColor: hexColor,
      countryCode: 'SA',
    };
    if (isImageUrl(program.logo_url || shop.logo_url)) {
      loyaltyClass.programLogo = {
        sourceUri: { uri: program.logo_url || shop.logo_url },
        contentDescription: { defaultValue: { language: 'en', value: program.shop_name } },
      };
    }
    if (isImageUrl(program.background_url)) {
      loyaltyClass.heroImage = {
        sourceUri: { uri: program.background_url },
        contentDescription: { defaultValue: { language: 'en', value: program.name || 'Loyalty' } },
      };
    }

    // Build textModulesData
    const textModules: any[] = [
      { header: 'Shop', body: program.shop_name, id: 'shop' },
    ];
    if (program.reward_title) textModules.push({ header: 'Reward', body: program.reward_title + (program.reward_description ? ' — ' + program.reward_description : ''), id: 'reward' });
    if (program.terms) textModules.push({ header: 'Terms', body: program.terms, id: 'terms' });

    const linksModule: any = { uris: [] };
    if (program.google_maps_url) linksModule.uris.push({ uri: program.google_maps_url, description: 'Find us on Maps', id: 'maps' });
    if (program.website_url) linksModule.uris.push({ uri: program.website_url, description: 'Website', id: 'web' });
    if (program.phone) linksModule.uris.push({ uri: `tel:${program.phone}`, description: 'Call', id: 'phone' });

    // Build loyalty object
    const loyaltyObject: any = {
      id: objectId,
      classId,
      state: 'ACTIVE',
      accountId: customer_phone || `customer_${Date.now()}`,
      accountName: customer_name || 'Member',
      barcode: { type: 'QR_CODE', value: objectId, alternateText: customer_name || 'Member' },
      textModulesData: textModules,
    };
    if (linksModule.uris.length > 0) loyaltyObject.linksModuleData = linksModule;

    if (program.loyalty_type === 'stamp') {
      loyaltyObject.loyaltyPoints = { label: 'Stamps', balance: { string: `0/${program.stamps_required || 10}` } };
    } else if (program.loyalty_type === 'tiered') {
      loyaltyObject.loyaltyPoints = { label: 'Points', balance: { int: 0 } };
      loyaltyObject.secondaryLoyaltyPoints = { label: 'Tier', balance: { string: 'Bronze' } };
    } else if (program.loyalty_type === 'coupon') {
      loyaltyObject.loyaltyPoints = { label: 'Offer', balance: { string: program.coupon_discount || 'Discount' } };
    } else {
      loyaltyObject.loyaltyPoints = { label: 'Points', balance: { int: 0 } };
    }

    if (program.expires_at) loyaltyObject.validTimeInterval = { end: { date: new Date(program.expires_at).toISOString() } };

    const now = Math.floor(Date.now() / 1000);
    const claims = {
      iss: GW_SERVICE_ACCOUNT_EMAIL,
      aud: 'google',
      origins: ['https://trywaya.com', 'https://www.trywaya.com', 'http://localhost:5173'],
      typ: 'savetowallet',
      iat: now,
      payload: { loyaltyClasses: [loyaltyClass], loyaltyObjects: [loyaltyObject] },
    };

    const token = await signJwt(claims, privateKey);
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    try {
      await supabase.from('activity_log').insert({
        shop_id: shop.id,
        customer_name: customer_name || 'Unknown',
        action: 'google_wallet_add',
        points: 0,
      });
    } catch (_) {}

    return new Response(JSON.stringify({ success: true, saveUrl, classId, objectId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
