// BillingPage — subscription plan picker for the shop owner.
// Design mirrors the landing page's Pricing section (master's CSS classes:
// .section, .pricing-card, .pricing-card-featured, .pricing-cta, .pricing-features)
// plus a monthly/annual toggle and a KSA phone field.

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import {
  isValidKsaPhone,
  normalizeKsaPhone,
  sanitizePhoneInput,
  KSA_PHONE_ERR_AR,
  KSA_PHONE_ERR_EN,
  KSA_PHONE_HINT_AR,
  KSA_PHONE_HINT_EN,
} from '../lib/phone'
import { createCheckout, StreamPayApiError } from '../lib/streampay'
import { useSubscription } from '../lib/useSubscription'

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const TIERS = [
  {
    id: 'tier1',
    titleAr: 'باقة التأسيس', titleEn: 'Founding Plan',
    monthly: 85, annual: 816,
    featuresAr: [
      'اشتراك أول شهرين مجاناً',
      'عدد بطاقات غير محدود',
      'تصميم بطاقات مخصّص',
      'عدد عملاء غير محدود',
      'لوحة تحكم كاملة',
      'استيراد بيانات العملاء من Excel',
    ],
    featuresEn: [
      'First 2 months free',
      'Unlimited cards',
      'Custom card design',
      'Unlimited customers',
      'Full dashboard',
      'Import customers from Excel',
    ],
  },
  {
    id: 'tier2',
    titleAr: 'النمو', titleEn: 'Growth',
    monthly: 150, annual: 1440,
    badgeAr: 'الأكثر شيوعاً', badgeEn: 'Most popular',
    featuresAr: ['برامج ولاء غير محدودة', 'حتى 2,000 عميل', 'معمل البطاقات', 'تحليلات متقدمة', 'دعم عبر واتساب'],
    featuresEn: ['Unlimited loyalty programs', 'Up to 2,000 customers', 'Pass designer lab', 'Advanced analytics', 'WhatsApp support'],
  },
  {
    id: 'tier3',
    titleAr: 'الاحتراف', titleEn: 'Pro',
    monthly: 300, annual: 2880,
    featuresAr: ['كل مميزات خطة النمو', 'عملاء غير محدودين', 'حملات مخصصة للمواسم', 'API للمطورين', 'دعم مخصص وذو أولوية'],
    featuresEn: ['Everything in Growth', 'Unlimited customers', 'Seasonal campaigns', 'Developer API', 'Priority dedicated support'],
  },
]

function fmt(n) {
  return new Intl.NumberFormat('en-US').format(n)
}

