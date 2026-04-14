// Apple PassKit Web Service
// Implements: register / unregister / serials / latest pass / log endpoints
// Specification: https://developer.apple.com/library/archive/documentation/PassKit/Reference/PassKit_WebService/WebService.html
//
// Routes (always behind /functions/v1/apple-passkit):
//  POST   /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
//  GET    /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}?passesUpdatedSince=...
//  DELETE /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
//  GET    /v1/passes/{passTypeIdentifier}/{serialNumber}
//  POST   /v1/log

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

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
  return !!data && data.apple_auth_token === token;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = getSupa();
  const url = new URL(req.url);
  // Strip the function name prefix if present
  let path = url.pathname.replace(/^.*?\/apple-passkit/, "") || "/";
  if (!path.startsWith("/")) path = "/" + path;

  try {
    // ─── POST /v1/log ───
    if (path === "/v1/log" && req.method === "POST") {
      try {
        const body = await req.json().catch(() => ({}));
        console.log("[ApplePass log]", JSON.stringify(body));
      } catch {}
      return new Response("", { status: 200, headers: corsHeaders });
    }

    // ─── /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}[/{serialNumber}] ───
    const devMatch = path.match(/^\/v1\/devices\/([^/]+)\/registrations\/([^/]+)(?:\/([^/]+))?$/);
    if (devMatch) {
      const [, deviceLibId, passTypeId, serial] = devMatch;

      // POST register
      if (req.method === "POST" && serial) {
        if (!(await authorizePass(req, supabase, serial))) {
          return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        }
        const body = await req.json().catch(() => ({}));
        const pushToken = body.pushToken;
        if (!pushToken) return new Response("Bad Request", { status: 400, headers: corsHeaders });
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
          return new Response("", { status: 200, headers: corsHeaders });
        }
        await supabase.from("apple_device_registrations").insert({
          device_library_identifier: deviceLibId,
          pass_type_identifier: passTypeId,
          serial_number: serial,
          push_token: pushToken,
        });
        return new Response("", { status: 201, headers: corsHeaders });
      }

      // DELETE unregister
      if (req.method === "DELETE" && serial) {
        if (!(await authorizePass(req, supabase, serial))) {
          return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        }
        await supabase.from("apple_device_registrations").delete()
          .eq("device_library_identifier", deviceLibId)
          .eq("pass_type_identifier", passTypeId)
          .eq("serial_number", serial);
        return new Response("", { status: 200, headers: corsHeaders });
      }

      // GET serials list
      if (req.method === "GET" && !serial) {
        const since = url.searchParams.get("passesUpdatedSince");
        const { data: regs } = await supabase
          .from("apple_device_registrations")
          .select("serial_number")
          .eq("device_library_identifier", deviceLibId)
          .eq("pass_type_identifier", passTypeId);
        const serials = (regs || []).map((r: any) => r.serial_number);
        if (serials.length === 0) {
          return new Response("", { status: 204, headers: corsHeaders });
        }
        let q = supabase.from("customer_passes").select("apple_serial, updated_at").in("apple_serial", serials);
        if (since) q = q.gt("updated_at", new Date(parseInt(since)).toISOString());
        const { data: passes } = await q;
        if (!passes || passes.length === 0) {
          return new Response("", { status: 204, headers: corsHeaders });
        }
        const lastUpdated = String(Math.max(...passes.map((p: any) => new Date(p.updated_at).getTime())));
        return new Response(JSON.stringify({
          serialNumbers: passes.map((p: any) => p.apple_serial),
          lastUpdated,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ─── GET /v1/passes/{passTypeIdentifier}/{serialNumber} ───
    const passMatch = path.match(/^\/v1\/passes\/([^/]+)\/([^/]+)$/);
    if (passMatch && req.method === "GET") {
      const [, , serial] = passMatch;
      if (!(await authorizePass(req, supabase, serial))) {
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      }
      // Re-issue the pass via the apple-wallet-public function for consistency.
      const { data: pass } = await supabase
        .from("customer_passes")
        .select("program_id, customer_name, customer_phone")
        .eq("apple_serial", serial)
        .maybeSingle();
      if (!pass) return new Response("Not Found", { status: 404, headers: corsHeaders });
      const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/apple-wallet-public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_id: pass.program_id,
          customer_name: pass.customer_name,
          customer_phone: pass.customer_phone,
        }),
      });
      if (!res.ok) return new Response("Error", { status: 500, headers: corsHeaders });
      const buf = new Uint8Array(await res.arrayBuffer());
      return new Response(buf, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.pkpass",
          "Last-Modified": new Date().toUTCString(),
        },
      });
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  } catch (err) {
    console.error("apple-passkit error:", err);
    return new Response((err as Error).message, { status: 500, headers: corsHeaders });
  }
});
