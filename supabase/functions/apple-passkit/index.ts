// Apple PassKit Web Service
// Implements: register / unregister / serials / latest pass / log endpoints
// Specification: https://developer.apple.com/library/archive/documentation/PassKit/Reference/PassKit_WebService/WebService.html
//
// Hardening:
//   - CORS allowlist (Apple devices don't actually need CORS, but we apply
//     the same policy for any web-based observability tooling)
//   - Auth token compared against HASHED value in DB via timing-safe compare

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { verifySecret } from "../_shared/hash.ts";
import { logEvent } from "../_shared/events.ts";

function getSupa() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function authorizePass(req: Request, supabase: any, serial: string): Promise<boolean> {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^ApplePass\s+(.+)$/i);
  if (!m) return false;
  const token = m[1].trim();
  const { data } = await supabase
    .from("customer_passes")
    .select("apple_auth_token")
    .eq("apple_serial", serial)
    .maybeSingle();
  if (!data) return false;
  return await verifySecret(token, data.apple_auth_token);
}

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "GET, POST, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "GET, POST, DELETE, OPTIONS");

  const supabase = getSupa();
  const url = new URL(req.url);
  let path = url.pathname.replace(/^.*?\/apple-passkit/, "") || "/";
  if (!path.startsWith("/")) path = "/" + path;

  try {
    if (path === "/v1/log" && req.method === "POST") {
      try {
        const body = await req.json().catch(() => ({}));
        console.log("[ApplePass log]", JSON.stringify(body));
      } catch {}
      return new Response("", { status: 200, headers: cors });
    }

    const devMatch = path.match(/^\/v1\/devices\/([^/]+)\/registrations\/([^/]+)(?:\/([^/]+))?$/);
    if (devMatch) {
      const [, deviceLibId, passTypeId, serial] = devMatch;

      if (req.method === "POST" && serial) {
        if (!(await authorizePass(req, supabase, serial))) {
          logEvent({
            event_type: "apple_passkit_auth_failed",
            category: "security",
            severity: "warn",
            source: "apple-passkit",
            message: `ApplePass auth rejected for serial ${serial}`,
            error_code: "APPLEPASS_AUTH_FAIL",
            metadata: { route: "register", serial, device_library_identifier: deviceLibId },
            req,
          });
          return new Response("Unauthorized", { status: 401, headers: cors });
        }
        const body = await req.json().catch(() => ({}));
        const pushToken = body.pushToken;
        if (!pushToken) return new Response("Bad Request", { status: 400, headers: cors });
        const { data: existing } = await supabase
          .from("apple_device_registrations")
          .select("id")
          .eq("device_library_identifier", deviceLibId)
          .eq("pass_type_identifier", passTypeId)
          .eq("serial_number", serial)
          .maybeSingle();
        if (existing) {
          await supabase.from("apple_device_registrations")
            .update({ push_token: pushToken })
            .eq("id", existing.id);
          return new Response("", { status: 200, headers: cors });
        }
        await supabase.from("apple_device_registrations").insert({
          device_library_identifier: deviceLibId,
          pass_type_identifier: passTypeId,
          serial_number: serial,
          push_token: pushToken,
        });
        logEvent({
          event_type: "apple_device_registered",
          category: "business",
          severity: "info",
          source: "apple-passkit",
          message: `Device registered for serial ${serial}`,
          metadata: { serial, device_library_identifier: deviceLibId },
          req,
        });
        return new Response("", { status: 201, headers: cors });
      }

      if (req.method === "DELETE" && serial) {
        if (!(await authorizePass(req, supabase, serial))) {
          logEvent({
            event_type: "apple_passkit_auth_failed",
            category: "security",
            severity: "warn",
            source: "apple-passkit",
            message: `ApplePass auth rejected on DELETE for serial ${serial}`,
            error_code: "APPLEPASS_AUTH_FAIL",
            metadata: { route: "unregister", serial },
            req,
          });
          return new Response("Unauthorized", { status: 401, headers: cors });
        }
        await supabase.from("apple_device_registrations").delete()
          .eq("device_library_identifier", deviceLibId)
          .eq("pass_type_identifier", passTypeId)
          .eq("serial_number", serial);
        logEvent({
          event_type: "apple_device_unregistered",
          category: "business",
          severity: "info",
          source: "apple-passkit",
          message: `Device unregistered for serial ${serial}`,
          metadata: { serial, device_library_identifier: deviceLibId },
          req,
        });
        return new Response("", { status: 200, headers: cors });
      }

      if (req.method === "GET" && !serial) {
        const sinceRaw = url.searchParams.get("passesUpdatedSince");
        const sinceMs = sinceRaw ? Number(sinceRaw) : NaN;
        const sinceIso = Number.isFinite(sinceMs) && sinceMs > 0
          ? new Date(sinceMs).toISOString()
          : null;
        const { data: regs } = await supabase
          .from("apple_device_registrations")
          .select("serial_number")
          .eq("device_library_identifier", deviceLibId)
          .eq("pass_type_identifier", passTypeId);
        const serials = (regs || []).map((r: any) => r.serial_number);
        if (serials.length === 0) {
          return new Response(null, { status: 204, headers: cors });
        }
        let q = supabase.from("customer_passes").select("apple_serial, updated_at").in("apple_serial", serials);
        if (sinceIso) q = q.gt("updated_at", sinceIso);
        const { data: passes } = await q;
        if (!passes || passes.length === 0) {
          return new Response(null, { status: 204, headers: cors });
        }
        const lastUpdated = String(Math.max(...passes.map((p: any) => new Date(p.updated_at).getTime())));
        return new Response(JSON.stringify({
          serialNumbers: passes.map((p: any) => p.apple_serial),
          lastUpdated,
        }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
      }
    }

    const passMatch = path.match(/^\/v1\/passes\/([^/]+)\/([^/]+)$/);
    if (passMatch && req.method === "GET") {
      const [, , serial] = passMatch;
      if (!(await authorizePass(req, supabase, serial))) {
        logEvent({
          event_type: "apple_passkit_auth_failed",
          category: "security",
          severity: "warn",
          source: "apple-passkit",
          message: `ApplePass auth rejected on pass fetch for serial ${serial}`,
          error_code: "APPLEPASS_AUTH_FAIL",
          metadata: { route: "get_pass", serial },
          req,
        });
        return new Response("Unauthorized", { status: 401, headers: cors });
      }
      // Grab the verified plaintext token so we can tell apple-wallet-public
      // to reuse it on the re-issue instead of rotating. Rotating on every
      // fetch was the stamps-don't-update bug — iOS' in-flight retries saw
      // 401s because the DB had already moved to a new hash.
      const authHeader = req.headers.get("authorization") || "";
      const plaintextToken = (authHeader.match(/^ApplePass\s+(.+)$/i)?.[1] || "").trim();

      const { data: pass } = await supabase
        .from("customer_passes")
        .select("program_id, customer_name, customer_phone")
        .eq("apple_serial", serial)
        .maybeSingle();
      if (!pass) return new Response("Not Found", { status: 404, headers: cors });

      // Mint a short-lived enrollment token server-side for the internal call.
      const { signEnrollmentToken } = await import("../_shared/enrollmentToken.ts");
      const t = await signEnrollmentToken(pass.program_id);

      const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/apple-wallet-public`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-enrollment-token": t,
          ...(plaintextToken ? { "x-reissue-token": plaintextToken } : {}),
        },
        body: JSON.stringify({
          program_id: pass.program_id,
          customer_name: pass.customer_name,
          customer_phone: pass.customer_phone,
        }),
      });
      if (!res.ok) return new Response("Error", { status: 500, headers: cors });
      const buf = new Uint8Array(await res.arrayBuffer());
      return new Response(buf, {
        status: 200,
        headers: {
          ...cors,
          "Content-Type": "application/vnd.apple.pkpass",
          "Last-Modified": new Date().toUTCString(),
        },
      });
    }

    return new Response("Not Found", { status: 404, headers: cors });
  } catch (err) {
    console.error("apple-passkit error:", err);
    logEvent({
      event_type: "apple_passkit_error",
      category: "tech",
      severity: "error",
      source: "apple-passkit",
      message: (err as Error).message,
      error_code: "PASSKIT_EXCEPTION",
      req,
    });
    return new Response((err as Error).message, { status: 500, headers: cors });
  }
});
