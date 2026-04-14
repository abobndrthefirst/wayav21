import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Multi-step Loyalty Program Wizard.
 * Steps: Basics → Type → Rules → Branding → Terms/Expiry → Store Info → Preview/Save
 *
 * Props:
 *   shop:      the business shop row { id, name, ... }
 *   program:   optional existing program (edit mode)
 *   onDone:    callback (savedProgram) => void
 *   onCancel:  callback () => void
 *   lang:      'ar' | 'en'
 */
export default function LoyaltyWizard({ shop, program, onDone, onCancel, lang = 'en' }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Form state
  const [name, setName] = useState(program?.name || '')
  const [loyaltyType, setLoyaltyType] = useState(program?.loyalty_type || 'stamp')

  // Rules
  const [stampsRequired, setStampsRequired] = useState(program?.stamps_required || 10)
  const [pointsPerVisit, setPointsPerVisit] = useState(program?.points_per_visit || 1)
  const [rewardThreshold, setRewardThreshold] = useState(program?.reward_threshold || 10)
  const [rewardTitle, setRewardTitle] = useState(program?.reward_title || 'Free coffee')
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

  // Branding
  const [cardColor, setCardColor] = useState(program?.card_color || '#10B981')
  const [textColor, setTextColor] = useState(program?.text_color || '#FFFFFF')
  const [logoUrl, setLogoUrl] = useState(program?.logo_url || shop?.logo_url || '')
  const [backgroundUrl, setBackgroundUrl] = useState(program?.background_url || '')
  const [rewardIconUrl, setRewardIconUrl] = useState(program?.reward_icon_url || '')

  // Terms & expiry
  const [terms, setTerms] = useState(program?.terms || '')
  const [expiresAt, setExpiresAt] = useState(
    program?.expires_at ? program.expires_at.substring(0, 10) : ''
  )

  // Store info
  const [googleMapsUrl, setGoogleMapsUrl] = useState(program?.google_maps_url || '')
  const [websiteUrl, setWebsiteUrl] = useState(program?.website_url || shop?.website || '')
  const [phone, setPhone] = useState(program?.phone || shop?.phone || '')
  const [address, setAddress] = useState(program?.address || shop?.address || '')

  const steps = [
    { key: 'basics', label: T('Basics', 'الأساسيات') },
    { key: 'type', label: T('Loyalty type', 'نوع الولاء') },
    { key: 'rules', label: T('Rules', 'القواعد') },
    { key: 'branding', label: T('Branding', 'الهوية') },
    { key: 'terms', label: T('Terms & Expiry', 'الشروط والصلاحية') },
    { key: 'store', label: T('Store info', 'بيانات المتجر') },
    { key: 'preview', label: T('Preview & Publish', 'معاينة ونشر') },
  ]

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const validateStep = () => {
    setError(null)
    if (step === 0 && !name.trim()) {
      setError(T('Program name is required', 'اسم البرنامج مطلوب'))
      return false
    }
    if (step === 2) {
      if (loyaltyType === 'stamp' && stampsRequired < 1) {
        setError(T('Stamps required must be at least 1', 'عدد الأختام يجب أن يكون 1 على الأقل'))
        return false
      }
      if (loyaltyType === 'points' && (pointsPerVisit < 1 || rewardThreshold < 1)) {
        setError(T('Points values must be at least 1', 'قيم النقاط يجب أن تكون 1 على الأقل'))
        return false
      }
      if (loyaltyType === 'coupon' && !couponDiscount.trim()) {
        setError(T('Coupon value is required', 'قيمة الكوبون مطلوبة'))
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    next()
  }

  const handleSave = async () => {
    if (!validateStep()) return
    setSaving(true)
    setError(null)
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
      card_color: cardColor,
      text_color: textColor,
      logo_url: logoUrl || null,
      background_url: backgroundUrl || null,
      google_maps_url: googleMapsUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    let saved
    if (program?.id) {
      const { data, error: err } = await supabase
        .from('loyalty_programs')
        .update(payload)
        .eq('id', program.id)
        .select()
        .single()
      if (err) {
        setError(err.message)
        setSaving(false)
        return
      }
      saved = data
    } else {
      const { data, error: err } = await supabase
        .from('loyalty_programs')
        .insert(payload)
        .select()
        .single()
      if (err) {
        setError(err.message)
        setSaving(false)
        return
      }
      saved = data
    }
    setSaving(false)
    onDone?.(saved)
  }

  return (
    <div className="lw-shell" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="lw-header">
        <h2>{program?.id ? T('Edit Loyalty Card', 'تعديل بطاقة الولاء') : T('New Loyalty Card', 'بطاقة ولاء جديدة')}</h2>
        <button className="lw-x" onClick={onCancel} aria-label="close">×</button>
      </div>

      <Stepper steps={steps} active={step} onJump={(i) => i < step && setStep(i)} />

      <div className="lw-body">
        {step === 0 && (
          <StepBasics name={name} setName={setName} T={T} />
        )}
        {step === 1 && (
          <StepType value={loyaltyType} onChange={setLoyaltyType} T={T} />
        )}
        {step === 2 && (
          <StepRules
            loyaltyType={loyaltyType}
            stampsRequired={stampsRequired} setStampsRequired={setStampsRequired}
            pointsPerVisit={pointsPerVisit} setPointsPerVisit={setPointsPerVisit}
            rewardThreshold={rewardThreshold} setRewardThreshold={setRewardThreshold}
            rewardTitle={rewardTitle} setRewardTitle={setRewardTitle}
            rewardDescription={rewardDescription} setRewardDescription={setRewardDescription}
            tiers={tiers} setTiers={setTiers}
            couponCode={couponCode} setCouponCode={setCouponCode}
            couponDiscount={couponDiscount} setCouponDiscount={setCouponDiscount}
            T={T}
          />
        )}
        {step === 3 && (
          <StepBranding
            shopId={shop.id}
            cardColor={cardColor} setCardColor={setCardColor}
            textColor={textColor} setTextColor={setTextColor}
            logoUrl={logoUrl} setLogoUrl={setLogoUrl}
            backgroundUrl={backgroundUrl} setBackgroundUrl={setBackgroundUrl}
            rewardIconUrl={rewardIconUrl} setRewardIconUrl={setRewardIconUrl}
            T={T}
          />
        )}
        {step === 4 && (
          <StepTerms
            terms={terms} setTerms={setTerms}
            expiresAt={expiresAt} setExpiresAt={setExpiresAt}
            T={T}
          />
        )}
        {step === 5 && (
          <StepStore
            googleMapsUrl={googleMapsUrl} setGoogleMapsUrl={setGoogleMapsUrl}
            websiteUrl={websiteUrl} setWebsiteUrl={setWebsiteUrl}
            phone={phone} setPhone={setPhone}
            address={address} setAddress={setAddress}
            T={T}
          />
        )}
        {step === 6 && (
          <StepPreview
            data={{
              name, loyaltyType, stampsRequired, pointsPerVisit, rewardThreshold,
              rewardTitle, rewardDescription, tiers, couponCode, couponDiscount,
              cardColor, textColor, logoUrl, backgroundUrl, rewardIconUrl,
              terms, expiresAt, googleMapsUrl, websiteUrl, phone, address,
              shopName: shop.name,
            }}
            T={T}
          />
        )}

        {error && <div className="lw-err">{error}</div>}
      </div>

      <div className="lw-footer">
        <button className="lw-btn ghost" onClick={step === 0 ? onCancel : back} disabled={saving}>
          {step === 0 ? T('Cancel', 'إلغاء') : T('Back', 'رجوع')}
        </button>
        {step < steps.length - 1 ? (
          <button className="lw-btn primary" onClick={handleNext} disabled={saving}>
            {T('Next', 'التالي')} →
          </button>
        ) : (
          <button className="lw-btn primary" onClick={handleSave} disabled={saving}>
            {saving ? T('Saving…', 'جارٍ الحفظ…') : program?.id ? T('Update', 'تحديث') : T('Publish & Generate QR', 'نشر وإنشاء QR')}
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
        <button
          key={s.key}
          className={`lw-step ${i === active ? 'active' : ''} ${i < active ? 'done' : ''}`}
          onClick={() => onJump?.(i)}
          type="button"
        >
          <span className="lw-step-num">{i < active ? '✓' : i + 1}</span>
          <span className="lw-step-label">{s.label}</span>
        </button>
      ))}
    </div>
  )
}

function StepBasics({ name, setName, T }) {
  return (
    <div className="lw-step-content">
      <label className="lw-field">
        <span>{T('Program name', 'اسم البرنامج')}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={T('e.g. Coffee Lovers Club', 'مثال: نادي عشاق القهوة')}
          autoFocus
        />
        <small>{T('Shown to customers on their wallet pass.', 'يظهر للعملاء في بطاقة المحفظة.')}</small>
      </label>
    </div>
  )
}

function StepType({ value, onChange, T }) {
  const types = [
    { key: 'stamp', emoji: '🎟️', title: T('Stamp Card', 'بطاقة أختام'), desc: T('Buy 9, get 1 free style', 'مثال: اشترِ 9، الـ10 مجاناً') },
    { key: 'points', emoji: '⭐', title: T('Points', 'نقاط'), desc: T('Earn points per visit, redeem at threshold', 'نقاط لكل زيارة تُستبدل عند هدف') },
    { key: 'tiered', emoji: '🏆', title: T('Tiered Membership', 'عضوية بمستويات'), desc: T('Bronze / Silver / Gold tiers', 'برونزي / فضي / ذهبي') },
    { key: 'coupon', emoji: '🎁', title: T('Coupon', 'كوبون'), desc: T('One-time discount or offer', 'خصم لمرة واحدة') },
  ]
  return (
    <div className="lw-step-content">
      <div className="lw-type-grid">
        {types.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`lw-type-card ${value === t.key ? 'selected' : ''}`}
            onClick={() => onChange(t.key)}
          >
            <span className="lw-type-emoji">{t.emoji}</span>
            <strong>{t.title}</strong>
            <small>{t.desc}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepRules(props) {
  const {
    loyaltyType,
    stampsRequired, setStampsRequired,
    pointsPerVisit, setPointsPerVisit,
    rewardThreshold, setRewardThreshold,
    rewardTitle, setRewardTitle,
    rewardDescription, setRewardDescription,
    tiers, setTiers,
    couponCode, setCouponCode,
    couponDiscount, setCouponDiscount,
    T,
  } = props

  const updateTier = (i, field, val) => {
    const copy = [...tiers]
    copy[i] = { ...copy[i], [field]: field === 'threshold' ? Number(val) : val }
    setTiers(copy)
  }
  const addTier = () => setTiers([...tiers, { name: '', threshold: 0 }])
  const removeTier = (i) => setTiers(tiers.filter((_, idx) => idx !== i))

  return (
    <div className="lw-step-content">
      {loyaltyType === 'stamp' && (
        <label className="lw-field">
          <span>{T('Stamps required for reward', 'عدد الأختام المطلوبة للمكافأة')}</span>
          <input type="number" min={1} max={50} value={stampsRequired} onChange={(e) => setStampsRequired(Number(e.target.value))} />
          <small>{T('e.g. 9 means buy 9 get 1 free.', 'مثلاً 9 تعني اشترِ 9 خذ 1 مجاناً.')}</small>
        </label>
      )}
      {loyaltyType === 'points' && (
        <>
          <label className="lw-field">
            <span>{T('Points per visit', 'نقاط لكل زيارة')}</span>
            <input type="number" min={1} value={pointsPerVisit} onChange={(e) => setPointsPerVisit(Number(e.target.value))} />
          </label>
          <label className="lw-field">
            <span>{T('Points needed for reward', 'النقاط المطلوبة للمكافأة')}</span>
            <input type="number" min={1} value={rewardThreshold} onChange={(e) => setRewardThreshold(Number(e.target.value))} />
          </label>
        </>
      )}
      {loyaltyType === 'tiered' && (
        <>
          <label className="lw-field">
            <span>{T('Points per visit', 'نقاط لكل زيارة')}</span>
            <input type="number" min={1} value={pointsPerVisit} onChange={(e) => setPointsPerVisit(Number(e.target.value))} />
          </label>
          <div className="lw-tiers">
            <h4>{T('Tiers', 'المستويات')}</h4>
            {tiers.map((t, i) => (
              <div key={i} className="lw-tier-row">
                <input type="text" placeholder={T('Tier name', 'اسم المستوى')} value={t.name} onChange={(e) => updateTier(i, 'name', e.target.value)} />
                <input type="number" min={0} placeholder={T('Threshold', 'الحد')} value={t.threshold} onChange={(e) => updateTier(i, 'threshold', e.target.value)} />
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
            <input type="text" value={couponDiscount} onChange={(e) => setCouponDiscount(e.target.value)} placeholder="10% OFF" />
          </label>
          <label className="lw-field">
            <span>{T('Coupon code (optional)', 'رمز الكوبون (اختياري)')}</span>
            <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="WELCOME10" />
          </label>
        </>
      )}

      <hr className="lw-sep" />
      <label className="lw-field">
        <span>{T('Reward title', 'عنوان المكافأة')}</span>
        <input type="text" value={rewardTitle} onChange={(e) => setRewardTitle(e.target.value)} placeholder={T('Free coffee', 'قهوة مجانية')} />
      </label>
      <label className="lw-field">
        <span>{T('Reward description (optional)', 'وصف المكافأة (اختياري)')}</span>
        <textarea rows={2} value={rewardDescription} onChange={(e) => setRewardDescription(e.target.value)} />
      </label>
    </div>
  )
}

function StepBranding(props) {
  const { shopId, cardColor, setCardColor, textColor, setTextColor, logoUrl, setLogoUrl, backgroundUrl, setBackgroundUrl, rewardIconUrl, setRewardIconUrl, T } = props

  const upload = async (file, kind, setter) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert(T('File too large (max 2MB)', 'الملف كبير جداً (الحد 2MB)'))
      return
    }
    const ext = file.name.split('.').pop()
    const path = `${shopId}/${kind}-${Date.now()}.${ext}`
    const { error: err } = await supabase.storage.from('program-assets').upload(path, file, { upsert: true })
    if (err) { alert(err.message); return }
    const { data } = supabase.storage.from('program-assets').getPublicUrl(path)
    setter(data.publicUrl)
  }

  const colorPresets = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#1a1a2e', '#6366F1', '#D97706']

  return (
    <div className="lw-step-content">
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

      <Uploader label={T('Logo (square)', 'الشعار (مربع)')} url={logoUrl} onClear={() => setLogoUrl('')} onPick={(f) => upload(f, 'logo', setLogoUrl)} T={T} />
      <Uploader label={T('Background photo', 'صورة الخلفية')} url={backgroundUrl} onClear={() => setBackgroundUrl('')} onPick={(f) => upload(f, 'bg', setBackgroundUrl)} T={T} />
      <Uploader label={T('Reward icon', 'أيقونة المكافأة')} url={rewardIconUrl} onClear={() => setRewardIconUrl('')} onPick={(f) => upload(f, 'icon', setRewardIconUrl)} T={T} />
    </div>
  )
}

function Uploader({ label, url, onPick, onClear, T }) {
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
        <input type="file" accept="image/*" ref={ref} style={{ display: 'none' }} onChange={(e) => onPick(e.target.files?.[0])} />
      </div>
    </div>
  )
}

function StepTerms({ terms, setTerms, expiresAt, setExpiresAt, T }) {
  return (
    <div className="lw-step-content">
      <label className="lw-field">
        <span>{T('Terms & Conditions', 'الشروط والأحكام')}</span>
        <textarea rows={6} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder={T('e.g. Not redeemable for cash. One reward per visit.', 'مثال: لا يستبدل بنقد. مكافأة واحدة لكل زيارة.')} />
      </label>
      <label className="lw-field">
        <span>{T('Expiry date (optional)', 'تاريخ الانتهاء (اختياري)')}</span>
        <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      </label>
    </div>
  )
}

function StepStore({ googleMapsUrl, setGoogleMapsUrl, websiteUrl, setWebsiteUrl, phone, setPhone, address, setAddress, T }) {
  return (
    <div className="lw-step-content">
      <label className="lw-field">
        <span>{T('Google Maps link', 'رابط خرائط جوجل')}</span>
        <input type="url" value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} placeholder="https://maps.app.goo.gl/..." />
      </label>
      <label className="lw-field">
        <span>{T('Website', 'الموقع الإلكتروني')}</span>
        <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://" />
      </label>
      <label className="lw-field">
        <span>{T('Phone', 'الهاتف')}</span>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label className="lw-field">
        <span>{T('Address', 'العنوان')}</span>
        <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>
    </div>
  )
}

function StepPreview({ data, T }) {
  const {
    name, loyaltyType, stampsRequired, pointsPerVisit, rewardThreshold,
    rewardTitle, cardColor, textColor, logoUrl, backgroundUrl, rewardIconUrl,
    terms, expiresAt, shopName, couponDiscount,
  } = data
  return (
    <div className="lw-step-content">
      <div className="lw-preview-card" style={{ background: backgroundUrl ? `linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.4)),url(${backgroundUrl}) center/cover` : cardColor, color: textColor }}>
        <div className="lw-pc-top">
          {logoUrl && <img className="lw-pc-logo" src={logoUrl} alt="" />}
          <div className="lw-pc-name">
            <strong>{shopName}</strong>
            <small>{name}</small>
          </div>
        </div>
        <div className="lw-pc-mid">
          {loyaltyType === 'stamp' && <div className="lw-pc-big">0 / {stampsRequired} {T('stamps', 'ختم')}</div>}
          {loyaltyType === 'points' && <div className="lw-pc-big">0 / {rewardThreshold} {T('pts', 'نقطة')}</div>}
          {loyaltyType === 'tiered' && <div className="lw-pc-big">{T('Bronze', 'برونزي')}</div>}
          {loyaltyType === 'coupon' && <div className="lw-pc-big">{couponDiscount}</div>}
        </div>
        <div className="lw-pc-bot">
          {rewardIconUrl && <img className="lw-pc-icon" src={rewardIconUrl} alt="" />}
          <span>{T('Reward', 'المكافأة')}: {rewardTitle}</span>
        </div>
      </div>

      <div className="lw-summary">
        {expiresAt && <div><strong>{T('Expires', 'الصلاحية')}:</strong> {expiresAt}</div>}
        {terms && <div className="lw-terms-prev"><strong>{T('Terms', 'الشروط')}:</strong> {terms}</div>}
      </div>
      <p className="lw-note">{T('Tap "Publish" — your QR code will be ready on the next screen.', 'اضغط "نشر" — سيكون رمز QR جاهزاً في الشاشة التالية.')}</p>
    </div>
  )
}
