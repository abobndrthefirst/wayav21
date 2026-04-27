import { motion } from 'framer-motion'
import { TEMPLATES, materializeTemplate } from './templates'

const SHIMMER_KEYFRAMES = `@keyframes pdAdminShimmer {0%{background-position:0% 50%}100%{background-position:200% 50%}}`

const BackArrow = ({ isAr }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" style={{ transform: isAr ? 'scaleX(-1)' : undefined }}>
    <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.56l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
  </svg>
)

function TemplateThumbnail({ tpl, isAr }) {
  const d = tpl.design
  // Admin AI templates show their generated background image (or gradient as a
  // fallback). Built-ins keep the existing flat-color thumbnail.
  const adminBg = tpl.isAdmin
    ? (d.background_url
        ? { backgroundImage: `url(${d.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : d.card_gradient
          ? { backgroundImage: `linear-gradient(${d.card_gradient.angle ?? 135}deg, ${d.card_gradient.from}, ${d.card_gradient.to})` }
          : { background: d.card_color })
    : { background: d.card_color }
  return (
    <div className="pd-tpl-thumb" style={{ ...adminBg, color: d.text_color }}>
      <div className="pd-tpl-thumb-header">
        <span className="pd-tpl-thumb-emoji">{tpl.emoji}</span>
        <span className="pd-tpl-thumb-name">{isAr ? tpl.nameAr : tpl.nameEn}</span>
      </div>
      <div className="pd-tpl-thumb-mid">
        {d.loyalty_type === 'stamp' && (
          <div className="pd-tpl-thumb-stamps">
            {Array.from({ length: Math.min(d.stamps_required || 10, 10) }).map((_, i) => (
              <span key={i} className="pd-tpl-thumb-stamp" style={{ borderColor: d.text_color, color: d.text_color }}>
                {i < 3 ? tpl.emoji : ''}
              </span>
            ))}
          </div>
        )}
        {d.loyalty_type === 'points' && (
          <div className="pd-tpl-thumb-balance">
            <div className="pd-tpl-thumb-label">{isAr ? 'نقاط' : 'POINTS'}</div>
            <div className="pd-tpl-thumb-val">0 / {d.reward_threshold}</div>
          </div>
        )}
        {d.loyalty_type === 'coupon' && (
          <div className="pd-tpl-thumb-balance">
            <div className="pd-tpl-thumb-label">{isAr ? 'العرض' : 'OFFER'}</div>
            <div className="pd-tpl-thumb-val">{d.coupon_discount}</div>
          </div>
        )}
      </div>
      <div className="pd-tpl-thumb-footer">
        {isAr ? (d.reward_title_ar || d.reward_title) : d.reward_title}
      </div>
    </div>
  )
}

export default function TemplateGallery({ T, isAr, onPick, onStartBlank, onBack, templates }) {
  // Default to the bundled built-ins when caller didn't supply admin-merged list.
  const list = Array.isArray(templates) && templates.length > 0 ? templates : TEMPLATES
  return (
    <div className="pd-page pd-gallery-page" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{SHIMMER_KEYFRAMES}</style>
      <button type="button" className="pd-back" onClick={onBack}>
        <BackArrow isAr={isAr} />
        {T('Back', 'رجوع')}
      </button>

      <div className="pd-gallery-hero">
        <h2 className="pd-gallery-title">
          {T('Choose a template to start', 'اختر قالباً للبدء')}
        </h2>
        <p className="pd-gallery-sub">
          {T('Pick one to get a head start — you can customize everything after.',
             'اختر واحداً لتبدأ بسرعة — يمكنك تخصيص كل شيء بعد ذلك.')}
        </p>
      </div>

      <div className="pd-gallery-grid">
        {list.map((tpl, i) => (
          <motion.button
            key={tpl.key}
            type="button"
            className="pd-tpl-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -4 }}
            onClick={() => onPick(materializeTemplate(tpl, isAr))}
          >
            <TemplateThumbnail tpl={tpl} isAr={isAr} />
            <div className="pd-tpl-meta">
              <span className="pd-tpl-label">{isAr ? tpl.nameAr : tpl.nameEn}</span>
              <span className="pd-tpl-chip">
                {tpl.isAdmin ? T('AI', 'ذكي')
                  : tpl.design.loyalty_type === 'stamp' ? T('Stamp', 'أختام')
                  : tpl.design.loyalty_type === 'points' ? T('Points', 'نقاط')
                  : tpl.design.loyalty_type === 'tiered' ? T('Tiered', 'مستويات')
                  : T('Coupon', 'كوبون')}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="pd-gallery-blank">
        <button type="button" className="pd-action-btn ghost" onClick={onStartBlank}>
          {T('Start from scratch', 'البدء من الصفر')}
        </button>
      </div>
    </div>
  )
}
