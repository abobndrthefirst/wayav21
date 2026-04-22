import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ColorPickerField, { TEXT_COLOR_PRESETS } from './ColorPickerField'
import DragDropUploader from './DragDropUploader'
import FieldEditor from './FieldEditor'
import PresetIconPicker from './PresetIconPicker'
import { extractPalette } from './extractPalette'
import { pickReadableText } from './contrast'

export default function DesignerEditorPanel({ design, setField, shopId, T, embedded }) {
  const [backOpen, setBackOpen] = useState(false)
  const [palette, setPalette] = useState([])
  const [bgMode, setBgMode] = useState(design.card_gradient ? 'gradient' : 'solid')

  useEffect(() => {
    if (!design.logo_url) { setPalette([]); return }
    let cancelled = false
    extractPalette(design.logo_url, { count: 5 }).then((p) => {
      if (!cancelled) setPalette(p)
    })
    return () => { cancelled = true }
  }, [design.logo_url])

  const applyBrandColor = (hex) => {
    setField('card_color', hex)
    setField('text_color', pickReadableText(hex))
  }

  const switchToGradient = () => {
    setBgMode('gradient')
    if (!design.card_gradient) {
      setField('card_gradient', { from: design.card_color || '#10B981', to: '#059669', angle: 135 })
    }
  }
  const switchToSolid = () => {
    setBgMode('solid')
    setField('card_gradient', null)
  }

  return (
    <div className={embedded ? 'pd-editor-inner' : 'pd-editor'}>
      <h3 className="pd-section-title">{T('Colors', 'الألوان')}</h3>

      <div className="pd-seg" style={{ marginBottom: 12 }}>
        <button type="button" className={`pd-seg-btn ${bgMode === 'solid' ? 'active' : ''}`} onClick={switchToSolid}>
          {T('Solid', 'لون واحد')}
        </button>
        <button type="button" className={`pd-seg-btn ${bgMode === 'gradient' ? 'active' : ''}`} onClick={switchToGradient}>
          {T('Gradient', 'تدرج')}
        </button>
      </div>

      {bgMode === 'solid' ? (
        <ColorPickerField
          label={T('Background color', 'لون الخلفية')}
          value={design.card_color}
          onChange={(v) => setField('card_color', v)}
          compareTo={design.text_color}
          T={T}
        />
      ) : (
        <div className="pd-gradient-editor">
          <div className="pd-field">
            <label>{T('Gradient from', 'من لون')}</label>
            <div className="pd-color-row">
              <input
                type="color"
                className="pd-color-native"
                value={design.card_gradient?.from || '#10B981'}
                onChange={e => setField('card_gradient', { ...(design.card_gradient || {}), from: e.target.value, to: design.card_gradient?.to || '#059669', angle: design.card_gradient?.angle ?? 135 })}
              />
              <span className="pd-gradient-hex">{design.card_gradient?.from || '#10B981'}</span>
            </div>
          </div>
          <div className="pd-field">
            <label>{T('Gradient to', 'إلى لون')}</label>
            <div className="pd-color-row">
              <input
                type="color"
                className="pd-color-native"
                value={design.card_gradient?.to || '#059669'}
                onChange={e => setField('card_gradient', { ...(design.card_gradient || {}), from: design.card_gradient?.from || '#10B981', to: e.target.value, angle: design.card_gradient?.angle ?? 135 })}
              />
              <span className="pd-gradient-hex">{design.card_gradient?.to || '#059669'}</span>
            </div>
          </div>
          <div className="pd-field">
            <label>{T('Angle', 'الزاوية')}: {design.card_gradient?.angle ?? 135}°</label>
            <input
              type="range"
              min={0}
              max={360}
              value={design.card_gradient?.angle ?? 135}
              onChange={e => setField('card_gradient', { ...(design.card_gradient || { from: '#10B981', to: '#059669' }), angle: Number(e.target.value) })}
            />
          </div>
          <div className="pd-field-hint">
            {T('Gradients show in preview only — wallet passes use the first color on the actual card.',
               'يظهر التدرج في المعاينة فقط — البطاقة الفعلية تستخدم اللون الأول.')}
          </div>
        </div>
      )}

      {palette.length > 0 && (
        <div className="pd-field">
          <label>{T('✨ Use brand colors (from your logo)', '✨ استخدم ألوان علامتك التجارية (من الشعار)')}</label>
          <div className="pd-palette-row">
            {palette.map((c) => (
              <button
                key={c}
                type="button"
                className="pd-palette-chip"
                style={{ background: c }}
                title={c}
                onClick={() => applyBrandColor(c)}
              />
            ))}
          </div>
        </div>
      )}

      <ColorPickerField
        label={T('Text color', 'لون النص')}
        value={design.text_color}
        onChange={(v) => setField('text_color', v)}
        presets={TEXT_COLOR_PRESETS}
        compareTo={design.card_gradient?.from || design.card_color}
        T={T}
      />

      <h3 className="pd-section-title">{T('Images', 'الصور')}</h3>

      <DragDropUploader
        label={T('Logo (square)', 'الشعار (مربع)')}
        hint={T('PNG, 512x512px recommended (max 2MB)', 'PNG، الحجم الموصى 512×512 (الحد 2MB)')}
        accept="image/png,image/jpeg"
        url={design.logo_url}
        onUrlChange={(v) => setField('logo_url', v)}
        shopId={shopId}
        kind="logo"
        T={T}
      />

      <DragDropUploader
        label={T('Cover image', 'صورة الغلاف')}
        hint={T('PNG, 1125x432px recommended (max 2MB)', 'PNG، الحجم الموصى 1125×432 (الحد 2MB)')}
        accept="image/png"
        url={design.background_url}
        onUrlChange={(v) => setField('background_url', v)}
        shopId={shopId}
        kind="bg"
        T={T}
      />

      {/* Reward icon section hidden for now — preset grid + custom upload.
          Re-enable by flipping this flag back to true. */}
      {false && (
        <>
          <h3 className="pd-section-title">{T('Reward icon', 'أيقونة المكافأة')}</h3>
          <div className="pd-field">
            <label>{T('Pick a preset', 'اختر من المعدّة مسبقاً')}</label>
            <PresetIconPicker selected={design.reward_icon_url} onSelect={(v) => setField('reward_icon_url', v)} />
          </div>

          <DragDropUploader
            label={T('Or upload custom icon', 'أو ارفع أيقونة خاصة')}
            hint={T('PNG, 90x90px recommended', 'PNG شفاف، 90×90 بكسل')}
            accept="image/png"
            url={design.reward_icon_url && !design.reward_icon_url.startsWith('data:') ? design.reward_icon_url : ''}
            onUrlChange={(v) => setField('reward_icon_url', v)}
            shopId={shopId}
            kind="icon"
            T={T}
          />
        </>
      )}

      <h3 className="pd-section-title">{T('Content', 'المحتوى')}</h3>

      <FieldEditor
        label={T('Reward title', 'عنوان المكافأة')}
        value={design.reward_title}
        onChange={(v) => setField('reward_title', v)}
        maxLength={30}
        placeholder={T('Free coffee', 'قهوة مجانية')}
        T={T}
      />

      <FieldEditor
        label={T('Reward description', 'وصف المكافأة')}
        value={design.reward_description}
        onChange={(v) => setField('reward_description', v)}
        maxLength={80}
        placeholder={T('Enjoy a free drink on us!', 'استمتع بمشروب مجاني!')}
        multiline
        T={T}
      />

      <h3 className="pd-section-title">{T('Pass language', 'لغة البطاقة')}</h3>
      <div className="pd-field">
        <div className="pd-seg">
          {[
            { k: 'auto', en: 'Auto', ar: 'تلقائي' },
            { k: 'en', en: 'English', ar: 'الإنجليزية' },
            { k: 'ar', en: 'Arabic', ar: 'العربية' },
          ].map(opt => (
            <button
              key={opt.k}
              type="button"
              className={`pd-seg-btn ${design.pass_language === opt.k ? 'active' : ''}`}
              onClick={() => setField('pass_language', opt.k)}
            >
              {T(opt.en, opt.ar)}
            </button>
          ))}
        </div>
        <div className="pd-field-hint">
          {T('Auto follows the customer\'s device language. Labels like SHOP/REWARD render in the selected language on the actual pass.',
             'تلقائي يتبع لغة جهاز العميل. التسميات مثل المتجر/المكافأة تظهر بهذه اللغة على البطاقة الفعلية.')}
        </div>
      </div>

      <h3 className="pd-section-title" style={{ cursor: 'pointer' }} onClick={() => setBackOpen(!backOpen)}>
        <span>{T('More info (back of pass)', 'معلومات إضافية (خلف البطاقة)')}</span>
        <span style={{ float: 'inline-end', fontSize: 14, opacity: .6, transform: backOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>›</span>
      </h3>
      <AnimatePresence initial={false}>
        {backOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: .2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pd-field-hint" style={{ marginBottom: 12 }}>
              {T('Shown on the back of Apple passes and the details panel in Google Wallet.',
                 'تظهر على خلفية بطاقة آبل وفي صفحة التفاصيل في محفظة جوجل.')}
            </div>
            <FieldEditor
              label={T('Terms & conditions', 'الشروط والأحكام')}
              value={design.terms}
              onChange={(v) => setField('terms', v)}
              maxLength={500}
              multiline
              T={T}
            />
            <FieldEditor
              label={T('Website', 'الموقع الإلكتروني')}
              value={design.website_url}
              onChange={(v) => setField('website_url', v)}
              maxLength={200}
              placeholder="https://example.com"
              T={T}
            />
            <FieldEditor
              label={T('Phone', 'الهاتف')}
              value={design.phone}
              onChange={(v) => setField('phone', v)}
              maxLength={30}
              placeholder="+966 5XX XXX XXX"
              T={T}
            />
            <FieldEditor
              label={T('Address', 'العنوان')}
              value={design.address}
              onChange={(v) => setField('address', v)}
              maxLength={200}
              T={T}
            />
            <FieldEditor
              label={T('Google Maps URL', 'رابط خرائط جوجل')}
              value={design.google_maps_url}
              onChange={(v) => setField('google_maps_url', v)}
              maxLength={300}
              placeholder="https://maps.google.com/..."
              T={T}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
