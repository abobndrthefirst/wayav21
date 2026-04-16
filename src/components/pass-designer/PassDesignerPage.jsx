import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import DesignerEditorPanel from './DesignerEditorPanel'
import DesignerPreviewPanel from './DesignerPreviewPanel'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const LOYALTY_TYPES = [
  { key: 'stamp', emoji: '🎟️' },
  { key: 'points', emoji: '⭐' },
  { key: 'tiered', emoji: '🏆' },
  { key: 'coupon', emoji: '🎁' },
]

const BackArrow = ({ isAr }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" style={{ transform: isAr ? 'scaleX(-1)' : undefined }}>
    <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.56l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
  </svg>
)

export default function PassDesignerPage({ program, shop, onBack, onCreated, lang = 'en' }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)
  const isNew = !program?.id

  const [name, setName] = useState(program?.name || shop?.name || '')
  const [loyaltyType, setLoyaltyType] = useState(program?.loyalty_type || 'stamp')
  const [stampsRequired, setStampsRequired] = useState(program?.stamps_required || 10)
  const [rewardThreshold, setRewardThreshold] = useState(program?.reward_threshold || 10)
  const [cardColor, setCardColor] = useState(program?.card_color || '#10B981')
  const [textColor, setTextColor] = useState(program?.text_color || '#FFFFFF')
  const [logoUrl, setLogoUrl] = useState(program?.logo_url || shop?.logo_url || '')
  const [backgroundUrl, setBackgroundUrl] = useState(program?.background_url || '')
  const [rewardIconUrl, setRewardIconUrl] = useState(program?.reward_icon_url || '')
  const [rewardTitle, setRewardTitle] = useState(program?.reward_title || T('Free coffee', 'قهوة مجانية'))
  const [rewardDescription, setRewardDescription] = useState(program?.reward_description || '')
  const [barcodeType, setBarcodeType] = useState(program?.barcode_type || 'QR')

  const [saving, setSaving] = useState(false)
  const [savedProgram, setSavedProgram] = useState(program?.id ? program : null)
  const [appleLoading, setAppleLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const previewData = {
    name: name || shop?.name || '',
    loyaltyType,
    stampsRequired,
    rewardThreshold,
    rewardTitle,
    couponDiscount: program?.coupon_discount || '',
    cardColor, textColor, logoUrl, backgroundUrl, rewardIconUrl, barcodeType,
  }

  const handleSave = async () => {
    if (!name.trim()) { showToast(T('Card name is required', 'اسم البطاقة مطلوب')); return }
    setSaving(true)

    const payload = {
      shop_id: shop.id,
      name: name.trim(),
      loyalty_type: loyaltyType,
      stamps_required: loyaltyType === 'stamp' ? stampsRequired : null,
      reward_threshold: loyaltyType === 'points' ? rewardThreshold : null,
      reward_title: rewardTitle.trim() || 'Reward',
      reward_description: rewardDescription.trim() || null,
      reward_icon_url: rewardIconUrl || null,
      card_color: cardColor,
      text_color: textColor,
      logo_url: logoUrl || null,
      background_url: backgroundUrl || null,
      barcode_type: barcodeType,
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    let result
    if (savedProgram?.id) {
      const { data, error } = await supabase.from('loyalty_programs').update(payload).eq('id', savedProgram.id).select().single()
      if (error) { showToast(T('Error: ', 'خطأ: ') + error.message); setSaving(false); return }
      result = data
    } else {
      const { data, error } = await supabase.from('loyalty_programs').insert(payload).select().single()
      if (error) { showToast(T('Error: ', 'خطأ: ') + error.message); setSaving(false); return }
      result = data
      onCreated?.(result)
    }

    setSavedProgram(result)
    setSaving(false)
    showToast(isNew && !savedProgram ? T('Card created!', 'تم إنشاء البطاقة!') : T('Design saved!', 'تم حفظ التصميم!'))
  }

  const mintToken = async (programId) => {
    const { data, error } = await supabase.functions.invoke('mint-enrollment-token', {
      body: { program_id: programId },
    })
    if (error || !data?.success) throw new Error(error?.message || data?.error || T('Could not mint token', 'تعذر إنشاء رمز التسجيل'))
    return data.token
  }

  const handleApplePass = async () => {
    if (!savedProgram?.id) { showToast(T('Save the card first', 'احفظ البطاقة أولاً')); return }
    setAppleLoading(true)
    try {
      const token = await mintToken(savedProgram.id)
      const res = await fetch(`${SUPABASE_URL}/functions/v1/apple-wallet-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: savedProgram.id, customer_name: 'Test Preview', customer_phone: '0500000000', enrollment_token: token }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || 'Failed') }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${(name || 'pass').replace(/[^\w]/g, '_')}.pkpass`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast(T('Apple Pass downloaded!', 'تم تحميل بطاقة آبل!'))
    } catch (err) { showToast(T('Error: ', 'خطأ: ') + err.message) }
    setAppleLoading(false)
  }

  const handleGooglePass = async () => {
    if (!savedProgram?.id) { showToast(T('Save the card first', 'احفظ البطاقة أولاً')); return }
    setGoogleLoading(true)
    try {
      const token = await mintToken(savedProgram.id)
      const res = await fetch(`${SUPABASE_URL}/functions/v1/google-wallet-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: savedProgram.id, customer_name: 'Test Preview', customer_phone: '0500000000', enrollment_token: token }),
      })
      const data = await res.json()
      if (data.success && data.saveUrl) { window.open(data.saveUrl, '_blank'); showToast(T('Google Wallet opened!', 'تم فتح محفظة جوجل!')) }
      else throw new Error(data.error || 'Failed')
    } catch (err) { showToast(T('Error: ', 'خطأ: ') + err.message) }
    setGoogleLoading(false)
  }

  return (
    <div className="pd-page" dir={isAr ? 'rtl' : 'ltr'}>
      <button type="button" className="pd-back" onClick={onBack}>
        <BackArrow isAr={isAr} />
        {T('Back', 'رجوع')}
      </button>

      <h2 className="pd-title">
        {isNew && !savedProgram ? T('Create New Card', 'إنشاء بطاقة جديدة') : T('Design Pass', 'تصميم البطاقة')}{savedProgram?.name ? ` — ${savedProgram.name}` : ''}
      </h2>

      <div className="pd-grid">
        <div className="pd-editor">
          {/* Card info section (always shown in create mode, collapsible in edit) */}
          <h3 className="pd-section-title" style={{ borderTop: 'none', paddingTop: 0 }}>
            {T('Card Info', 'معلومات البطاقة')}
          </h3>
          <div className="pd-field">
            <label>{T('Card name', 'اسم البطاقة')}</label>
            <input className="pd-field-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder={T('e.g. Sultan Café', 'مثال: مقهى السلطان')} />
          </div>
          <div className="pd-field">
            <label>{T('Loyalty type', 'نوع الولاء')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {LOYALTY_TYPES.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setLoyaltyType(t.key)}
                  style={{
                    padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${loyaltyType === t.key ? '#10B981' : '#e5e8ec'}`,
                    background: loyaltyType === t.key ? '#f0fdf4' : '#fff', cursor: 'pointer', textAlign: 'center',
                    fontSize: 13, fontWeight: loyaltyType === t.key ? 600 : 400, transition: 'all .15s',
                  }}
                >
                  <span style={{ fontSize: 20, display: 'block', marginBottom: 2 }}>{t.emoji}</span>
                  {t.key === 'stamp' ? T('Stamp', 'أختام') : t.key === 'points' ? T('Points', 'نقاط') : t.key === 'tiered' ? T('Tiered', 'مستويات') : T('Coupon', 'كوبون')}
                </button>
              ))}
            </div>
          </div>
          {loyaltyType === 'stamp' && (
            <div className="pd-field">
              <label>{T('Stamps for reward', 'أختام للمكافأة')}</label>
              <input className="pd-field-input" type="number" min={1} max={50} value={stampsRequired} onChange={e => setStampsRequired(Number(e.target.value))} />
            </div>
          )}
          {loyaltyType === 'points' && (
            <div className="pd-field">
              <label>{T('Points for reward', 'نقاط للمكافأة')}</label>
              <input className="pd-field-input" type="number" min={1} value={rewardThreshold} onChange={e => setRewardThreshold(Number(e.target.value))} />
            </div>
          )}

          <DesignerEditorPanel
            shopId={shop.id}
            cardColor={cardColor} setCardColor={setCardColor}
            textColor={textColor} setTextColor={setTextColor}
            logoUrl={logoUrl} setLogoUrl={setLogoUrl}
            backgroundUrl={backgroundUrl} setBackgroundUrl={setBackgroundUrl}
            rewardIconUrl={rewardIconUrl} setRewardIconUrl={setRewardIconUrl}
            rewardTitle={rewardTitle} setRewardTitle={setRewardTitle}
            rewardDescription={rewardDescription} setRewardDescription={setRewardDescription}
            barcodeType={barcodeType} setBarcodeType={setBarcodeType}
            T={T}
            embedded
          />
        </div>

        <DesignerPreviewPanel previewData={previewData} T={T} isAr={isAr} />
      </div>

      {/* Help CTA Banner */}
      <div className="pd-help-banner">
        <div className="pd-help-content">
          <div className="pd-help-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><circle cx="12" cy="12" r="10" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="pd-help-text">
            <h4>{T('Need help designing your pass?', 'تحتاج مساعدة في تصميم بطاقتك؟')}</h4>
            <p>{T("Let our team design and create a professional pass for you — we'll handle everything!", 'فريقنا يصمم ويبني لك بطاقة احترافية — نتكفل بكل شيء!')}</p>
          </div>
          <div className="pd-help-buttons">
            <a href="https://wa.me/966509336498?text=%D8%A3%D8%A8%D8%BA%D9%89%20%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D8%A9%20%D9%81%D9%8A%20%D8%AA%D8%B5%D9%85%D9%8A%D9%85%20%D8%A8%D8%B7%D8%A7%D9%82%D8%A9%20%D8%A7%D9%84%D9%88%D9%84%D8%A7%D8%A1" target="_blank" rel="noopener noreferrer" className="pd-help-btn whatsapp">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {T('WhatsApp', 'واتساب')}
            </a>
            <a href="mailto:support@wfrly.com?subject=Help%20designing%20my%20loyalty%20pass" className="pd-help-btn email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              {T('Email Us', 'راسلنا')}
            </a>
          </div>
        </div>
      </div>

      <div className="pd-actions">
        <button type="button" className="pd-action-btn ghost" onClick={onBack}>
          {T('Cancel', 'إلغاء')}
        </button>
        {savedProgram?.id && (
          <>
            <button type="button" className="pd-action-btn google" onClick={handleGooglePass} disabled={googleLoading}>
              <svg viewBox="0 0 18 18" fill="none" style={{ width: 18, height: 18 }}><path d="M17.2 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.6c-.2 1.1-.8 2-1.7 2.6v2.1h2.7c1.6-1.5 2.6-3.6 2.6-6.3z" fill="#4285F4"/><path d="M9 18c2.3 0 4.3-.8 5.7-2.1l-2.7-2.1c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H1.2v2.2C2.6 16 5.5 18 9 18z" fill="#34A853"/><path d="M4 11c-.2-.5-.3-1-.3-1.5s.1-1.1.3-1.5V5.8H1.2C.4 7.3 0 9.1 0 10.5c0 1.4.4 2.7 1.2 3.7L4 11z" fill="#FBBC05"/><path d="M9 3.6c1.3 0 2.5.4 3.4 1.3l2.5-2.5C13.2.9 11.3 0 9 0 5.5 0 2.6 2 1.2 4.8L4 7c.7-2.1 2.7-3.4 5-3.4z" fill="#EA4335"/></svg>
              {googleLoading ? '...' : T('Google Wallet', 'محفظة جوجل')}
            </button>
            <button type="button" className="pd-action-btn apple" onClick={handleApplePass} disabled={appleLoading}>
              <svg viewBox="0 0 18 18" fill="currentColor" style={{ width: 18, height: 18 }}><path d="M14.1 9.5c0-1.9 1.5-2.8 1.6-2.9-.9-1.3-2.2-1.5-2.7-1.5-1.1-.1-2.2.7-2.8.7s-1.5-.7-2.4-.6c-1.3 0-2.4.7-3.1 1.8-1.3 2.3-.3 5.7 1 7.5.6.9 1.4 2 2.4 1.9 1-.1 1.3-.6 2.5-.6s1.5.6 2.5.6 1.7-1 2.3-1.9c.7-1.1 1-2.1 1-2.2-.1 0-2-.7-2.3-2.8zM12.2 3.7c.5-.6.9-1.5.8-2.4-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.3.8.1 1.7-.4 2.3-1.1z"/></svg>
              {appleLoading ? '...' : T('Apple Pass', 'بطاقة آبل')}
            </button>
          </>
        )}
        <button type="button" className="pd-action-btn save" onClick={handleSave} disabled={saving}>
          {saving ? '...' : isNew && !savedProgram ? T('Create Card', 'إنشاء البطاقة') : T('Save Design', 'حفظ التصميم')}
        </button>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div className="pd-toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: .25 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
