// Per-IP sliding-window rate limiter backed by Upstash Redis REST.
// If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set, the
// limiter is a no-op (fails open) so local dev still works without Upstash.
//
// Keep requests simple (no external deps). Each call issues two HTTP calls:
//   1. ZREMRANGEBYSCORE + ZADD + EXPIRE via pipeline
//   2. ZCARD to count window members
// That's cheap and plenty for our RPS targets.

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  windowMs: number;
}

interface UpstashEnv {
  url: string;
  token: string;
}

function upstashEnv(): UpstashEnv | null {
  const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function upstashPipeline(env: UpstashEnv, commands: (string | number)[][]): Promise<any[]> {
  const res = await fetch(`${env.url}/pipeline`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  return await res.json();
}

/**
 * Sliding-window rate limit.
 * @param bucket  key prefix, e.g. "rl:google-wallet-public"
 * @param identifier  usually the client IP
 * @param limit  max requests per window
 * @param windowMs  window size in ms
 */
export async function rateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const env = upstashEnv();
  // Fail-open when Upstash isn't configured — better than breaking prod during a misconfiguration window.
  if (!env) return { allowed: true, remaining: limit, limit, windowMs };

  const key = `${bucket}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const results = await upstashPipeline(env, [
      ["ZREMRANGEBYSCORE", key, 0, windowStart],
      ["ZADD", key, now, member],
      ["ZCARD", key],
      ["PEXPIRE", key, windowMs],
    ]);
    const count = Number((results[2] as any)?.result ?? results[2] ?? 0);
    const remaining = Math.max(0, limit - count);
    return { allowed: count <= limit, remaining, limit, windowMs };
  } catch (err) {
    console.error("[rateLimit] Upstash error, failing open:", err);
    return { allowed: true, remaining: limit, limit, windowMs };
  }
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Window-Ms": String(r.windowMs),
  };
}
