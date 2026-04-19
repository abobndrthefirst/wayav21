// Apple Pass Lab — Admin-only endpoint that generates signed .pkpass files
// with FULL control over every Apple Wallet pass option.
// Uses the same certificates as apple-wallet-public.
//
// Auth: Bearer token (Supabase user JWT)
// Method: POST
// Body: Full pass configuration JSON (see PassLabInput type below)
// Response: application/vnd.apple.pkpass binary

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import forge from "npm:node-forge@1.3.1";
import { zipSync, strToU8 } from "npm:fflate@0.8.2";

// ── CORS (self-contained, permissive for lab use) ──
function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// ── Fallback icons (tiny gray PNGs) ──
const FALLBACK_ICON_29 = Uint8Array.from(atob(
  "iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAAGUlEQVR42mNkYGD4z0AEYBxVSF+FAAEGAAgyAQEAhuNGAAAAAElFTkSuQmCC"
), c => c.charCodeAt(0));
const FALLBACK_ICON_58 = Uint8Array.from(atob(
  "iVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAYAAADhu0ooAAAAIUlEQVR42mNkYGD4z0ABYBxVTF+FAAEGABISAQHO0UzUAAAAAElFTkSuQmCC"
), c => c.charCodeAt(0));

// ── Signing helpers (identical to apple-wallet-public) ──
function sha1Hex(bytes: Uint8Array): string {
  const md = forge.md.sha1.create();
  md.update(Array.from(bytes).map(b => String.fromCharCode(b)).join(""));
  return md.digest().toHex();
}

