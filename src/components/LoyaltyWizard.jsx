import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import appleWalletIcon from './Wallet_App_icon_iOS_12.png'
import googleWalletIcon from '../png-transparent-google-wallet-logo-thumbnail-tech-companies.png'

/**
 * Loyalty Program Wizard — 3 steps.
 * Step 1: Details (business name + loyalty type + rules + terms/expiry)
 * Step 2: Branding (colors, logo, background, reward icon) with Apple + Google wallet previews
 * Step 3: Store info (maps, website, phone, address) → Save
 *
 * Props: shop, program (edit mode), onDone, onCancel, lang
 */
export default function LoyaltyWizard({ shop, program, onDone, onCancel, lang = 'en' }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Form
  const [name, setName] = useState(program?.name || shop?.name || '')
  const [loyaltyType, setLoyaltyType] = useState(program?.loyalty_type || 'stamp')
  const [stampsRequired, setStampsRequired] = useState(program?.stamps_required || 10)
  const [pointsPerVisit, setPointsPerVisit] = useState(program?.points_per_visit || 1)
  const [rewardThreshold, setRewardThreshold] = useState(program?.reward_threshold || 10)
  const [rewardTitle, setRewardTitle] = useState(program?.reward_title || T('Free coffee', 'قهوة مجانية'))
  const [rewardDescription, setRewardDescription] = useState(program?.reward_description || '')
  const [tiers, setTiers] = useState(
    program?.tiers || [
      { name: 'Bronze', threshold: 0 },
      { name: 'Silver', threshold: 100 },
      { name: 'Gold', threshold: 500 },
    ]
  )
  const [couponCode, setCouponCode] = useState(program?.coupon_code || '')
  const [couponDiscount, setCouponDiscount] = useState(program?.coupon_discount || '10% OFF')
  const [terms, setTerms] = useState(program?.terms || '')
  const [expiresAt, setExpiresAt] = useState(program?.expires_at ? program.expires_at.substring(0, 10) : '')

  const [cardColor, setCardColor] = useState(program?.card_color || '#10B981')
  const [textColor, setTextColor] = useState(program?.text_color || '#FFFFFF')
  const [logoUrl, setLogoUrl] = useState(program?.logo_url || shop?.logo_url || '')
  const [backgroundUrl, setBackgroundUrl] = useState(program?.background_url || '')
  const [rewardIconUrl, setRewardIconUrl] = useState(program?.reward_icon_url || '')

  const [googleMapsUrl, setGoogleMapsUrl] = useState(program?.google_maps_url || '')
  const [websiteUrl, setWebsiteUrl] = useState(program?.website_url || shop?.website || '')
  const [phone, setPhone] = useState(program?.phone || shop?.phone || '')
  const [address, setAddress] = useState(program?.address || shop?.address || '')

  const steps = [
    { key: 'details', label: T('Card details', 'تفاصيل البطاقة') },
    { key: 'branding', label: T('Design & preview', 'التصميم والمعاينة') },
    { key: 'store', label: T('Store info', 'بيانات المتجر') },
  ]

  const validateStep = () => {
    setError(null)
    if (step === 0) {
      if (!name.trim()) { setError(T('Business name is required', 'اسم النشاط مطلوب')); return false }
      if (loyaltyType === 'stamp' && stampsRequired < 1) { setError(T('Stamps required must be at least 1', 'عدد الأختام يجب أن يكون 1 على الأقل')); return false }
      if (loyaltyType === 'points' && (pointsPerVisit < 1 || rewardThreshold < 1)) { setError(T('Points values must be at least 1', 'قيم النقاط يجب أن تكون 1 على الأقل')); return false }
      if (loyaltyType === 'coupon' && !couponDiscount.trim()) { setError(T('Coupon value is required', 'قيمة الكوبون مطلوبة')); return false }
    }
    return true
  }

  const handleNext = () => { if (validateStep()) setStep((s) => Math.min(s + 1, steps.length - 1)) }
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const handleSave = async () => {
    if (!validateStep()) return
    setSaving(true); setError(null)
    const payload = {
      shop_id: shop.id,
      name: name.trim(),
      loyalty_type: loyaltyType,
      stamps_required: loyaltyType === 'stamp' ? stampsRequired : null,
      points_per_visit: loyaltyType === 'points' || loyaltyType === 'tiered' ? pointsPerVisit : null,
      reward_threshold: loyaltyType === 'points' ? rewardThreshold : null,
      reward_title: rewardTitle.trim() || 'Reward',
      reward_description: rewardDescription.trim() || null,
      reward_icon_url: rewardIconUrl || null,
      tiers: loyaltyType === 'tiered' ? tiers : null,
      coupon_code: loyaltyType === 'coupon' ? couponCode.trim() || null : null,
      coupon_discount: loyaltyType === 'coupon' ? couponDiscount.trim() : null,
      terms: terms.trim() || null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      card_color: cardColor, text_color: textColor,
      logo_url: logoUrl || null, background_url: backgroundUrl || null,
      google_maps_url: googleMapsUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    }
    let saved
    if (program?.id) {
      const { data, error: err } = await supabase.from('loyalty_programs').update(payload).eq('id', program.id).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      saved = data
    } else {
      const { data, error: err } = await supabase.from('loyalty_programs').insert(payload).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      saved = data
    }
    setSaving(false)
    onDone?.(saved)
  }

  const arrow = isAr ? '←' : '→'
  const backArrow = isAr ? '→' : '←'

  return (
    <div className="lw-shell" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="lw-header">
        <h2>{program?.id ? T('Edit Loyalty Card', 'تعديل بطاقة الولاء') : T('New Loyalty Card', 'بطاقة ولاء جديدة')}</h2>
        <button className="lw-x" onClick={onCancel} aria-label="close">×</button>
      </div>

      <Stepper steps={steps} active={step} onJump={(i) => i < step && setStep(i)} />

      <div className="lw-body">
        {step === 0 && (
          <StepDetails
            shop={shop} name={name} setName={setName}
            loyaltyType={loyaltyType} setLoyaltyType={setLoyaltyType}
            stampsRequired={stampsRequired} setStampsRequired={setStampsRequired}
            pointsPerVisit={pointsPerVisit} setPointsPerVisit={setPointsPerVisit}
            rewardThreshold={rewardThreshold} setRewardThreshold={setRewardThreshold}
            rewardTitle={rewardTitle} setRewardTitle={setRewardTitle}
            rewardDescription={rewardDescription} setRewardDescription={setRewardDescription}
            tiers={tiers} setTiers={setTiers}
            couponCode={couponCode} setCouponCode={setCouponCode}
            couponDiscount={couponDiscount} setCouponDiscount={setCouponDiscount}
            terms={terms} setTerms={setTerms}
            expiresAt={expiresAt} setExpiresAt={setExpiresAt}
            T={T}
          />
        )}
        {step === 1 && (
          <StepBranding
            shopId={shop.id}
            cardColor={cardColor} setCardColor={setCardColor}
            textColor={textColor} setTextColor={setTextColor}
            logoUrl={logoUrl} setLogoUrl={setLogoUrl}
            backgroundUrl={backgroundUrl} setBackgroundUrl={setBackgroundUrl}
            rewardIconUrl={rewardIconUrl} setRewardIconUrl={setRewardIconUrl}
            previewData={{ name, loyaltyType, stampsRequired, rewardThreshold, rewardTitle, couponDiscount, cardColor, textColor, logoUrl, backgroundUrl, rewardIconUrl }}
            T={T}
            isAr={isAr}
          />
        )}
        {step === 2 && (
          <StepStore
            googleMapsUrl={googleMapsUrl} setGoogleMapsUrl={setGoogleMapsUrl}
            websiteUrl={websiteUrl} setWebsiteUrl={setWebsiteUrl}
            phone={phone} setPhone={setPhone}
            address={address} setAddress={setAddress}
            T={T}
          />
        )}

        {error && <div className="lw-err">{error}</div>}
      </div>

      <div className="lw-footer">
        <button className="lw-btn ghost" onClick={step === 0 ? onCancel : back} disabled={saving}>
          {step === 0 ? T('Cancel', 'إلغاء') : `${backArrow} ${T('Back', 'رجوع')}`}
        </button>
        {step < steps.length - 1 ? (
          <button className="lw-btn primary" onClick={handleNext} disabled={saving}>
            {T('Next', 'التالي')} {arrow}
          </button>
        ) : (
          <button className="lw-btn primary" onClick={handleSave} disabled={saving}>
            {saving ? T('Saving…', 'جارٍ الحفظ…') : program?.id ? T('Update card', 'تحديث البطاقة') : T('Create card & generate QR', 'إنشاء البطاقة وإنشاء QR')}
          </button>
        )}
      </div>
    </div>
  )
}

