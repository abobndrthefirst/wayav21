// Shared CORS helper for Waya edge functions.
// Extracted from apple-pass-lab/index.ts so every new function uses the same
// permissive-but-controlled defaults.

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function preflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  return null;
}

export function jsonResponse(
  req: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "content-type": "application/json",
    },
  });
}

export function errorResponse(
  req: Request,
  message: string,
  status = 400,
  extra: Record<string, unknown> = {},
): Response {
  return jsonResponse(req, { error: message, ...extra }, status);
}
