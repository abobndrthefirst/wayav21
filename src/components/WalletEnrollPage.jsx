import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SUPABASE_URL = 'https://unnheqshkxpbflozechm.supabase.co'

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
    setSubmitting(true)
    setError(null)

    const body = JSON.stringify({
      program_id: program.id,
      shop_id: shop.id,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
    })

    try {
      // On desktop, fire both. On iOS, fire Apple. On Android, fire Google.
      const calls = []
      if (device === 'ios' || device === 'desktop') {
        calls.push(
          fetch(`${SUPABASE_URL}/functions/v1/apple-wallet-public`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
          }).then(async (res) => {
            const json = await res.json()
            if (json.success) setGoogleSaveUrl(json.saveUrl)
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
                <a href={appleBlobUrl} download={`${program.name}.pkpass`} className="we-wallet-pill we-apple-pill" aria-label="Add to Apple Wallet">
                  <svg className="we-wallet-icon" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                    <rect x="2" y="6" width="32" height="24" rx="4" fill="#fff"/>
                    <rect x="2" y="11" width="32" height="3" fill="#FA6E5A"/>
                    <rect x="2" y="14" width="32" height="3" fill="#FFC93C"/>
                    <rect x="2" y="17" width="32" height="3" fill="#22C55E"/>
                    <rect x="2" y="20" width="32" height="3" fill="#3B82F6"/>
                    <path d="M2 24h32v2a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-2z" fill="#E5E7EB"/>
                  </svg>
                  <span className="we-wallet-text">
                    <span className="we-wallet-small">Add to</span>
                    <span className="we-wallet-big">Apple Wallet</span>
                  </span>
                </a>
              )}
              {googleSaveUrl && (device === 'android' || device === 'desktop') && (
                <a href={googleSaveUrl} target="_blank" rel="noopener" className="we-wallet-pill we-google-pill" aria-label="Add to Google Wallet">
                  <svg className="we-wallet-icon" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                    <rect x="3" y="7" width="30" height="6" rx="2" fill="#34A853"/>
                    <rect x="3" y="12" width="30" height="6" rx="2" fill="#FBBC04"/>
                    <path d="M3 17h30v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-9z" fill="#4285F4"/>
                    <path d="M3 17h30v4l-15 5L3 21v-4z" fill="#EA4335"/>
                  </svg>
                  <span className="we-wallet-text">
                    <span className="we-wallet-small">Add to</span>
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