function Stepper({ steps, active, onJump }) {
  return (
    <div className="lw-stepper">
      {steps.map((s, i) => (
        <button key={s.key} className={`lw-step ${i === active ? 'active' : ''} ${i < active ? 'done' : ''}`} onClick={() => onJump?.(i)} type="button">
          <span className="lw-step-num">{i < active ? '✓' : i + 1}</span>
          <span className="lw-step-label">{s.label}</span>
        </button>
      ))}
    </div>
  )
}

function StepDetails(props) {
  const {
    shop, name, setName, loyaltyType, setLoyaltyType,
    stampsRequired, setStampsRequired,
    pointsPerVisit, setPointsPerVisit,
    rewardThreshold, setRewardThreshold,
    rewardTitle, setRewardTitle,
    rewardDescription, setRewardDescription,
    tiers, setTiers,
    couponCode, setCouponCode,
    couponDiscount, setCouponDiscount,
    terms, setTerms,
    expiresAt, setExpiresAt,
    T,
  } = props

  const types = [
    { key: 'stamp', emoji: '🎟️', title: T('Stamp Card', 'بطاقة أختام'), desc: T('Buy 9, get 1 free', 'اشترِ 9، الـ10 مجاناً') },
    { key: 'points', emoji: '⭐', title: T('Points', 'نقاط'), desc: T('Earn points per visit', 'نقاط لكل زيارة') },
    { key: 'tiered', emoji: '🏆', title: T('Tiered', 'مستويات'), desc: T('Bronze / Silver / Gold', 'برونزي / فضي / ذهبي') },
    { key: 'coupon', emoji: '🎁', title: T('Coupon', 'كوبون'), desc: T('One-time discount', 'خصم لمرة واحدة') },
  ]

  const updateTier = (i, field, val) => {
    const copy = [...tiers]
    copy[i] = { ...copy[i], [field]: field === 'threshold' ? Number(val) : val }
    setTiers(copy)
  }
  const addTier = () => setTiers([...tiers, { name: '', threshold: 0 }])
  const removeTier = (i) => setTiers(tiers.filter((_, idx) => idx !== i))

  return (
    <div className="lw-step-content">
      <label className="lw-field">
        <span>{T('Business name', 'اسم النشاط')}</span>
        <input
          className="lw-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={shop?.name || T('e.g. Sultan Café', 'مثال: مقهى السلطان')}
          autoFocus
        />
        <small>{T('Shown to customers on their wallet pass.', 'يظهر للعملاء على بطاقة المحفظة.')}</small>
      </label>

      <div className="lw-section-title">{T('Loyalty type', 'نوع الولاء')}</div>
      <div className="lw-type-grid">
        {types.map((t) => (
          <button key={t.key} type="button" className={`lw-type-card ${loyaltyType === t.key ? 'selected' : ''}`} onClick={() => setLoyaltyType(t.key)}>
            <span className="lw-type-emoji">{t.emoji}</span>
            <strong>{t.title}</strong>
            <small>{t.desc}</small>
          </button>
        ))}
      </div>

      <div className="lw-section-title">{T('Rules', 'القواعد')}</div>
      {loyaltyType === 'stamp' && (
        <label className="lw-field">
          <span>{T('Stamps required for reward', 'عدد الأختام المطلوبة للمكافأة')}</span>
          <input className="lw-input" type="number" min={1} max={50} value={stampsRequired} onChange={(e) => setStampsRequired(Number(e.target.value))} />
        </label>
      )}
      {loyaltyType === 'points' && (
        <>
          <label className="lw-field">
            <span>{T('Points per visit', 'نقاط لكل زيارة')}</span>
            <input className="lw-input" type="number" min={1} value={pointsPerVisit} onChange={(e) => setPointsPerVisit(Number(e.target.value))} />
          </label>
          <label className="lw-field">
            <span>{T('Points needed for reward', 'النقاط المطلوبة للمكافأة')}</span>
            <input className="lw-input" type="number" min={1} value={rewardThreshold} onChange={(e) => setRewardThreshold(Number(e.target.value))} />
          </label>
        </>
      )}
      {loyaltyType === 'tiered' && (
        <>
          <label className="lw-field">
            <span>{T('Points per visit', 'نقاط لكل زيارة')}</span>
            <input className="lw-input" type="number" min={1} value={pointsPerVisit} onChange={(e) => setPointsPerVisit(Number(e.target.value))} />
          </label>
          <div className="lw-tiers">
            <h4>{T('Tiers', 'المستويات')}</h4>
            {tiers.map((t, i) => (
              <div key={i} className="lw-tier-row">
                <input className="lw-input" type="text" placeholder={T('Tier name', 'اسم المستوى')} value={t.name} onChange={(e) => updateTier(i, 'name', e.target.value)} />
                <input className="lw-input" type="number" min={0} placeholder={T('Threshold', 'الحد')} value={t.threshold} onChange={(e) => updateTier(i, 'threshold', e.target.value)} />
                <button type="button" className="lw-mini-btn" onClick={() => removeTier(i)}>−</button>
              </div>
            ))}
            <button type="button" className="lw-mini-btn add" onClick={addTier}>+ {T('Add tier', 'أضف مستوى')}</button>
          </div>
        </>
      )}
      {loyaltyType === 'coupon' && (
        <>
          <label className="lw-field">
            <span>{T('Discount / value', 'الخصم / القيمة')}</span>
            <input className="lw-input" type="text" value={couponDiscount} onChange={(e) => setCouponDiscount(e.target.value)} placeholder="10% OFF" />
          </label>
          <label className="lw-field">
            <span>{T('Coupon code (optional)', 'رمز الكوبون (اختياري)')}</span>
            <input className="lw-input" type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="WELCOME10" />
          </label>
        </>
      )}

      <label className="lw-field">
        <span>{T('Reward title', 'عنوان المكافأة')}</span>
        <input className="lw-input" type="text" value={rewardTitle} onChange={(e) => setRewardTitle(e.target.value)} placeholder={T('Free coffee', 'قهوة مجانية')} />
      </label>
      <label className="lw-field">
        <span>{T('Reward description (optional)', 'وصف المكافأة (اختياري)')}</span>
        <textarea className="lw-input" rows={2} value={rewardDescription} onChange={(e) => setRewardDescription(e.target.value)} />
      </label>

      <div className="lw-section-title">{T('Terms & expiry', 'الشروط والصلاحية')}</div>
      <label className="lw-field">
        <span>{T('Terms & Conditions', 'الشروط والأحكام')}</span>
        <textarea className="lw-input" rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder={T('e.g. Not redeemable for cash. One reward per visit.', 'مثال: لا يستبدل بنقد. مكافأة واحدة لكل زيارة.')} />
      </label>
      <label className="lw-field">
        <span>{T('Expiry date (optional)', 'تاريخ الانتهاء (اختياري)')}</span>
        <input className="lw-input" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      </label>
    </div>
  )
}

