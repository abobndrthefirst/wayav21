// BillingPage — subscription plan picker for the shop owner.
// Design mirrors the landing page's Pricing section (master's CSS classes:
// .section, .pricing-card, .pricing-card-featured, .pricing-cta, .pricing-features)
// plus a monthly/annual toggle and a KSA phone field.

import { useEffect, useMemo, useState } from 'react'
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
    titleAr: 'البداية', titleEn: 'Starter',
    monthly: 80, annual: 768,
    featuresAr: ['برنامج ولاء واحد', 'حتى ٢٠٠ عميل', 'لوحة تحكم كاملة', 'دعم عبر البريد'],
    featuresEn: ['1 loyalty program', 'Up to 200 customers', 'Full dashboard access', 'Email support'],
  },
  {
    id: 'tier2',
    titleAr: 'النمو', titleEn: 'Growth',
    monthly: 150, annual: 1440,
    badgeAr: 'الأكثر شيوعاً', badgeEn: 'Most popular',
    featuresAr: ['برامج ولاء غير محدودة', 'حتى ٢٬٠٠٠ عميل', 'معمل البطاقات', 'تحليلات متقدمة', 'دعم عبر واتساب'],
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

function StatusBanner({ subscription, lang }) {
  const isAr = lang === 'ar'
  const labelAr = {
    active: 'اشتراك نشط', pending: 'بانتظار إتمام الدفع', past_due: 'متأخر السداد',
    canceled: 'ملغي', failed: 'فشل', expired: 'منتهي',
  }
  const labelEn = {
    active: 'Active subscription', pending: 'Awaiting payment', past_due: 'Past due',
    canceled: 'Canceled', failed: 'Failed', expired: 'Expired',
  }
  const label = (isAr ? labelAr : labelEn)[subscription.status] ?? subscription.status
  const tone = subscription.status === 'active' ? 'active' :
    subscription.status === 'pending' || subscription.status === 'past_due' ? 'warn' : 'bad'
  return (
    <motion.div
      className={`billing-status billing-status-${tone}`}
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="billing-status-label">{label}</span>
      <span className="billing-status-sub">
        {subscription.plan_id}
        {subscription.current_period_end
          ? ` · ${isAr ? 'ينتهي' : 'Ends'} ${new Date(subscription.current_period_end).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB')}`
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

  const { subscription, hasActive, loading: subLoading, refresh } = useSubscription({ user, authLoading })

  const [interval, setInterval] = useState('annual')
  const [phone, setPhone] = useState('05')
  const [selectedTier, setSelectedTier] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

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
  }, [])

  const phoneValid = isValidKsaPhone(phone)
  const strings = useMemo(() => ({
    title: T('Subscription', 'الاشتراك'),
    sub: T(
      'Pick a plan that fits your shop — pay monthly or save 20% with annual billing.',
      'اختر الخطة التي تناسب متجرك — ادفع شهرياً أو وفّر ٢٠٪ بالدفع السنوي.',
    ),
    monthly: T('Monthly', 'شهري'),
    annual: T('Annual — save 20%', 'سنوي — خصم ٢٠٪'),
    unitMonth: T('SAR / month', 'ر.س / شهر'),
    unitYear: T('SAR / year', 'ر.س / سنة'),
    phoneLabel: T('Phone number (for StreamPay invoices)', 'رقم الجوال (لإشعارات ستريم باي)'),
    phoneHint: isAr ? KSA_PHONE_HINT_AR : KSA_PHONE_HINT_EN,
    phoneErr: isAr ? KSA_PHONE_ERR_AR : KSA_PHONE_ERR_EN,
    cta: T('Continue to payment', 'اذهب إلى الدفع'),
    subscribed: T('Subscribed', 'مشترك'),
    back: T('← Home', '← الرئيسية'),
    redirecting: T('Redirecting…', 'جارٍ التحويل…'),
    save20: T('Save 20%', 'وفّر ٢٠٪'),
    loading: T('Loading…', 'جارٍ التحميل…'),
    existingPending: T(
      'You already have a subscription in progress.',
      'لديك اشتراك قائم بالفعل.',
    ),
  }), [isAr])

  const onSubscribe = async (tier) => {
    const normalized = normalizeKsaPhone(phone)
    if (!normalized) { setError(strings.phoneErr); return }
    setSelectedTier(tier)
    setSubmitting(true)
    setError(null)
    try {
      const res = await createCheckout({
        plan_id: `tier${tier}_${interval}`,
        phone: normalized,
      })
      window.location.assign(res.checkout_url)
    } catch (e) {
      if (e instanceof StreamPayApiError && e.status === 409 && e.existingSubscriptionId) {
        await refresh()
        setError(strings.existingPending)
      } else {
        setError(e?.message ?? String(e))
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

        {!subLoading && subscription && <StatusBanner subscription={subscription} lang={lang} />}

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

        <div className="pricing-cards billing-tiers">
          {TIERS.map((tier, idx) => {
            const price = interval === 'monthly' ? tier.monthly : tier.annual
            const unit = interval === 'monthly' ? strings.unitMonth : strings.unitYear
            const label = isAr ? tier.titleAr : tier.titleEn
            const features = isAr ? tier.featuresAr : tier.featuresEn
            const badge = isAr ? tier.badgeAr : tier.badgeEn
            const featured = tier.id === 'tier2'
            const isSelected = selectedTier === idx + 1
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
                  onClick={() => onSubscribe(idx + 1)}
                  disabled={submitting || !phoneValid || hasActive}
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

        {!hasActive && (
          <motion.div
            className="billing-phone-card"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <label className="billing-phone-label">{strings.phoneLabel}</label>
            <input
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
          </motion.div>
        )}

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
