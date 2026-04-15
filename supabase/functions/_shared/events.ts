// Unified event logger. Every edge function should call logEvent() at
// meaningful business + tech checkpoints:
//
//   Business: card_issued, card_failed, points_added, reward_redeemed,
//             enrollment_started, program_published
//   Tech:     apns_push_failed, google_wallet_api_error, pkpass_sign_failed,
//             storage_fetch_failed, db_write_failed
//   Security: rate_limited, invalid_enrollment_token, invalid_signature,
//             auth_failed, ssrf_blocked, validation_failed
//
// Rules:
//   1. Never throws. A failing insert must NOT break the user flow.
//   2. Never stores raw phone / name — hash or omit.
//   3. Truncate user_agent to 256 chars, metadata values to sane sizes.
//   4. Uses service-role client so writes bypass RLS.

import { createClient } from "jsr:@supabase/supabase-js@2";

type Category = "business" | "tech" | "security";
type Severity = "info" | "warn" | "error" | "critical";

export interface EventInput {
  event_type: string;
  category: Category;
  severity?: Severity;
  source: string;                 // e.g. 'apple-wallet-public'
  shop_id?: string | null;
  program_id?: string | null;
  customer_pass_id?: string | null;
  message?: string;
  error_code?: string;
  metadata?: Record<string, unknown>;
  request_id?: string;
  req?: Request;                  // optional — extracts ip + UA automatically
}

let _client: ReturnType<typeof createClient> | null = null;
function client() {
  if (_client) return _client;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

function clientIpFrom(req?: Request): string | null {
  if (!req) return null;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || null;
}

function truncate(s: string | null | undefined, n: number): string | null {
  if (!s) return null;
  return s.length > n ? s.slice(0, n) : s;
}

/**
 * Log an event. Never throws — worst case, logs to console.
 * Fire-and-forget: don't await this in hot paths unless you need the insert
 * to finish before the function exits (edge runtime kills background tasks
 * when the request handler resolves).
 */
export async function logEvent(e: EventInput): Promise<void> {
  try {
    const c = client();
    if (!c) {
      console.warn("[events] no supabase client, skipping:", e.event_type);
      return;
    }
    const row = {
      event_type: e.event_type,
      category: e.category,
      severity: e.severity ?? "info",
      source: e.source,
      shop_id: e.shop_id ?? null,
      program_id: e.program_id ?? null,
      customer_pass_id: e.customer_pass_id ?? null,
      message: truncate(e.message, 500),
      error_code: truncate(e.error_code, 64),
      metadata: e.metadata ?? {},
      request_id: e.request_id ?? null,
      client_ip: truncate(clientIpFrom(e.req), 64),
      user_agent: truncate(e.req?.headers.get("user-agent"), 256),
    };
    const { error } = await c.from("events").insert(row);
    if (error) {
      // Don't rethrow; just log so the caller's request still succeeds.
      console.error("[events] insert failed:", error.message, e.event_type);
    }
  } catch (err) {
    console.error("[events] logEvent threw:", (err as Error).message);
  }
}

/** Convenience wrappers for the most common shapes. */
export const events = {
  cardIssued: (r: Omit<EventInput, "event_type" | "category" | "severity">) =>
    logEvent({ ...r, event_type: "card_issued", category: "business", severity: "info" }),

  cardFailed: (r: Omit<EventInput, "event_type" | "category" | "severity">) =>
    logEvent({ ...r, event_type: "card_failed", category: "business", severity: "error" }),

  pointsAdded: (r: Omit<EventInput, "event_type" | "category" | "severity">) =>
    logEvent({ ...r, event_type: "points_added", category: "business", severity: "info" }),

  rewardRedeemed: (r: Omit<EventInput, "event_type" | "category" | "severity">) =>
    logEvent({ ...r, event_type: "reward_redeemed", category: "business", severity: "info" }),

  rateLimited: (r: Omit<EventInput, "event_type" | "category" | "severity">) =>
    logEvent({ ...r, event_type: "rate_limited", category: "security", severity: "warn" }),

  invalidToken: (r: Omit<EventInput, "event_type" | "category" | "severity">) =>
    logEvent({ ...r, event_type: "invalid_enrollment_token", category: "security", severity: "warn" }),

  validationFailed: (r: Omit<EventInput, "event_type" | "category" | "severity">) =>
    logEvent({ ...r, event_type: "validation_failed", category: "security", severity: "warn" }),

  apnsFailed: (r: Omit<EventInput, "event_type" | "category" | "severity">) =>
    logEvent({ ...r, event_type: "apns_push_failed", category: "tech", severity: "error" }),

  googleWalletApiError: (r: Omit<EventInput, "event_type" | "category" | "severity">) =>
    logEvent({ ...r, event_type: "google_wallet_api_error", category: "tech", severity: "error" }),

  pkpassSignFailed: (r: Omit<EventInput, "event_type" | "category" | "severity">) =>
    logEvent({ ...r, event_type: "pkpass_sign_failed", category: "tech", severity: "critical" }),

  ssrfBlocked: (r: Omit<EventInput, "event_type" | "category" | "severity">) =>
    logEvent({ ...r, event_type: "ssrf_blocked", category: "security", severity: "critical" }),
};