function loadPrivateKey(pem: string, password: string | undefined): forge.pki.PrivateKey {
  const isEncrypted = /ENCRYPTED/.test(pem) || /Proc-Type:\s*4,ENCRYPTED/.test(pem);
  if (isEncrypted) {
    if (!password) throw new Error("Signer key encrypted but no password set");
    const key = forge.pki.decryptRsaPrivateKey(pem, password);
    if (!key) throw new Error("Failed to decrypt signer key");
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

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgb(255, 255, 255)`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

async function fetchImage(url: string): Promise<Uint8Array | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch { return null; }
}

// ── Main handler ──
Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("غير مصرح — سجّل دخولك أولاً");

    // Credentials
    const PASS_TYPE_ID = Deno.env.get("APPLE_PASS_TYPE_ID") || "pass.com.waya.loyalty";
    const TEAM_ID = Deno.env.get("APPLE_TEAM_ID");
    const SIGNER_CERT = Deno.env.get("APPLE_WALLET_SIGNER_CERT");
    const SIGNER_KEY = Deno.env.get("APPLE_WALLET_SIGNER_KEY");
    const KEY_PASSWORD = Deno.env.get("APPLE_WALLET_SIGNER_KEY_PASSWORD");
    const WWDR_CERT = Deno.env.get("APPLE_WALLET_WWDR_CERT");

    if (!TEAM_ID || !SIGNER_CERT || !SIGNER_KEY || !WWDR_CERT) {
      throw new Error("Apple Wallet credentials not configured on server");
    }

    const body = await req.json();

    // ── Build pass.json with EVERY Apple Wallet option ──
    const passType = body.pass_type || "storeCard";
    const serial = `lab_${crypto.randomUUID().replace(/-/g, "")}`;
    const authToken = crypto.randomUUID() + crypto.randomUUID();

    // Field arrays
    const headerFields = (body.header_fields || []).map((f: any, i: number) => ({
      key: f.key || `header${i}`,
      label: f.label || "",
      value: f.value || "",
      ...(f.change_message ? { changeMessage: f.change_message } : {}),
    }));
    const primaryFields = (body.primary_fields || []).map((f: any, i: number) => ({
      key: f.key || `primary${i}`,
      label: f.label || "",
      value: f.value || "",
    }));
    const secondaryFields = (body.secondary_fields || []).map((f: any, i: number) => ({
      key: f.key || `secondary${i}`,
      label: f.label || "",
      value: f.value || "",
    }));
    const auxiliaryFields = (body.auxiliary_fields || []).map((f: any, i: number) => ({
      key: f.key || `aux${i}`,
      label: f.label || "",
      value: f.value || "",
    }));
    const backFields = (body.back_fields || []).map((f: any, i: number) => ({
      key: f.key || `back${i}`,
      label: f.label || "",
      value: f.value || "",
      ...(f.attributed_value ? { attributedValue: f.attributed_value } : {}),
    }));

    const passContent: any = {};
    if (headerFields.length) passContent.headerFields = headerFields;
    if (primaryFields.length) passContent.primaryFields = primaryFields;
    if (secondaryFields.length) passContent.secondaryFields = secondaryFields;
    if (auxiliaryFields.length) passContent.auxiliaryFields = auxiliaryFields;
    if (backFields.length) passContent.backFields = backFields;

    const bgColor = body.background_color || "#10B981";
    const fgColor = body.foreground_color || "#FFFFFF";
    const lblColor = body.label_color || "#FFFFFF";

    const passJson: any = {
      formatVersion: 1,
      passTypeIdentifier: PASS_TYPE_ID,
      serialNumber: serial,
      teamIdentifier: TEAM_ID,
      organizationName: body.organization_name || "Waya",
      description: body.description || "Apple Wallet Pass",
      logoText: body.logo_text || "",
      foregroundColor: hexToRgb(fgColor),
      backgroundColor: hexToRgb(bgColor),
      labelColor: hexToRgb(lblColor),
      [passType]: passContent,
    };

    // Barcode
    if (body.barcode_type && body.barcode_type !== "NONE") {
      const typeMap: Record<string, string> = {
        QR: "PKBarcodeFormatQR",
        CODE128: "PKBarcodeFormatCode128",
        AZTEC: "PKBarcodeFormatAztec",
        PDF417: "PKBarcodeFormatPDF417",
      };
      passJson.barcodes = [{
        message: body.barcode_message || serial,
        format: typeMap[body.barcode_type] || "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: body.barcode_alt_text || body.barcode_message || serial,
      }];
    }

    // Grouping
    if (body.grouping_identifier) passJson.groupingIdentifier = body.grouping_identifier;
    if (body.suppress_strip_shine) passJson.suppressStripShine = true;

    // Expiration
    if (body.expiration_date) {
      passJson.expirationDate = new Date(body.expiration_date).toISOString();
    }
    if (body.voided) passJson.voided = true;

    // Relevant date
    if (body.relevant_date) {
      passJson.relevantDate = new Date(body.relevant_date).toISOString();
    }

    // Locations
    if (Array.isArray(body.locations) && body.locations.length > 0) {
      passJson.locations = body.locations
        .filter((l: any) => l.latitude && l.longitude)
        .slice(0, 10)
        .map((l: any) => ({
          latitude: Number(l.latitude),
          longitude: Number(l.longitude),
          ...(l.relevant_text ? { relevantText: l.relevant_text } : {}),
        }));
      if (body.max_distance) passJson.maxDistance = Number(body.max_distance);
    }

    // Beacons
    if (Array.isArray(body.beacons) && body.beacons.length > 0) {
      passJson.beacons = body.beacons.slice(0, 10).map((b: any) => ({
        proximityUUID: b.proximity_uuid,
        ...(b.major != null ? { major: Number(b.major) } : {}),
        ...(b.minor != null ? { minor: Number(b.minor) } : {}),
        ...(b.relevant_text ? { relevantText: b.relevant_text } : {}),
      }));
    }

    // Sharing
    if (body.sharing_prohibited) passJson.sharingProhibited = true;

    // ── Assemble images ──
    const logoImg = await fetchImage(body.logo_url);
    const stripImg = await fetchImage(body.strip_url);
    const bgImg = await fetchImage(body.background_url);
    const thumbnailImg = await fetchImage(body.thumbnail_url);

    // ── Build ZIP archive ──
    const passJsonBytes = strToU8(JSON.stringify(passJson));
    const files: Record<string, Uint8Array> = {
      "pass.json": passJsonBytes,
      "icon.png": FALLBACK_ICON_29,
      "icon@2x.png": FALLBACK_ICON_58,
    };
    if (logoImg) {
      files["logo.png"] = logoImg;
      files["logo@2x.png"] = logoImg;
    }
    if (stripImg) {
      files["strip.png"] = stripImg;
      files["strip@2x.png"] = stripImg;
    }
    if (bgImg) {
      files["background.png"] = bgImg;
      files["background@2x.png"] = bgImg;
    }
    if (thumbnailImg) {
      files["thumbnail.png"] = thumbnailImg;
      files["thumbnail@2x.png"] = thumbnailImg;
    }

    // Manifest
    const manifest: Record<string, string> = {};
    for (const [name, data] of Object.entries(files)) {
      manifest[name] = sha1Hex(data);
    }
    const manifestJson = JSON.stringify(manifest);
    const manifestBytes = strToU8(manifestJson);
    files["manifest.json"] = manifestBytes;

    // Signature
    const signatureBytes = signManifest(manifestJson, SIGNER_CERT, SIGNER_KEY, WWDR_CERT, KEY_PASSWORD);
    files["signature"] = signatureBytes;

    // Compress
    const zipEntries: Record<string, [Uint8Array, { level: number }]> = {};
    for (const [name, data] of Object.entries(files)) {
      zipEntries[name] = [data, { level: 6 }];
    }
    const pkpass = zipSync(zipEntries);

    const filename = (body.organization_name || "pass").replace(/[^a-zA-Z0-9\u0600-\u06FF ]/g, "").trim() || "pass";
    return new Response(pkpass, {
      headers: {
        ...cors,
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${filename}.pkpass"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