function StepBranding(props) {
  const {
    shopId, cardColor, setCardColor, textColor, setTextColor,
    logoUrl, setLogoUrl, backgroundUrl, setBackgroundUrl,
    rewardIconUrl, setRewardIconUrl, previewData, T, isAr,
  } = props

  const upload = async (file, kind, setter) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert(T('File too large (max 2MB)', 'الملف كبير جداً (الحد 2MB)')); return }
    const ext = file.name.split('.').pop()
    const path = `${shopId}/${kind}-${Date.now()}.${ext}`
    const { error: err } = await supabase.storage.from('program-assets').upload(path, file, { upsert: true })
    if (err) { alert(err.message); return }
    const { data } = supabase.storage.from('program-assets').getPublicUrl(path)
    setter(data.publicUrl)
  }

  const colorPresets = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#1a1a2e', '#6366F1', '#D97706']
  const sampleName = isAr ? 'أحمد' : 'Ahmed'

  return (
    <div className="lw-step-content lw-branding-grid">
      <div className="lw-branding-controls">
        <label className="lw-field">
          <span>{T('Card color', 'لون البطاقة')}</span>
          <div className="lw-color-row">
            {colorPresets.map((c) => (
              <button key={c} type="button" className={`lw-swatch ${cardColor === c ? 'sel' : ''}`} style={{ background: c }} onClick={() => setCardColor(c)} />
            ))}
            <input type="color" value={cardColor} onChange={(e) => setCardColor(e.target.value)} />
          </div>
        </label>
        <label className="lw-field">
          <span>{T('Text color', 'لون النص')}</span>
          <div className="lw-color-row">
            <button type="button" className={`lw-swatch ${textColor === '#FFFFFF' ? 'sel' : ''}`} style={{ background: '#FFFFFF', border: '1px solid #ccc' }} onClick={() => setTextColor('#FFFFFF')} />
            <button type="button" className={`lw-swatch ${textColor === '#000000' ? 'sel' : ''}`} style={{ background: '#000000' }} onClick={() => setTextColor('#000000')} />
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
          </div>
        </label>
        <Uploader
          label={T('Logo (square)', 'الشعار (مربع)')}
          hint={T('Square PNG, 512×512px recommended (max 2MB)', 'PNG مربع، الحجم الموصى به 512×512 بكسل (الحد الأقصى 2MB)')}
          accept="image/png,image/jpeg"
          url={logoUrl} onClear={() => setLogoUrl('')} onPick={(f) => upload(f, 'logo', setLogoUrl)} T={T}
        />
        <Uploader
          label={T('Background photo', 'صورة الخلفية')}
          hint={T('PNG only, 1125×432px (Apple shows top strip, Google shows hero). Max 2MB.', 'PNG فقط، 1125×432 بكسل (آبل تعرض الشريط العلوي، جوجل تعرض الصورة الكاملة). الحد 2MB.')}
          accept="image/png"
          url={backgroundUrl} onClear={() => setBackgroundUrl('')} onPick={(f) => upload(f, 'bg', setBackgroundUrl)} T={T}
        />

        <div className="lw-section-title">{T('Reward icon', 'أيقونة المكافأة')}</div>
        <p className="lw-preview-sub">{T('Pick a preset or upload your own', 'اختر من المعدّة مسبقاً أو ارفع أيقونتك')}</p>
        <PresetIconPicker selected={rewardIconUrl} onSelect={setRewardIconUrl} />
        <Uploader
          label={T('Or upload your own icon', 'أو ارفع أيقونتك الخاصة')}
          hint={T('PNG with transparency, 90×90px recommended', 'PNG شفاف، الحجم الموصى به 90×90 بكسل')}
          accept="image/png"
          url={rewardIconUrl && rewardIconUrl.startsWith('data:') ? '' : rewardIconUrl}
          onClear={() => setRewardIconUrl('')}
          onPick={(f) => upload(f, 'icon', setRewardIconUrl)} T={T}
        />
      </div>

      <div className="lw-branding-previews">
        <div className="lw-section-title">{T('Live preview', 'معاينة مباشرة')}</div>
        <p className="lw-preview-sub">{T(`Sample customer: ${sampleName}`, `عميل تجريبي: ${sampleName}`)}</p>
        <div className="lw-wallet-previews">
          <WalletPreview kind="apple" data={previewData} sampleName={sampleName} T={T} />
          <WalletPreview kind="google" data={previewData} sampleName={sampleName} T={T} />
        </div>
      </div>
    </div>
  )
}

