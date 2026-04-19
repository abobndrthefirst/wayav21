// Thin wrappers around the Waya StreamPay edge functions. Mirrors the pattern
// used by ProgramsList / WalletEnrollPage:
//   - Shared Supabase client for session access
//   - Bearer `${session.access_token}` + `apikey` headers
// Never embed StreamPay's API secret — all StreamPay calls happen server-side.

import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export class StreamPayApiError extends Error {
  constructor(status, body, message) {
    super(message)
    this.status = status
    this.body = body
    if (body && typeof body === 'object' && typeof body.existing_subscription_id === 'string') {
      this.existingSubscriptionId = body.existing_subscription_id
    }
  }
}

async function callFn(name, { method, body } = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not signed in')
  const resolvedMethod = method ?? (body ? 'POST' : 'GET')
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: resolvedMethod,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let parsed = null
  if (text) {
    try { parsed = JSON.parse(text) } catch { parsed = text }
  }
  if (!res.ok) {
    const msg = parsed && typeof parsed === 'object' && parsed.error
      ? String(parsed.error)
      : `Request failed (${res.status})`
    throw new StreamPayApiError(res.status, parsed, msg)
  }
  return parsed
}

export function createCheckout({ plan_id, phone }) {
  return callFn('streampay-create-checkout', {
    method: 'POST',
    body: { plan_id, phone },
  })
}

export function verifyPayment({ subscription_id, sig, ts, invoice_id, payment_id, subscription_id_sp }) {
  return callFn('streampay-verify-payment', {
    method: 'POST',
    body: { subscription_id, sig, ts, invoice_id, payment_id, subscription_id_sp },
  })
}

export function getStatus() {
  return callFn('streampay-get-status')
}