function daysUntil(iso) {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  if (!Number.isFinite(ms)) return null
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

function StatusBanner({ subscription, accountStatus, trialEndsAt, lang }) {
  const isAr = lang === 'ar'
  const daysLeft = accountStatus === 'on_trial' ? daysUntil(trialEndsAt) : null

  // Map account-level status (not the raw subscription row) to a user-facing
  // label + tone. Dynamic copy for on_trial includes days remaining.
  const AR = {
    on_trial: daysLeft != null
      ? `فترة تجريبية مجانية — متبقي ${daysLeft} يوم`
      : 'فترة تجريبية مجانية',
    active: 'اشتراك نشط',
    past_due: 'متأخر السداد',
    canceled: 'تم الإلغاء',
    payment_failed: 'فشل الدفع',
    resubscribe_required: 'انتهى اشتراكك — جدد الاشتراك',
  }
  const EN = {
    on_trial: daysLeft != null
      ? `Free trial — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
      : 'Free trial',
    active: 'Active subscription',
    past_due: 'Past due',
    canceled: 'Canceled',
    payment_failed: 'Payment failed',
    resubscribe_required: 'Subscription ended — resubscribe',
  }
  const label = (isAr ? AR : EN)[accountStatus] ?? accountStatus
  const tone =
    accountStatus === 'active' ? 'active' :
    accountStatus === 'on_trial' ? 'info' :
    accountStatus === 'past_due' || accountStatus === 'resubscribe_required' ? 'warn' :
    accountStatus === 'payment_failed' || accountStatus === 'canceled' ? 'bad' :
    'info'
  return (
    <motion.div
      className={`billing-status billing-status-${tone}`}
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="billing-status-label">{label}</span>
      <span className="billing-status-sub">
        {subscription?.plan_id ?? ''}
        {subscription?.current_period_end
          ? ` · ${isAr ? 'ينتهي' : 'Ends'} ${new Date(subscription.current_period_end).toLocaleDateString('en-GB')}`
          : ''}
      </span>
    </motion.div>
  )
}

export default function BillingPage({ lang = 'ar' }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)

  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Auth guard — master's router hands us no context, so we check here.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    return () => sub.unsubscribe()
  }, [])

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading])

  const { subscription, hasActive, accountStatus, trialEndsAt, loading: subLoading, refresh } = useSubscription({ user, authLoading })

  const [interval, setInterval] = useState('annual')
  const [phone, setPhone] = useState('')
  const [phoneEditable, setPhoneEditable] = useState(false)
  const [shopPhoneLoaded, setShopPhoneLoaded] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const phoneInputRef = useRef(null)
  // Referral code: 4 uppercase letters tied to a marketer. Optional — empty
  // means no referral. We validate via the lookup_marketer_by_code RPC and
  // surface a ✓/✗ next to the field; the actual marketer_id resolution is
  // re-done server-side for safety in streampay-create-checkout.
  const [referralCode, setReferralCode] = useState('')
  const [referralStatus, setReferralStatus] = useState('idle') // idle | checking | valid | invalid

  // Pre-fill phone from the shop record (collected during /setup).
  // If the shop already has a valid KSA phone, keep it read-only with an
  // "Edit" button — no need to make the user retype what we already have.
  useEffect(() => {
    if (!user) return
    supabase
      .from('shops')
      .select('phone')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const existing = data?.phone
        if (existing && isValidKsaPhone(existing)) {
          setPhone(existing)
          setPhoneEditable(false)
        } else {
          setPhoneEditable(true)
        }
        setShopPhoneLoaded(true)
      })
  }, [user])

  // Preselect plan from ?plan=tier1_monthly-style query string.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const planQ = params.get('plan')
    if (planQ) {
      const match = planQ.match(/^tier([1-3])_(monthly|annual)$/)
      if (match) {
        setSelectedTier(Number(match[1]))
        setInterval(match[2])
      }
    }
    const codeQ = params.get('ref')
    if (codeQ) {
      const sanitized = codeQ.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
      if (sanitized.length === 4) setReferralCode(sanitized)
    }
  }, [])

  // Debounced referral code validation. Empty = idle (no referral).
  // 1–3 chars = idle (still typing). 4 chars = check via RPC.
  useEffect(() => {
    if (referralCode.length === 0) { setReferralStatus('idle'); return }
    if (referralCode.length < 4)   { setReferralStatus('idle'); return }
    let cancelled = false
    setReferralStatus('checking')
    const t = window.setTimeout(() => {
      supabase.rpc('lookup_marketer_by_code', { p_code: referralCode }).then(({ data, error }) => {
        if (cancelled) return
        if (error) { setReferralStatus('invalid'); return }
        setReferralStatus(data ? 'valid' : 'invalid')
      })
    }, 250)
    return () => { cancelled = true; window.clearTimeout(t) }
  }, [referralCode])

  const phoneValid = isValidKsaPhone(phone)
  const strings = useMemo(() => ({
    title: T('Subscription', 'الاشتراك'),
    sub: T(
      'Pick a plan that fits your shop — pay monthly or save 20% with annual billing.',
      'اختر الخطة التي تناسب متجرك — ادفع شهرياً أو وفّر 20% بالدفع السنوي.',
    ),
    monthly: T('Monthly', 'شهري'),
    annual: T('Annual — save 20%', 'سنوي — خصم 20%'),
    unitMonth: T('SAR / month', 'ر.س / شهر'),
    unitYear: T('SAR / year', 'ر.س / سنة'),
    phoneLabel: T('Phone number (for StreamPay invoices)', 'رقم الجوال (لإشعارات ستريم باي)'),
    phoneHint: isAr ? KSA_PHONE_HINT_AR : KSA_PHONE_HINT_EN,
    phoneErr: isAr ? KSA_PHONE_ERR_AR : KSA_PHONE_ERR_EN,
    cta: T('Continue to payment', 'اذهب إلى الدفع'),
    subscribed: T('Subscribed', 'مشترك'),
    back: T('← Home', '← الرئيسية'),
    redirecting: T('Redirecting…', 'جارٍ التحويل…'),
    save20: T('Save 20%', 'وفّر 20%'),
    loading: T('Loading…', 'جارٍ التحميل…'),
    existingPending: T(
      'You already have a subscription in progress.',
      'لديك اشتراك قائم بالفعل.',
    ),
    referralLabel: T('Referral code (optional)', 'رمز الإحالة (اختياري)'),
    referralHint: T('4 letters from a Waya marketer. Leave empty if you don’t have one.', '4 أحرف من مسوّق وايا. اتركها فارغة إذا ما عندك واحد.'),
    referralChecking: T('Checking…', 'جارٍ التحقق…'),
    referralValid: T('Valid code — your marketer will be credited.', 'رمز صحيح — سيُحتسب لمسوّقك.'),
    referralInvalid: T('We couldn’t find that code.', 'ما حصلنا الرمز هذا.'),
  }), [isAr])

  // Never let a raw object bubble up as "[object Object]" — always return a
  // usable string for setError(). v3: walk all plausible string paths before
  // falling back to a JSON dump of the body, not of the Error itself (Error
  // instances serialize to "{}" because their props are non-enumerable).
  const formatError = (e) => {
    if (!e) return T('Unknown error', 'خطأ غير معروف')
    if (typeof e === 'string') return e

    // Deep-walk the StreamPay body for any string we can show.
    const walk = (obj) => {
      if (!obj || typeof obj !== 'object') return null
      if (typeof obj.error === 'string' && obj.error.length > 0 && obj.error !== '[object Object]') return obj.error
      if (typeof obj.message === 'string' && obj.message.length > 0 && obj.message !== '[object Object]') return obj.message
      if (typeof obj.msg === 'string' && obj.msg.length > 0) return obj.msg
      if (Array.isArray(obj.detail) && obj.detail[0]) {
        const first = obj.detail[0]
        if (typeof first === 'string') return first
        if (first && typeof first === 'object' && typeof first.msg === 'string') return first.msg
      }
      if (obj.error && typeof obj.error === 'object') {
        const nested = walk(obj.error)
        if (nested) return nested
      }
      if (obj.streampay_body) {
        const nested = walk(obj.streampay_body)
        if (nested) return nested
      }
      return null
    }

    if (e instanceof StreamPayApiError) {
      const fromBody = walk(e.body)
      if (fromBody) return fromBody
      // Last-resort dump so the user sees SOMETHING actionable.
      try {
        const j = JSON.stringify(e.body)
        if (j && j !== '{}' && j !== 'null') return `Server error (${e.status}): ${j}`
      } catch { /* fall through */ }
      return `Server error (${e.status})`
    }

    if (e.message && typeof e.message === 'string' && e.message !== '[object Object]') {
      return e.message
    }
    return T('Unknown error — check DevTools console', 'خطأ غير معروف — افتح الكونسول')
  }

  const onSubscribe = async (tier) => {
    // If the shop has no phone yet, the input is editable and we validate.
    // If the phone came from the shop record, it was already validated.
    const normalized = normalizeKsaPhone(phone)
    if (!normalized) {
      setError(strings.phoneErr)
      setSelectedTier(tier)
      setPhoneEditable(true)
      if (phoneInputRef.current) {
        phoneInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        phoneInputRef.current.focus()
      }
      return
    }
    // Don't send a referral code that we know is bad. Empty + valid both go through.
    if (referralCode.length > 0 && referralStatus === 'invalid') {
      setError(strings.referralInvalid)
      return
    }
    setSelectedTier(tier)
    setSubmitting(true)
    setError(null)
    try {
      const res = await createCheckout({
        plan_id: `tier${tier}_${interval}`,
        phone: normalized,
        referral_code: referralStatus === 'valid' ? referralCode : null,
      })
      if (!res?.checkout_url || typeof res.checkout_url !== 'string') {
        setError(T('Checkout URL missing from server response.', 'لم يتم استلام رابط الدفع من الخادم.'))
        return
      }
      window.location.assign(res.checkout_url)
    } catch (e) {
      if (e instanceof StreamPayApiError && e.status === 409 && e.existingSubscriptionId) {
        await refresh()
        setError(strings.existingPending)
      } else {
        setError(formatError(e))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="auth-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--gray-dim)' }}>{strings.loading}</div>
      </div>
    )
  }

  return (
    <div className="billing-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="auth-top-bar">
        <button onClick={() => navigate('/')} className="auth-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d={isAr ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'} />
          </svg>
          {strings.back}
        </button>
      </div>

      <section className="section billing-section">
        <motion.div
          className="billing-header"
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="section-title">{strings.title}</h1>
          <p className="section-subtitle">{strings.sub}</p>
        </motion.div>

        {!subLoading && <StatusBanner subscription={subscription} accountStatus={accountStatus} trialEndsAt={trialEndsAt} lang={lang} />}

        <motion.div
          className="billing-toggle"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {(['monthly', 'annual']).map(opt => (
            <button
              key={opt}
              className={`billing-toggle-btn ${interval === opt ? 'billing-toggle-active' : ''}`}
              onClick={() => setInterval(opt)}
            >
              {opt === 'monthly' ? strings.monthly : strings.annual}
            </button>
          ))}
        </motion.div>

        {/* Phone — we pre-fill from shops.phone (collected at /setup).
            If we already have a valid phone we show it read-only with an Edit
            link. If not, we render the input as normal. */}
        {!hasActive && shopPhoneLoaded && (
          <motion.div
            className="billing-phone-card"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            {phoneEditable ? (
              <>
                <label className="billing-phone-label">{strings.phoneLabel}</label>
                <input
                  ref={phoneInputRef}
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  value={phone}
                  onChange={e => {
                    const v = sanitizePhoneInput(e.target.value)
                    setPhone(v)
                    setError(null)
                  }}
                  placeholder="05XXXXXXXX"
                  className="billing-phone-input"
                  style={{ borderColor: phoneValid ? '#10B981' : 'var(--border)' }}
                />
                <p className="billing-phone-hint">{strings.phoneHint}</p>
              </>
            ) : (
              <div className="billing-phone-row">
                <div className="billing-phone-saved">
                  <span className="billing-phone-label">{strings.phoneLabel}</span>
                  <span className="billing-phone-value">{phone}</span>
                </div>
                <button
                  type="button"
                  className="billing-phone-edit"
                  onClick={() => { setPhoneEditable(true); setTimeout(() => phoneInputRef.current?.focus(), 50) }}
                >
                  {T('Change', 'تغيير')}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Optional marketer referral code. Validated live via the
            lookup_marketer_by_code RPC; the actual marketer_id resolution
            re-runs server-side in streampay-create-checkout. */}
        {!hasActive && (
          <motion.div
            className="billing-phone-card"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.5 }}
          >
            <label className="billing-phone-label" htmlFor="billing-referral">{strings.referralLabel}</label>
            <div style={{ position: 'relative' }}>
              <input
                id="billing-referral"
                type="text"
                inputMode="latin"
                dir="ltr"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck="false"
                maxLength={4}
                value={referralCode}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
                  setReferralCode(v)
                  setError(null)
                }}
                placeholder="ABCD"
                className="billing-phone-input"
                style={{
                  letterSpacing: '0.4em',
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  paddingInlineEnd: 36,
                  borderColor:
                    referralStatus === 'valid'   ? '#10B981' :
                    referralStatus === 'invalid' ? '#b91c1c' :
                    'var(--border)',
                }}
              />
              {referralStatus === 'checking' && (
                <span style={{ position: 'absolute', insetInlineEnd: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-dim)', fontSize: '0.85rem' }}>…</span>
              )}
              {referralStatus === 'valid' && (
                <span style={{ position: 'absolute', insetInlineEnd: 12, top: '50%', transform: 'translateY(-50%)', color: '#10B981', fontWeight: 700 }}>✓</span>
              )}
              {referralStatus === 'invalid' && (
                <span style={{ position: 'absolute', insetInlineEnd: 12, top: '50%', transform: 'translateY(-50%)', color: '#b91c1c', fontWeight: 700 }}>✗</span>
              )}
            </div>
            <p className="billing-phone-hint" style={{
              color:
                referralStatus === 'valid'   ? '#10B981' :
                referralStatus === 'invalid' ? '#b91c1c' :
                undefined,
            }}>
              {referralStatus === 'checking' ? strings.referralChecking
                : referralStatus === 'valid' ? strings.referralValid
                : referralStatus === 'invalid' ? strings.referralInvalid
                : strings.referralHint}
            </p>
          </motion.div>
        )}

        <div className="pricing-cards billing-tiers billing-tiers-single">
          {TIERS.filter((t) => t.id === 'tier1').map((tier, idx) => {
            const price = interval === 'monthly' ? tier.monthly : tier.annual
            const unit = interval === 'monthly' ? strings.unitMonth : strings.unitYear
            const label = isAr ? tier.titleAr : tier.titleEn
            const features = isAr ? tier.featuresAr : tier.featuresEn
            const badge = isAr ? tier.badgeAr : tier.badgeEn
            const featured = true
            const isSelected = selectedTier === 1
            return (
              <motion.div
                key={tier.id}
                className={`pricing-card ${featured ? 'pricing-card-featured' : ''} ${isSelected ? 'pricing-active' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(16,185,129,0.1)' }}
              >
                {featured && badge && (
                  <div className="pricing-plan-label-row">
                    <span className="pricing-plan-label">{label}</span>
                    <span className="save-badge">{badge}</span>
                  </div>
                )}
                {!featured && <span className="pricing-plan-label">{label}</span>}

                <div className="pricing-amount">
                  <span className="price">{fmt(price)}</span>
                  <span className="price-label">{unit}</span>
                </div>
                {interval === 'annual' && (
                  <p className="price-note" style={{ color: '#10B981', fontWeight: 600 }}>
                    {strings.save20}
                  </p>
                )}

                <ul className="pricing-features">
                  {features.map((f, i) => (
                    <li key={i}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  onClick={() => onSubscribe(1)}
                  disabled={submitting || hasActive}
                  className="pricing-cta"
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {submitting && isSelected
                    ? strings.redirecting
                    : hasActive
                    ? strings.subscribed
                    : strings.cta}
                </motion.button>
              </motion.div>
            )
          })}
        </div>

        {error && (
          <motion.div
            className="billing-error"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}
      </section>
    </div>
  )
}