function WalletPreview({ kind, data, sampleName, T }) {
  const { name, loyaltyType, stampsRequired, rewardThreshold, rewardTitle, couponDiscount, cardColor, textColor, logoUrl, backgroundUrl, rewardIconUrl } = data
  const headerLogo = kind === 'apple' ? appleWalletIcon : googleWalletIcon
  const platform = kind === 'apple' ? 'Apple Wallet' : 'Google Wallet'

  const balance = loyaltyType === 'stamp'
    ? `0 / ${stampsRequired}`
    : loyaltyType === 'points'
      ? `0 / ${rewardThreshold}`
      : loyaltyType === 'tiered'
        ? T('Bronze', 'برونزي')
        : couponDiscount

  const balanceLabel = loyaltyType === 'stamp' ? T('Stamps', 'الأختام')
    : loyaltyType === 'points' ? T('Points', 'النقاط')
    : loyaltyType === 'tiered' ? T('Tier', 'المستوى')
    : T('Offer', 'العرض')

  const cardStyle = backgroundUrl
    ? { background: `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)), url(${backgroundUrl}) center/cover`, color: textColor }
    : { background: cardColor, color: textColor }

  return (
    <div className={`lw-wp lw-wp-${kind}`}>
      <div className="lw-wp-chrome">
        <img src={headerLogo} alt="" className="lw-wp-platform-icon" />
        <span>{platform}</span>
      </div>
      <div className="lw-wp-card" style={cardStyle}>
        <div className="lw-wp-top">
          {logoUrl ? <img src={logoUrl} alt="" className="lw-wp-logo" /> : <div className="lw-wp-logo lw-wp-logo-placeholder">{(name || 'B').charAt(0)}</div>}
          <div className="lw-wp-name">
            <strong>{name || T('Business', 'النشاط')}</strong>
            <small>{sampleName}</small>
          </div>
        </div>
        <div className="lw-wp-mid">
          <div className="lw-wp-balance-label">{balanceLabel}</div>
          <div className="lw-wp-balance">{balance}</div>
        </div>
        <div className="lw-wp-bot">
          {rewardIconUrl && <img src={rewardIconUrl} alt="" className="lw-wp-reward-icon" />}
          <span>{T('Reward', 'المكافأة')}: {rewardTitle}</span>
        </div>
      </div>
    </div>
  )
}

