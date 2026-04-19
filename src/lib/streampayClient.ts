// Thin wrappers around the Waya StreamPay edge functions. These mirror the
// PassLab fetch pattern — Bearer access token + apikey header.

import { supabase } from './supabase';

const SUPABASE_URL = 'https://unnheqshkxpbflozechm.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubmhlcXNoa3hwYmZsb3plY2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTkwNjksImV4cCI6MjA5MDQzNTA2OX0.XHAbOOdPtuwD0pJErxhBw9C3RJPouPeUhMS9hSThON0';

export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'failed'
  | 'expired';

export interface Subscription {
  id: string;
  shop_id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  streampay_subscription_id: string | null;
  current_period_end: string | null;
  last_synced_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface CreateCheckoutResponse {
  subscription_id: string;
  checkout_url: string;
}

export interface GetStatusResponse {
  subscription: Subscription | null;
  hasActive: boolean;
}

export interface VerifyPaymentResponse {
  subscription: Subscription;
}

export class StreamPayApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly existingSubscriptionId?: string;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
    if (body && typeof body === 'object') {
      const obj = body as Record<string, unknown>;
      if (typeof obj.existing_subscription_id === 'string') {
        this.existingSubscriptionId = obj.existing_subscription_id;
      }
    }
  }
}

async function callFn<T>(
  name: string,
  init: { method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in');
  const method = init.method ?? (init.body ? 'POST' : 'GET');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: ANON_KEY,
    },
    body: init.body != null ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  const parsed: unknown = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })()
    : null;
  if (!res.ok) {
    const msg =
      parsed && typeof parsed === 'object' && 'error' in parsed
        ? String((parsed as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new StreamPayApiError(res.status, parsed, msg);
  }
  return parsed as T;
}

export function createCheckout(input: {
  plan_id: string;
  phone: string;
}): Promise<CreateCheckoutResponse> {
  return callFn<CreateCheckoutResponse>('streampay-create-checkout', {
    method: 'POST',
    body: input,
  });
}

export function verifyPayment(input: {
  subscription_id: string;
  sig: string;
  ts: number;
  invoice_id?: string;
  payment_id?: string;
  subscription_id_sp?: string;
}): Promise<VerifyPaymentResponse> {
  return callFn<VerifyPaymentResponse>('streampay-verify-payment', {
    method: 'POST',
    body: input,
  });
}

export function getStatus(): Promise<GetStatusResponse> {
  return callFn<GetStatusResponse>('streampay-get-status');
}
