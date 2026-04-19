// Typed client for the StreamPay API (https://stream-app-service.streampay.sa/api/v2).
//
// StreamPay's dashboard exposes three values:
//   - API Key
//   - Secret Key
//   - x-api-key  (pre-computed base64 of "API Key:Secret Key")
//
// We accept the pre-computed x-api-key value directly so the user can paste
// it 1:1 from the StreamPay dashboard into Supabase secrets. As a fallback,
// we'll compute it from the two halves if that's all that's configured.

const BASE = Deno.env.get("STREAMPAY_BASE_URL") ??
  "https://stream-app-service.streampay.sa/api/v2";
const PRECOMPUTED = Deno.env.get("STREAMPAY_X_API_KEY");
const KEY = Deno.env.get("STREAMPAY_API_KEY");
const SEC = Deno.env.get("STREAMPAY_API_SECRET");

function resolveToken(): string {
  if (PRECOMPUTED && PRECOMPUTED.length > 0) return PRECOMPUTED;
  if (KEY && SEC) return btoa(`${KEY}:${SEC}`);
  throw new Error(
    "StreamPay credentials not configured. Set STREAMPAY_X_API_KEY (preferred) " +
      "or both STREAMPAY_API_KEY and STREAMPAY_API_SECRET.",
  );
}

export class StreamPayError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly body: unknown;
  constructor(status: number, body: unknown) {
    const obj = (body && typeof body === "object" ? body : {}) as Record<
      string,
      unknown
    >;
    const msg = (obj.error as string) ?? (obj.message as string) ??
      `StreamPay error ${status}`;
    super(msg);
    this.status = status;
    this.code = (obj.code as string) ?? undefined;
    this.body = body;
  }
}

async function call<T>(
  path: string,
  init?: RequestInit & { query?: Record<string, string | undefined> },
): Promise<T> {
  const query = init?.query;
  const qs = query
    ? "?" +
      Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
        .join("&")
    : "";
  const headers: Record<string, string> = {
    "x-api-key": resolveToken(),
    "content-type": "application/json",
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };
  const res = await fetch(`${BASE}${path}${qs}`, {
    ...init,
    headers,
  });
  const text = await res.text();
  const body = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : {};
  if (!res.ok) throw new StreamPayError(res.status, body);
  return body as T;
}

// ── Types (shape-only; we only typed fields we actually read/write) ────────

export interface SPConsumer {
  id: string;
  name: string;
  email?: string | null;
  phone_number?: string | null;
  external_id?: string | null;
}

export interface SPProduct {
  id: string;
  name: string;
  price: number | string;
  currency: string;
  is_recurring?: boolean;
  recurring_interval?: string;
}

export interface SPPaymentLink {
  id: string;
  url: string;
  status?: string;
  amount?: string;
  currency?: string;
}

export interface SPPayment {
  id: string;
  status: string; // paid | failed | pending
  amount?: string;
  invoice_id?: string;
  subscription_id?: string | null;
  payment_link_id?: string;
}

export interface SPSubscription {
  id: string;
  status: string; // active | past_due | canceled | expired ...
  current_period_end?: string;
  organization_consumer_id?: string;
  product_id?: string;
}

// ── Methods ─────────────────────────────────────────────────────────────────

export const streampay = {
  async createConsumer(input: {
    name: string;
    email?: string;
    phone_number?: string;
    external_id?: string;
    communication_methods?: Array<"EMAIL" | "SMS" | "WHATSAPP">;
  }): Promise<SPConsumer> {
    return call<SPConsumer>("/consumers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async listConsumers(query: {
    email?: string;
    phone_number?: string;
    external_id?: string;
  }): Promise<{ items: SPConsumer[] } | SPConsumer[]> {
    return call("/consumers", { query });
  },

  async createProduct(input: {
    name: string;
    description?: string;
    price: number;
    currency: string;
    type: "RECURRING" | "ONE_TIME";
    recurring_interval?: "WEEK" | "MONTH" | "SEMESTER" | "YEAR";
    recurring_interval_count?: number;
    external_id?: string;
  }): Promise<SPProduct> {
    return call<SPProduct>("/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async listProducts(query: {
    external_id?: string;
  }): Promise<{ items: SPProduct[] } | SPProduct[]> {
    return call("/products", { query });
  },

  async createPaymentLink(input: {
    name: string;
    description?: string;
    items: Array<{ product_id: string; quantity: number }>;
    contact_information_type?: "EMAIL" | "PHONE";
    currency: string;
    max_number_of_payments?: number;
    organization_consumer_id?: string;
    success_redirect_url?: string;
    failure_redirect_url?: string;
    custom_metadata?: Record<string, unknown>;
  }): Promise<SPPaymentLink> {
    return call<SPPaymentLink>("/payment_links", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getPayment(paymentId: string): Promise<SPPayment> {
    return call<SPPayment>(`/payments/${encodeURIComponent(paymentId)}`);
  },

  async getSubscription(subscriptionId: string): Promise<SPSubscription> {
    return call<SPSubscription>(
      `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    );
  },
};

// ── HMAC helpers for return-URL signature ──────────────────────────────────

async function hmacSha256Hex(
  secret: string,
  message: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signReturnPayload(
  subId: string,
  planId: string,
  ts: number,
): Promise<string> {
  const secret = Deno.env.get("STREAMPAY_RETURN_SECRET");
  if (!secret) throw new Error("STREAMPAY_RETURN_SECRET is not configured");
  return hmacSha256Hex(secret, `${subId}|${planId}|${ts}`);
}

export async function verifyReturnPayload(
  subId: string,
  planId: string,
  ts: number,
  sig: string,
  maxAgeSeconds = 60 * 60 * 2, // 2h — enough for hosted checkout + retry
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad_ts" };
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > maxAgeSeconds) {
    return { ok: false, reason: "expired" };
  }
  const expected = await signReturnPayload(subId, planId, ts);
  // Constant-time compare:
  if (expected.length !== sig.length) return { ok: false, reason: "bad_sig" };
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0 ? { ok: true } : { ok: false, reason: "bad_sig" };
}
