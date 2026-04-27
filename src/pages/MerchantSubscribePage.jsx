// Public Arabic-first merchant subscription form.
// Route: /subscribe (mounted by App.jsx via lazy import).
//
// Submits to the submit-merchant-subscription edge function which validates,
// resolves the marketer code (if present) into a marketer_id, and inserts
// into public.merchant_subscriptions. Status starts 'pending' — admin
// approval in Supabase Studio fires the auto-create-commission trigger.
//
// The ?ref=ABCD query string pre-fills the marketer code so a marketer
// can share https://trywaya.com/subscribe?ref=ABCD as a one-click link.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { isValidKsaPhone, handlePhoneChange } from '../lib/phone'

// Production brand mark — served from /public, same asset used elsewhere.
const WAYA_LOGO = '/Arabic Letters Midjourney (1).svg'

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 0 20" /><path d="M12 2a15.3 15.3 0 0 0 0 20" />
    </svg>
  )
}

export default function MerchantSubscribePage({ t, lang, setLang, theme, setTheme }) {
  const m = t.merchantSubscribe
  const isAr = lang === 'ar'

  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState('')
  const [loading, setLoading] = useState(false)

  // Pre-fill marketer code from ?ref=ABCD if present.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = (params.get('ref') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
    if (ref) setReferralCode(ref)
    document.title = isAr ? 'اشترك في Waya' : 'Subscribe to Waya'
  }, [isAr])

  const setErr = (msg, field = '') => { setError(msg); setErrorField(field) }
  const clearErr = () => { setError(''); setErrorField('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!businessName.trim()) return setErr(m.errBusinessName, 'business_name')
    if (!contactName.trim()) return setErr(m.errContactName, 'contact_name')
    if (!isValidKsaPhone(phone)) return setErr(m.errPhone, 'phone')
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr(m.errEmail, 'email')
    if (!city.trim()) return setErr(m.errCity, 'city')
    if (!category) return setErr(m.errCategory, 'business_category')
    if (referralCode.length > 0 && !/^[A-Z]{4}$/.test(referralCode)) return setErr(m.errReferralCodeFormat, 'referral_code')

    setLoading(true); clearErr()
    const { data, error: fnErr } = await supabase.functions.invoke('submit-merchant-subscription', {
      body: {
        business_name: businessName.trim(),
        contact_name: contactName.trim(),
        phone,
        email: email.trim().toLowerCase(),
        city: city.trim(),
        business_category: category,
        referral_code: referralCode || null,
      },
    })

    if (fnErr) {
      let msg = fnErr.message
      let field = ''
      try {
        const ctx = fnErr.context
        if (ctx && typeof ctx.json === 'function') {
          const body = await ctx.json()
          if (body?.error) msg = body.error
          if (body?.field) field = body.field
        }
      } catch { /* keep generic msg */ }
      setErr(msg, field); setLoading(false); return
    }
    if (!data?.success) {
      setErr(data?.error || 'Error', data?.field || ''); setLoading(false); return
    }
    navigate('/subscribe/thanks')
  }

  return (
    <div className="merchant-subscribe-page" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="marketer-landing-nav">
        <button className="marketer-landing-brand" onClick={() => navigate('/')} aria-label="Waya">
          <img src={WAYA_LOGO} alt="وايا" />
        </button>
        <div className="marketer-landing-nav-actions">
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="lang-toggle" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <GlobeIcon /><span>{isAr ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </header>

      <motion.div className="merchant-subscribe-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="merchant-subscribe-title">{m.title}</h1>
        <p className="merchant-subscribe-subtitle">{m.subtitle}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>{m.businessName}</label>
            <input type="text" value={businessName} onChange={e => { setBusinessName(e.target.value); clearErr() }} placeholder={m.businessNamePh} aria-invalid={errorField === 'business_name'} />
          </div>
          <div className="auth-field">
            <label>{m.contactName}</label>
            <input type="text" value={contactName} onChange={e => { setContactName(e.target.value); clearErr() }} placeholder={m.contactNamePh} aria-invalid={errorField === 'contact_name'} />
          </div>
          <div className="auth-field">
            <label>{m.phone}</label>
            <input type="tel" value={phone} onChange={e => { setPhone(handlePhoneChange(e.target.value)); clearErr() }} placeholder={m.phonePh} dir="ltr" aria-invalid={errorField === 'phone'} />
          </div>
          <div className="auth-field">
            <label>{m.email}</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); clearErr() }} placeholder={m.emailPh} dir="ltr" aria-invalid={errorField === 'email'} />
          </div>
          <div className="auth-field">
            <label>{m.city}</label>
            <input type="text" value={city} onChange={e => { setCity(e.target.value); clearErr() }} placeholder={m.cityPh} aria-invalid={errorField === 'city'} />
          </div>
          <div className="auth-field">
            <label>{m.category}</label>
            <select value={category} onChange={e => { setCategory(e.target.value); clearErr() }} className="setup-select" aria-invalid={errorField === 'business_category'}>
              <option value="">{m.categoryPh}</option>
              {m.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="auth-field">
            <label>{m.referralCode}</label>
            <input
              type="text"
              value={referralCode}
              onChange={e => { setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)); clearErr() }}
              placeholder={m.referralCodePh}
              dir="ltr"
              maxLength={4}
              aria-invalid={errorField === 'referral_code'}
            />
            <p className="auth-helper">{m.referralCodeHelper}</p>
          </div>

          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? m.submitting : m.submit}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