function Uploader({ label, url, onPick, onClear, T, hint, accept = 'image/png,image/jpeg' }) {
  const ref = useRef(null)
  return (
    <div className="lw-field">
      <span>{label}</span>
      <div className="lw-uploader">
        {url ? (
          <>
            <img src={url} alt="" />
            <button type="button" className="lw-mini-btn" onClick={onClear}>×</button>
          </>
        ) : (
          <button type="button" className="lw-upload-btn" onClick={() => ref.current?.click()}>
            {T('Upload', 'رفع')}
          </button>
        )}
        <input type="file" accept={accept} ref={ref} style={{ display: 'none' }} onChange={(e) => onPick(e.target.files?.[0])} />
      </div>
      {hint && <small className="lw-hint">{hint}</small>}
    </div>
  )
}

const PRESET_ICONS = [
  { key: 'coffee', emoji: '☕' },
  { key: 'tea', emoji: '🍵' },
  { key: 'pizza', emoji: '🍕' },
  { key: 'burger', emoji: '🍔' },
  { key: 'donut', emoji: '🍩' },
  { key: 'icecream', emoji: '🍦' },
  { key: 'cake', emoji: '🎂' },
  { key: 'cookie', emoji: '🍪' },
  { key: 'gift', emoji: '🎁' },
  { key: 'star', emoji: '⭐' },
  { key: 'heart', emoji: '❤️' },
  { key: 'crown', emoji: '👑' },
  { key: 'sparkles', emoji: '✨' },
  { key: 'tag', emoji: '🏷️' },
  { key: 'bag', emoji: '🛍️' },
  { key: 'cart', emoji: '🛒' },
  { key: 'flower', emoji: '🌸' },
  { key: 'cut', emoji: '✂️' },
  { key: 'sun', emoji: '☀️' },
  { key: 'fire', emoji: '🔥' },
]

