// KSA (Saudi Arabia) mobile phone validation + formatting.
// Mirrors the server-side rule in supabase/functions/_shared/validation.ts
// so the client rejects bad input *before* a round-trip to the edge function.
//
// Accepted formats (all normalize to +9665XXXXXXXX):
//   05XXXXXXXX            ← preferred display format, 10 digits total
//   5XXXXXXXX             ← 9 digits
//   9665XXXXXXXX          ← 12 digits
//   +9665XXXXXXXX         ← E.164
//
// Rules surfaced to the user:
//   - Digits only
//   - Must start with 05
//   - Must be exactly 10 digits

export const KSA_PHONE_HINT_EN = 'Enter digits only, starting with 05 (10 digits total).'
export const KSA_PHONE_HINT_AR = 'أرقام فقط، تبدأ بـ 05 (10 أرقام).'
export const KSA_PHONE_ERR_EN = 'This phone number is not accepted. Use a Saudi mobile starting with 05 (10 digits).'
export const KSA_PHONE_ERR_AR = 'رقم الجوال غير مقبول. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.'

const KSA_PHONE_RE = /^(?:\+?966|0)?5\d{8}$/

/** Strip everything but digits and leading +. */
export function sanitizePhoneInput(raw) {
  if (typeof raw !== 'string') return ''
  return raw.replace(/[^\d+]/g, '')
}

/** true if the given raw string matches any accepted KSA mobile format. */
export function isValidKsaPhone(raw) {
  const clean = sanitizePhoneInput(raw)
  return KSA_PHONE_RE.test(clean)
}

/** Normalize to +9665XXXXXXXX. Returns null on invalid input. */
export function normalizeKsaPhone(raw) {
  const clean = sanitizePhoneInput(raw)
  if (!KSA_PHONE_RE.test(clean)) return null
  const bare = clean.replace(/^\+?966/, '').replace(/^0/, '')
  return `+966${bare}`
}

/**
 * onChange helper for a `type="tel"` input that restricts keystrokes to
 * digits (and a single leading + when typing +966…). Returns the sanitized
 * value capped at a reasonable length.
 */
export function handlePhoneChange(raw) {
  const clean = sanitizePhoneInput(raw)
  // Cap at 13 chars so users can still type +9665XXXXXXXX, but nothing longer.
  return clean.slice(0, 13)
}
