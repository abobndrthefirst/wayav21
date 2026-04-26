import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  isValidKsaPhone,
  handlePhoneChange,
  KSA_PHONE_HINT_EN,
  KSA_PHONE_HINT_AR,
  KSA_PHONE_ERR_EN,
  KSA_PHONE_ERR_AR,
} from '../lib/phone'
import appleWalletIcon from './Wallet_App_icon_iOS_12.png'
import googleWalletIcon from '../png-transparent-google-wallet-logo-thumbnail-tech-companies.png'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Customer landing — /w/:programId
 * 1. Load program + shop
 * 2. Detect device (iOS / Android / desktop)
 * 3. Customer enters name + phone
 * 4. Generate the wallet pass for the detected platform (or both on desktop)
 */
export default function WalletEnrollPage({ lang: initialLang = 'ar' }) {
  // Internal lang state so the customer can switch on this page even though
  // the QR-deeplinked URL doesn't carry a locale.
  const [lang, setLang] = useState(initialLang)
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)

  const programId = window.location.pathname.split('/w/')[1]?.split('/')[0]
  // Enrollment token from ?t=... — required by wallet-public endpoints
  const enrollmentToken = new URLSearchParams(window.location.search).get('t') || ''

  const [program, setProgram] = useState(null)
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [device, setDevice] = useState('desktop') // 'ios' | 'android' | 'desktop'

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('') // '' | 'male' | 'female' | 'prefer_not'
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [appleBlobUrl, setAppleBlobUrl] = useState(null)
  const [googleSaveUrl, setGoogleSaveUrl] = useState(null)
  const [done, setDone] = useState(false)

  // Detect device
  useEffect(() => {
    const ua = navigator.userAgent || ''
    if (/iPad|iPhone|iPod/.test(ua)) setDevice('ios')
    else if (/Android/.test(ua)) setDevice('android')
    else setDevice('desktop')
  }, [])

  // Load program + shop
  useEffect(() => {
    if (!programId) return
    ;(async () => {
      setLoading(true)
      const { data: prog, error: e1 } = await supabase
        .from('loyalty_programs')
        .select('*, shop:shops(*)')
        .eq('id', programId)
        .eq('is_active', true)
        .single()
      if (e1 || !prog) {
        setError(T('This loyalty card is not available.', 'هذه البطاقة غير متاحة.'))
        setLoading(false)
        return
      }
      setProgram(prog)
      setShop(prog.shop)
      setLoading(false)
    })()
  }, [programId])

  const phoneInvalid = phone.length > 0 && !isValidKsaPhone(phone)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      setError(T('Please enter name and phone.', 'يرجى إدخال الاسم ورقم الهاتف.'))
      return
    }
    if (!isValidKsaPhone(phone)) {
      setError(T(KSA_PHONE_ERR_EN, KSA_PHONE_ERR_AR))
      return
    }
    if (!enrollmentToken) {
      setError(T('This enrollment link is invalid or expired. Ask the merchant for a fresh QR.', 'رابط التسجيل غير صالح أو منتهي الصلاحية. اطلب من المتجر رمز QR جديد.'))
      return
    }
    setSubmitting(true)
    setError(null)

    const body = JSON.stringify({
      program_id: program.id,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_gender: gender || null,
      t: enrollmentToken,
    })
    const headers = {
      'Content-Type': 'application/json',
      'x-enrollment-token': enrollmentToken,
    }

    // Collect server error messages so the user actually sees them instead
    // of a blank success screen when both wallet calls fail silently.
    const failures = []
    let anyOk = false

    try {
      const calls = []
      if (device === 'ios' || device === 'desktop') {
        calls.push(
          fetch(`${SUPABASE_URL}/functions/v1/apple-wallet-public`, {
            method: 'POST', headers, body,
          }).then(async (res) => {
            if (!res.ok) {
              let msg = `Apple Wallet: ${res.status}`
              try { const j = await res.json(); if (j.error) msg = `Apple Wallet: ${j.error}` } catch {}
              throw new Error(msg)
            }
            const blob = await res.blob()
            setAppleBlobUrl(URL.createObjectURL(blob))
            anyOk = true
          }).catch((err) => { console.error('apple', err); failures.push(err.message) })
        )
      }
      if (device === 'android' || device === 'desktop') {
        calls.push(
          fetch(`${SUPABASE_URL}/functions/v1/google-wallet-public`, {
            method: 'POST', headers, body,
          }).then(async (res) => {
            const json = await res.json().catch(() => ({}))
            if (res.ok && json.success) {
              setGoogleSaveUrl(json.saveUrl)
              anyOk = true
            } else {
              throw new Error(`Google Wallet: ${json.error || res.status}`)
            }
          }).catch((err) => { console.error('google', err); failures.push(err.message) })
        )
      }
      await Promise.all(calls)
      if (anyOk) {
        setDone(true)
        if (failures.length > 0) console.warn('Partial wallet failure:', failures.join('; '))
      } else {
        setError(failures.join(' — ') || T('Could not create your card. Please try again.', 'تعذر إنشاء البطاقة. حاول مرة أخرى.'))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="we-shell"><div className="we-card"><p>{T('Loading…', 'جارٍ التحميل…')}</p></div></div>
  }

  if (!program) {
    return <div className="we-shell"><div className="we-card"><p>{error || T('Card not found', 'البطاقة غير موجودة')}</p></div></div>
  }

  const headerBg = program.card_color || '#10B981'
  const initial = (shop.name || '?').trim().charAt(0).toUpperCase()

  return (
    <div className="we-shell" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="we-card">
        <button
          type="button"
          className="we-lang-toggle"
          onClick={() => setLang(isAr ? 'en' : 'ar')}
          aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          {isAr ? 'EN' : 'عربي'}
        </button>

        <div className="we-header" style={{ background: headerBg }}>
          {program.logo_url ? (
            <img src={program.logo_url} alt="" className="we-logo" />
          ) : (
            <div className="we-logo we-logo-fallback" aria-hidden>{initial}</div>
          )}
          <h1 className="we-shop-name">{shop.name}</h1>
        </div>

        {!done ? (
          <form onSubmit={submit} className="we-form">
            <h2>{T('Add to your wallet', 'أضف إلى محفظتك')}</h2>
            <p className="we-sub">{T('Enter your details to get your loyalty card.', 'أدخل بياناتك للحصول على بطاقة الولاء.')}</p>

            <label>
              <span>{T('Your name', 'الاسم')}</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </label>
            <label>
              <span>{T('Phone', 'الهاتف')}</span>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(handlePhoneChange(e.target.value))}
                required
                placeholder="05XXXXXXXX"
                maxLength={13}
                dir="ltr"
                aria-invalid={phoneInvalid ? 'true' : 'false'}
                style={phoneInvalid ? { borderColor: '#e11d48', outlineColor: '#e11d48' } : undefined}
              />
              <small
                style={{
                  display: 'block',
                  marginTop: 4,
                  fontSize: 12,
                  color: phoneInvalid ? '#e11d48' : '#6b7280',
                }}
              >
                {phoneInvalid
                  ? T(KSA_PHONE_ERR_EN, KSA_PHONE_ERR_AR)
                  : T(KSA_PHONE_HINT_EN, KSA_PHONE_HINT_AR)}
              </small>
            </label>

            <fieldset className="we-gender">
              <legend>{T('Gender', 'الجنس')}</legend>
              <div className="we-gender-options">
                {[
                  { val: 'male', en: 'Male', ar: 'ذكر', emoji: '👨' },
                  { val: 'female', en: 'Female', ar: 'أنثى', emoji: '👩' },
                  { val: 'prefer_not', en: 'Skip', ar: 'تخطي', emoji: '🤍' },
                ].map((opt) => (
                  <label
                    key={opt.val}
                    className={`we-gender-opt${gender === opt.val ? ' is-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={opt.val}
                      checked={gender === opt.val}
                      onChange={() => setGender(opt.val)}
                    />
                    <span className="we-gender-emoji" aria-hidden>{opt.emoji}</span>
                    <span className="we-gender-label">{T(opt.en, opt.ar)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {error && <div className="we-err">{error}</div>}

            <button type="submit" className="we-submit" disabled={submitting} style={{ background: program.card_color || '#10B981' }}>
              {submitting ? T('Creating your pass…', 'جارٍ الإنشاء…') : T('Get my loyalty card', 'احصل على البطاقة')}
            </button>

            {program.terms && (
              <details className="we-terms">
                <summary>{T('Terms & Conditions', 'الشروط والأحكام')}</summary>
                <p>{program.terms}</p>
              </details>
            )}
          </form>
        ) : (
          <div className="we-success">
            <h2>✓ {T('Card ready!', 'البطاقة جاهزة!')}</h2>
            <p>{T('Tap the button for your wallet:', 'اضغط الزر المناسب لمحفظتك:')}</p>
            <div className="we-wallet-buttons">
              {appleBlobUrl && (device === 'ios' || device === 'desktop') && (
                <a href={appleBlobUrl} download={`${program.name}.pkpass`} className="we-wallet-pill" aria-label="Add to Apple Wallet">
                  <img src={appleWalletIcon} className="we-wallet-icon" alt="" />
                  <span className="we-wallet-text">
                    <span className="we-wallet-small">{T('Add to', 'إضافة إلى')}</span>
                    <span className="we-wallet-big">Apple Wallet</span>
                  </span>
                </a>
              )}
              {googleSaveUrl && (device === 'android' || device === 'desktop') && (
                <>
                  <a href={googleSaveUrl} target="_blank" rel="noopener" className="we-wallet-pill" aria-label="Add to Google Wallet">
                    <img src={googleWalletIcon} className="we-wallet-icon" alt="" />
                    <span className="we-wallet-text">
                      <span className="we-wallet-small">{T('Add to', 'إضافة إلى')}</span>
                      <span className="we-wallet-big">Google Wallet</span>
                    </span>
                  </a>
                  <p style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', margin: '4px 0 0', lineHeight: 1.4 }}>
                    {T(
                      'If Google Wallet says "this card is not available", please contact the merchant — their Google authorization needs to be completed.',
                      'إذا ظهرت رسالة "البطاقة غير متاحة"، يرجى التواصل مع المتجر لاستكمال ربط حساب جوجل.',
                    )}
                  </p>
                </>
              )}
              {!googleSaveUrl && (device === 'android' || device === 'desktop') && (
                <div style={{ padding: '10px 16px', background: '#fef2f2', borderRadius: 10, fontSize: 13, color: '#991b1b', textAlign: 'center' }}>
                  {T('Google Wallet is temporarily unavailable. Your Apple Wallet pass is ready.', 'محفظة جوجل غير متاحة حالياً. بطاقة آبل جاهزة.')}
                </div>
              )}
              {!appleBlobUrl && (device === 'ios' || device === 'desktop') && !googleSaveUrl && (
                <div style={{ padding: '10px 16px', background: '#fef2f2', borderRadius: 10, fontSize: 13, color: '#991b1b', textAlign: 'center' }}>
                  {T('Could not generate your pass. Please try again.', 'تعذر إنشاء البطاقة. حاول مرة أخرى.')}
                </div>
              )}
            </div>
            {program.google_maps_url && (
              <a href={program.google_maps_url} target="_blank" rel="noopener" className="we-link">📍 {T('Find us on Google Maps', 'موقعنا على الخريطة')}</a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
