// Public Arabic-first landing for the Waya marketer affiliate program.
// Route: /marketers (mounted by App.jsx via lazy import).
// All copy lives in App.jsx content.{ar,en}.marketer — passed in via `t`.
//
// The page has its own light header (logo + nav buttons) instead of the home
// Navbar so visitors stay focused on the marketer funnel. Footer is the same
// minimal pattern used elsewhere on auth pages.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// Production brand mark — served from /public, same asset used by the home
// Navbar and the inline auth-page Logo component in App.jsx.
const WAYA_LOGO = '/Arabic Letters Midjourney (1).svg'

// Commission rates per the public policy at /marketers/policy.
// Keep these in sync with that page if rates ever change.
const COMMISSION_MONTH_1 = 75
const COMMISSION_MONTH_2 = 50
const COMMISSION_MONTH_3 = 25
const COMMISSION_LIFETIME = COMMISSION_MONTH_1 + COMMISSION_MONTH_2 + COMMISSION_MONTH_3

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
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// Saudi Riyal symbol — official 2024 glyph. Inlined so the fill follows
// currentColor (the SVG asset in /public has a hardcoded #231f20 fill that
// wouldn't theme with our green/light/dark palette).
function SarIcon({ size = 16 }) {
  return (
    <svg
      aria-label="ريال"
      role="img"
      width={size}
      height={size * (1256.39 / 1124.14)}
      viewBox="0 0 1124.14 1256.39"
      fill="currentColor"
      style={{ verticalAlign: 'middle', display: 'inline-block' }}
    >
      <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>
      <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/>
    </svg>
  )
}

// Render a string that contains the literal token "{brand}" by splitting
// at the token and wrapping the brand word in a styled span. Used in the
// hero title so the brand renders in the accent color.
function renderWithBrand(template, brand) {
  if (!template || !template.includes('{brand}')) return template
  const parts = template.split('{brand}')
  return parts.flatMap((part, i) => i < parts.length - 1
    ? [part, <span key={i} className="marketer-brand-highlight">{brand}</span>]
    : [part])
}