// Convert emoji to a small PNG data URL via canvas (so it survives as reward_icon_url everywhere).
function emojiToDataUrl(emoji, size = 96) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.font = `${Math.floor(size * 0.78)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.04)
  return canvas.toDataURL('image/png')
}

function PresetIconPicker({ selected, onSelect }) {
  const [selKey, setSelKey] = useState(null)
  return (
    <div className="lw-icon-grid">
      {PRESET_ICONS.map((it) => (
        <button
          key={it.key}
          type="button"
          className={`lw-icon-tile ${selKey === it.key ? 'sel' : ''}`}
          title={it.key}
          onClick={() => {
            setSelKey(it.key)
            onSelect(emojiToDataUrl(it.emoji))
          }}
        >
          <span className="lw-icon-emoji">{it.emoji}</span>
        </button>
      ))}
    </div>
  )
}

function StepStore({ googleMapsUrl, setGoogleMapsUrl, websiteUrl, setWebsiteUrl, phone, setPhone, address, setAddress, T }) {
  return (
    <div className="lw-step-content">
      <label className="lw-field">
        <span>{T('Google Maps link', 'رابط خرائط جوجل')}</span>
        <input className="lw-input" type="url" value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} placeholder="https://maps.app.goo.gl/..." />
      </label>
      <label className="lw-field">
        <span>{T('Website', 'الموقع الإلكتروني')}</span>
        <input className="lw-input" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://" />
      </label>
      <label className="lw-field">
        <span>{T('Phone', 'الهاتف')}</span>
        <input className="lw-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label className="lw-field">
        <span>{T('Address', 'العنوان')}</span>
        <textarea className="lw-input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>
    </div>
  )
}
