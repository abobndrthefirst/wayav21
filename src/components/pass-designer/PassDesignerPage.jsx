import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import DesignerEditorPanel from './DesignerEditorPanel'
import DesignerPreviewPanel from './DesignerPreviewPanel'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const BackArrow = ({ isAr }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" style={{ transform: isAr ? 'scaleX(-1)' : undefined }}>
    <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.56l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
  </svg>
)

export default function PassDesignerPage({ program, shop, onBack, lang = 'en' }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)

  const [cardColor, setCardColor] = useState(program?.card_color || '#10B981')
  const [textColor, setTextColor] = useState(program?.text_color || '#FFFFFF')
  const [logoUrl, setLogoUrl] = useState(program?.logo_url || shop?.logo_url || '')
  const [backgroundUrl, setBackgroundUrl] = useState(program?.background_url || '')
  const [rewardIconUrl, setRewardIconUrl] = useState(program?.reward_icon_url || '')
  const [rewardTitle, setRewardTitle] = useState(program?.reward_title || '')
  const [rewardDescription, setRewardDescription] = useState(program?.reward_description || '')
  const [barcodeType, setBarcodeType] = useState(program?.barcode_type || 'QR')

  const [saving, setSaving] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const previewData = {
    name: program?.name || shop?.name || '',
    loyaltyType: program?.loyalty_type || 'stamp',
    stampsRequired: program?.stamps_required || 10,
    rewardThreshold: program?.reward_threshold || 10,
    rewardTitle,
    couponDiscount: program?.coupon_discount || '',
    cardColor,
    textColor,
    logoUrl,
    backgroundUrl,
    rewardIconUrl,
    barcodeType,
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      card_color: cardColor,
      text_color: textColor,
      logo_url: logoUrl || null,
      background_url: backgroundUrl || null,
      reward_icon_url: rewardIconUrl || null,
      reward_title: rewardTitle.trim() || 'Reward',
      reward_description: rewardDescription.trim() || null,
      barcode_type: barcodeType,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase
      .from('loyalty_programs')
      .update(payload)
      .eq('id', program.id)
    setSaving(false)
    if (error) {
      showToast(T('Error saving: ', 'خطأ في الحفظ: ') + error.message)
    } else {
      showToast(T('Design saved!', 'تم حفظ التصميم!'))
    }
  }

  const handleApplePass = async () => {
    setAppleLoading(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/apple-wallet-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: shop.id,
          customer_name: 'Test Preview',
          customer_phone: '0500000000',
        }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Failed to generate pass')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(program?.name || 'pass').replace(/[^\w]/g, '_')}.pkpass`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast(T('Apple Pass downloaded!', 'تم تحميل بطاقة آبل!'))
    } catch (err) {
      showToast(T('Error: ', 'خطأ: ') + err.message)
    }
    setAppleLoading(false)
  }

  const handleGooglePass = async () => {
    setGoogleLoading(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/google-wallet-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: shop.id,
          customer_name: 'Test Preview',
          customer_phone: '0500000000',
        }),
      })
      const data = await res.json()
      if (data.success && data.saveUrl) {
        window.open(data.saveUrl, '_blank')
        showToast(T('Google Wallet opened!', 'تم فتح محفظة جوجل!'))
      } else {
        throw new Error(data.error || 'Failed to generate pass')
      }
    } catch (err) {
      showToast(T('Error: ', 'خطأ: ') + err.message)
    }
    setGoogleLoading(false)
  }

  return (
    <div className="pd-page" dir={isAr ? 'rtl' : 'ltr'}>
      <button type="button" className="pd-back" onClick={onBack}>
        <BackArrow isAr={isAr} />
        {T('Back to programs', 'العودة للبرامج')}
      </button>

      <h2 className="pd-title">
        {T('Design Pass', 'تصميم البطاقة')}{program?.name ? ` — ${program.name}` : ''}
      </h2>

      <div className="pd-grid">
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
        />

        <DesignerPreviewPanel previewData={previewData} T={T} isAr={isAr} />
      </div>

      <div className="pd-actions">
        <button type="button" className="pd-action-btn ghost" onClick={onBack}>
          {T('Cancel', 'إلغاء')}
        </button>
        <button type="button" className="pd-action-btn google" onClick={handleGooglePass} disabled={googleLoading}>
          <svg viewBox="0 0 18 18" fill="none" style={{ width: 18, height: 18 }}><path d="M17.2 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.6c-.2 1.1-.8 2-1.7 2.6v2.1h2.7c1.6-1.5 2.6-3.6 2.6-6.3z" fill="#4285F4"/><path d="M9 18c2.3 0 4.3-.8 5.7-2.1l-2.7-2.1c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H1.2v2.2C2.6 16 5.5 18 9 18z" fill="#34A853"/><path d="M4 11c-.2-.5-.3-1-.3-1.5s.1-1.1.3-1.5V5.8H1.2C.4 7.3 0 9.1 0 10.5c0 1.4.4 2.7 1.2 3.7L4 11z" fill="#FBBC05"/><path d="M9 3.6c1.3 0 2.5.4 3.4 1.3l2.5-2.5C13.2.9 11.3 0 9 0 5.5 0 2.6 2 1.2 4.8L4 7c.7-2.1 2.7-3.4 5-3.4z" fill="#EA4335"/></svg>
          {googleLoading ? T('Opening...', 'جارٍ الفتح...') : T('Add to Google Wallet', 'أضف لمحفظة جوجل')}
        </button>
        <button type="button" className="pd-action-btn apple" onClick={handleApplePass} disabled={appleLoading}>
          <svg viewBox="0 0 18 18" fill="currentColor" style={{ width: 18, height: 18 }}><path d="M14.1 9.5c0-1.9 1.5-2.8 1.6-2.9-.9-1.3-2.2-1.5-2.7-1.5-1.1-.1-2.2.7-2.8.7s-1.5-.7-2.4-.6c-1.3 0-2.4.7-3.1 1.8-1.3 2.3-.3 5.7 1 7.5.6.9 1.4 2 2.4 1.9 1-.1 1.3-.6 2.5-.6s1.5.6 2.5.6 1.7-1 2.3-1.9c.7-1.1 1-2.1 1-2.2-.1 0-2-.7-2.3-2.8zM12.2 3.7c.5-.6.9-1.5.8-2.4-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.3.8.1 1.7-.4 2.3-1.1z"/></svg>
          {appleLoading ? T('Downloading...', 'جارٍ التحميل...') : T('Download Apple Pass', 'تحميل بطاقة آبل')}
        </button>
        <button type="button" className="pd-action-btn save" onClick={handleSave} disabled={saving}>
          {saving ? T('Saving...', 'جارٍ الحفظ...') : T('Save Design', 'حفظ التصميم')}
        </button>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="pd-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: .25 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
