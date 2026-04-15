import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import forge from "npm:node-forge@1.3.1";
import { zipSync, strToU8 } from "npm:fflate@0.8.2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";

const FALLBACK_ICON_29 = Uint8Array.from(atob(
  "iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAAGUlEQVR42mNkYGD4z0AEYBxVSF+FAAEGAAgyAQEAhuNGAAAAAElFTkSuQmCC"
), c => c.charCodeAt(0));
const FALLBACK_ICON_58 = Uint8Array.from(atob(
  "iVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAYAAADhu0ooAAAAIUlEQVR42mNkYGD4z0ABYBxVTF+FAAEGABISAQHO0UzUAAAAAElFTkSuQmCC"
), c => c.charCodeAt(0));

function sha1Hex(bytes: Uint8Array): string {
  const md = forge.md.sha1.create();
  const bin = Array.from(bytes).map(b => String.fromCharCode(b)).join("");
  md.update(bin);
  return md.digest().toHex();
}

function loadPrivateKey(pem: string, password: string | undefined): forge.pki.PrivateKey {
  const isEncrypted = /ENCRYPTED/.test(pem) || /Proc-Type:\s*4,ENCRYPTED/.test(pem);
  if (isEncrypted) {
    if (!password) throw new Error("Signer key is encrypted but APPLE_WALLET_SIGNER_KEY_PASSWORD is not set");
    const key = forge.pki.decryptRsaPrivateKey(pem, password);
    if (!key) throw new Error("Failed to decrypt signer key \u2014 wrong APPLE_WALLET_SIGNER_KEY_PASSWORD?");
    return key;
  }
  try { return forge.pki.privateKeyFromPem(pem); } catch (e) {
    if (password) {
      const key = forge.pki.decryptRsaPrivateKey(pem, password);
      if (key) return key;
    }
    throw e;
  }
}

function signManifest(manifestJson: string, signerCertPem: string, signerKeyPem: string, wwdrPem: string, keyPassword: string | undefined): Uint8Array {
  const signerCert = forge.pki.certificateFromPem(signerCertPem);
  const wwdrCert = forge.pki.certificateFromPem(wwdrPem);
  const signerKey = loadPrivateKey(signerKeyPem, keyPassword);
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifestJson, "utf8");
  p7.addCertificate(signerCert);
  p7.addCertificate(wwdrCert);
  p7.addSigner({
    key: signerKey,
    certificate: signerCert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() },
    ],
  });
  p7.sign({ detached: true });
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  const out = new Uint8Array(der.length);
  for (let i = 0; i < der.length; i++) out[i] = der.charCodeAt(i) & 0xff;
  return out;
}

async function fetchImage(url: string | null | undefined): Promise<Uint8Array | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return buf;
    return null;
  } catch { return null; }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");
    const { customer_name, customer_phone, points_balance } = await req.json();
    const { data: shop, error: shopError } = await supabase
      .from("shops").select("*").eq("user_id", user.id).single();
    if (shopError || !shop) throw new Error("Shop not found");

    const passTypeId = Deno.env.get("APPLE_PASS_TYPE_ID");
    const teamId = Deno.env.get("APPLE_TEAM_ID");
    const signerCert = Deno.env.get("APPLE_WALLET_SIGNER_CERT");
    const signerKey = Deno.env.get("APPLE_WALLET_SIGNER_KEY");
    const signerKeyPassword = Deno.env.get("APPLE_WALLET_SIGNER_KEY_PASSWORD");
    const wwdr = Deno.env.get("APPLE_WALLET_WWDR_CERT");
    const orgName = Deno.env.get("APPLE_WALLET_ORG_NAME") || "Waya";
    if (!passTypeId || !teamId || !signerCert || !signerKey || !wwdr) {
      throw new Error("Apple Wallet credentials not configured");
    }

    const phoneClean = (customer_phone || String(Date.now())).replace(/[^\w]/g, "_");
    const serialNumber = `waya_${shop.id.replace(/-/g, "")}_${phoneClean}_${Date.now()}`;
    const bg = shop.card_color || "rgb(16, 185, 129)";
    const bgRgb = bg.startsWith("#")
      ? `rgb(${parseInt(bg.slice(1,3),16)}, ${parseInt(bg.slice(3,5),16)}, ${parseInt(bg.slice(5,7),16)})`
      : bg;

    const pass = {
      formatVersion: 1,
      passTypeIdentifier: passTypeId,
      serialNumber,
      teamIdentifier: teamId,
      organizationName: orgName,
      description: `${shop.name} Loyalty Card`,
      logoText: shop.name,
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: bgRgb,
      labelColor: "rgb(255, 255, 255)",
      barcodes: [{ message: serialNumber, format: "PKBarcodeFormatQR", messageEncoding: "iso-8859-1", altText: customer_name || "Waya Member" }],
      storeCard: {
        headerFields: [{ key: "points", label: "POINTS", value: points_balance ?? 0 }],
        primaryFields: [{ key: "member", label: "MEMBER", value: customer_name || "Waya Member" }],
        secondaryFields: [{ key: "shop", label: "SHOP", value: shop.name }],
        auxiliaryFields: [{ key: "reward", label: "REWARD AT", value: `${shop.reward_threshold || 10} pts` }],
        backFields: [
          { key: "rewardDesc", label: "Reward", value: shop.reward_description || `Collect ${shop.reward_threshold || 10} points for a reward` },
          { key: "powered", label: "Powered by", value: "Waya \u2014 trywaya.com" },
        ],
      },
    };

    const remoteIcon = await fetchImage(shop.logo_url);
    const icon29 = remoteIcon || FALLBACK_ICON_29;
    const icon58 = remoteIcon || FALLBACK_ICON_58;
    const files: Record<string, Uint8Array> = {
      "pass.json": strToU8(JSON.stringify(pass)),
      "icon.png": icon29,
      "icon@2x.png": icon58,
    };
    const manifestObj: Record<string, string> = {};
    for (const [n, b] of Object.entries(files)) manifestObj[n] = sha1Hex(b);
    const manifestStr = JSON.stringify(manifestObj);
    const manifestBytes = strToU8(manifestStr);
    const signatureBytes = signManifest(manifestStr, signerCert, signerKey, wwdr, signerKeyPassword);

    const archive = zipSync({
      "pass.json": files["pass.json"],
      "icon.png": files["icon.png"],
      "icon@2x.png": files["icon@2x.png"],
      "manifest.json": manifestBytes,
      "signature": signatureBytes,
    }, { level: 6 });

    return new Response(archive, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${shop.name.replace(/[^\w]/g, "_")}.pkpass"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
