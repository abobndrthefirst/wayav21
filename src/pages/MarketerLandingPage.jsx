// Public Arabic-first landing for the Waya marketer affiliate program.
// Route: /marketers (mounted by App.jsx via lazy import).
// All copy lives in App.jsx content.{ar,en}.marketer — passed in via `t`.
//
// The page has its own light header (logo + nav buttons) instead of the home
// Navbar so visitors stay focused on the marketer funnel. Footer is the same
// minimal pattern used elsewhere on auth pages.

import { useEffect } from 'react'
import { motion } from 'framer-motion'

// Production brand mark — served from /public, same asset used by the home
// Navbar and the inline auth-page Logo component in App.jsx.
const WAYA_LOGO = '/Arabic Letters Midjourney (1).svg'

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

export default function MarketerLandingPage({ t, lang, setLang, theme, setTheme }) {
  const m = t.marketer
  const isAr = lang === 'ar'

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
          <h1 className="marketer-hero-title">{m.landingTitle}</h1>
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

      <section className="marketer-final-cta">
        <motion.div className="marketer-final-cta-inner" initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h2>{m.finalCtaTitle}</h2>
          <p>{m.finalCtaBody}</p>
          <button className="marketer-btn-primary marketer-btn-large" onClick={() => navigate('/marketer/signup')}>{m.finalCtaBtn}</button>
        </motion.div>
      </section>

      <footer className="marketer-landing-footer">
        <p>{m.footerNote}</p>
        <p className="marketer-landing-footer-copy">© {new Date().getFullYear()} Waya</p>
      </footer>
    </div>
  )
}
