import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
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
export default function WalletEnrollPage({ lang = 'en' }) {
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

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      setError(T('Please enter name and phone.', 'يرجى إدخال الاسم ورقم الهاتف.'))
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
      t: enrollmentToken,
    })
    const headers = {
      'Content-Type': 'application/json',
      'x-enrollment-token': enrollmentToken,
    }

    try {
      // On desktop, fire both. On iOS, fire Apple. On Android, fire Google.
      const calls = []
      if (device === 'ios' || device === 'desktop') {
        calls.push(
          fetch(`${SUPABASE_URL}/functions/v1/apple-wallet-public`, {
            method: 'POST', headers, body,
          }).then(async (res) => {
            if (!res.ok) throw new Error(`Apple: ${res.status}`)
            const blob = await res.blob()
            setAppleBlobUrl(URL.createObjectURL(blob))
          }).catch((err) => console.error('apple', err))
        )
      }
      if (device === 'android' || device === 'desktop') {
        calls.push(
          fetch(`${SUPABASE_URL}/functions/v1/google-wallet-public`, {
            method: 'POST', headers, body,
          }).then(async (res) => {
            const json = await res.json()
            if (json.success) setGoogleSaveUrl(json.saveUrl)
            else throw new Error(json.error || 'Google Wallet error')
          }).catch((err) => console.error('google', err))
        )
      }
      await Promise.all(calls)
      setDone(true)
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

  const cardStyle = {
    background: program.background_url
      ? `linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.4)),url(${program.background_url}) center/cover`
      : program.card_color || '#10B981',
    color: program.text_color || '#FFFFFF',
  }

  return (
    <div className="we-shell" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="we-card">
        <div className="we-preview" style={cardStyle}>
          {program.logo_url && <img src={program.logo_url} alt="" className="we-logo" />}
          <h1>{shop.name}</h1>
          <p className="we-program-name">{program.name}</p>
          <p className="we-reward">🎁 {program.reward_title}</p>
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
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="05XXXXXXXX" />
            </label>

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
                <a href={googleSaveUrl} target="_blank" rel="noopener" className="we-wallet-pill" aria-label="Add to Google Wallet">
                  <img src={googleWalletIcon} className="we-wallet-icon" alt="" />
                  <span className="we-wallet-text">
                    <span className="we-wallet-small">{T('Add to', 'إضافة إلى')}</span>
                    <span className="we-wallet-big">Google Wallet</span>
                  </span>
                </a>
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
