// Centralized CORS handling for all Waya edge functions.
// Only production origins are allowlisted. Extra origins can be added
// via ALLOWED_ORIGINS env var (comma-separated) for ad-hoc preview URLs.

const DEFAULT_ALLOWED = [
  "https://trywaya.com",
  "https://www.trywaya.com",
];

function allowedOrigins(): string[] {
  const extra = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...DEFAULT_ALLOWED, ...extra];
}

export function corsHeadersFor(req: Request, methods = "POST, OPTIONS"): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowed = allowedOrigins();
  const isAllowed = allowed.includes(origin);
  // If origin is not allowlisted, do NOT echo an origin — browser will block.
  // Server-to-server callers (no origin header) still work because we fall back to the first allowed.
  const allowOrigin = isAllowed ? origin : (origin ? "null" : allowed[0]);
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-idempotency-key, x-enrollment-token",
    "Access-Control-Allow-Methods": methods,
    "Vary": "Origin",
  };
}

export function preflightResponse(req: Request, methods = "POST, OPTIONS"): Response {
  return new Response(null, { status: 204, headers: corsHeadersFor(req, methods) });
}