export default function MarketerLandingPage({ t, lang, setLang, theme, setTheme }) {
  const m = t.marketer
  const isAr = lang === 'ar'

  // Calculator state — default to 10 to give visitors an immediate sense of
  // the math without requiring them to type anything.
  const [storeCount, setStoreCount] = useState(10)
  const safeCount = Math.max(0, Math.min(500, Number.isFinite(storeCount) ? storeCount : 0))
  const earnM1 = safeCount * COMMISSION_MONTH_1
  const earnM2 = safeCount * COMMISSION_MONTH_2
  const earnM3 = safeCount * COMMISSION_MONTH_3
  const earnTotal = safeCount * COMMISSION_LIFETIME
  const fmt = (n) => n.toLocaleString(isAr ? 'ar-SA' : 'en-US')

  useEffect(() => {
    document.title = isAr ? 'انضم إلى مسوّقي Waya' : 'Join Waya Marketers'
  }, [isAr])

  return (
    <div className="marketer-landing" dir={isAr ? 'rtl' : 'ltr'}>
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
          <button className="marketer-landing-login" onClick={() => navigate('/marketer/login')}>{m.navLogin}</button>
          <button className="marketer-landing-cta" onClick={() => navigate('/marketer/signup')}>{m.navSignup}</button>
        </div>
      </header>

      <section className="marketer-hero">
        <motion.div className="marketer-hero-inner" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <h1 className="marketer-hero-title">{renderWithBrand(m.landingTitle, m.brand)}</h1>
          <p className="marketer-hero-subtitle">{m.landingSubtitle}</p>
          <div className="marketer-hero-actions">
            <button className="marketer-btn-primary" onClick={() => navigate('/marketer/signup')}>{m.ctaPrimary}</button>
            <a className="marketer-btn-secondary" href="#how-it-works">{m.ctaSecondary}</a>
          </div>
          <div className="marketer-hero-badges">
            <span className="marketer-badge">{m.badges.age}</span>
            <span className="marketer-badge">{m.badges.regions}</span>
            <span className="marketer-badge">{m.badges.flexible}</span>
            <span className="marketer-badge">{m.badges.payout}</span>
          </div>
        </motion.div>
      </section>

      <section className="marketer-section">
        <h2 className="marketer-section-title">{m.whyTitle}</h2>
        <div className="marketer-grid marketer-grid-4">
          {m.whyCards.map((card, i) => (
            <motion.div key={i} className="marketer-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: i * 0.06 }}>
              <h3 className="marketer-card-title">{card.title}</h3>
              <p className="marketer-card-body">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="marketer-section" id="how-it-works">
        <h2 className="marketer-section-title">{m.howTitle}</h2>
        <ol className="marketer-steps">
          {m.howSteps.map((step, i) => (
            <motion.li key={i} className="marketer-step" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: i * 0.06 }}>
              <span className="marketer-step-num">{i + 1}</span>
              <div>
                <h3 className="marketer-step-title">{step.title}</h3>
                <p className="marketer-step-body">{step.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="marketer-section marketer-section-split">
        <div>
          <h2 className="marketer-section-title">{m.requirementsTitle}</h2>
          <ul className="marketer-bullets">
            {m.requirements.map((r, i) => (
              <li key={i}><span className="marketer-bullet-check"><CheckIcon /></span><span>{r}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="marketer-section-title">{m.suitableTitle}</h2>
          <ul className="marketer-bullets">
            {m.suitableFor.map((r, i) => (
              <li key={i}><span className="marketer-bullet-check"><CheckIcon /></span><span>{r}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="marketer-section">
        <h2 className="marketer-section-title">{m.commissionTitle}</h2>
        <p className="marketer-section-body">{m.commissionBody}</p>
        <div className="marketer-grid marketer-grid-3">
          {m.commissionExamples.map((ex, i) => (
            <motion.div key={i} className="marketer-card marketer-commission-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <div className="marketer-commission-count">{ex.count}</div>
              <div className="marketer-commission-label">{ex.label}</div>
            </motion.div>
          ))}
        </div>
        <p className="marketer-note">{m.commissionNote}</p>
      </section>

      <section className="marketer-section">
        <h2 className="marketer-section-title">{m.calculatorTitle}</h2>
        <p className="marketer-section-body">{m.calculatorSubtitle}</p>
        <motion.div
          className="marketer-calc"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
        >
          <label className="marketer-calc-label" htmlFor="marketer-calc-input">{m.calculatorLabel}</label>
          <div className="marketer-calc-input-row">
            <input
              id="marketer-calc-input"
              type="range"
              min="0"
              max="200"
              step="1"
              value={safeCount}
              onChange={(e) => setStoreCount(parseInt(e.target.value, 10))}
              className="marketer-calc-range"
            />
            <input
              type="number"
              min="0"
              max="500"
              value={safeCount}
              onChange={(e) => setStoreCount(parseInt(e.target.value, 10) || 0)}
              className="marketer-calc-number"
              dir="ltr"
            />
          </div>

          <div className="marketer-calc-grid">
            <div className="marketer-calc-cell">
              <div className="marketer-calc-cell-label">{m.calculatorMonth1}</div>
              <div className="marketer-calc-cell-rate">{m.calculatorRate1}</div>
              <div className="marketer-calc-cell-value">{fmt(earnM1)}<SarIcon size={18} /></div>
            </div>
            <div className="marketer-calc-cell">
              <div className="marketer-calc-cell-label">{m.calculatorMonth2}</div>
              <div className="marketer-calc-cell-rate">{m.calculatorRate2}</div>
              <div className="marketer-calc-cell-value">{fmt(earnM2)}<SarIcon size={18} /></div>
            </div>
            <div className="marketer-calc-cell">
              <div className="marketer-calc-cell-label">{m.calculatorMonth3}</div>
              <div className="marketer-calc-cell-rate">{m.calculatorRate3}</div>
              <div className="marketer-calc-cell-value">{fmt(earnM3)}<SarIcon size={18} /></div>
            </div>
          </div>

          <div className="marketer-calc-total">
            <span className="marketer-calc-total-label">{m.calculatorTotal}</span>
            <span className="marketer-calc-total-value">
              {fmt(earnTotal)}<SarIcon size={28} />
            </span>
          </div>

          <p className="marketer-note">{m.calculatorAssumeNote}</p>
        </motion.div>
      </section>

      <section className="marketer-final-cta">
        <motion.div className="marketer-final-cta-inner" initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h2>{m.finalCtaTitle}</h2>
          <p>{m.finalCtaBody}</p>
          <button className="marketer-btn-primary marketer-btn-large" onClick={() => navigate('/marketer/signup')}>{m.finalCtaBtn}</button>
        </motion.div>
      </section>

      <footer className="marketer-landing-footer">
        <p>{m.footerNote}</p>
        <p className="marketer-landing-footer-links">
          <a href="/marketers/policy" onClick={(e) => { e.preventDefault(); navigate('/marketers/policy') }}>{m.policyLink}</a>
        </p>
        <p className="marketer-landing-footer-copy">© {new Date().getFullYear()} Waya</p>
      </footer>
    </div>
  )
}
