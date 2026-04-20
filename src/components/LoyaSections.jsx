import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import './loya-sections.css'

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
      animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 40, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function CheckMini({ on }) {
  if (on) {
    return (
      <span className="loya-check loya-check-on" aria-hidden>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path d="M5 10.5L8.5 14L15 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    )
  }
  return (
    <span className="loya-check loya-check-off" aria-hidden>
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
        <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </span>
  )
}

/* ─── Problem → Waya → How: simple 3-step explainer ─── */
export function ProblemExplainer({ t }) {
  const data = t.explainer
  const steps = [
    { ...data.problem, tone: 'problem', icon: '❓' },
    { ...data.waya, tone: 'waya', icon: '💚' },
    { ...data.how, tone: 'how', icon: '→' },
  ]
  return (
    <section className="loya-section loya-explainer" id="what-is-waya">
      <Reveal>
        <div className="loya-section-badge">• {data.badge} •</div>
      </Reveal>

      <div className="loya-explainer-grid">
        {steps.map((step, i) => (
          <Reveal key={step.tone} delay={i * 0.12}>
            <motion.div
              className={`loya-explainer-card loya-explainer-${step.tone}`}
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            >
              <span className="loya-explainer-icon" aria-hidden>{step.icon}</span>
              <span className="loya-explainer-label">{step.label}</span>
              <p className="loya-explainer-text">{step.text}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── Card Types: phone mockup + steps + tabbed card previews ─── */
export function CardTypes({ t }) {
  const [active, setActive] = useState('stamp')
  const data = t.cardTypes
  const detail = data.details[active]

  return (
    <section className="loya-section loya-cardtypes" id="card-types">
      <div className="loya-cardtypes-top">
        <div className="loya-cardtypes-steps">
          <div className="loya-section-badge">• {data.badge} •</div>
          <h2 className="loya-section-title">{data.title}</h2>
          <ol className="loya-steps-list">
            {data.steps.map((step) => (
              <li key={step.num} className="loya-step-row">
                <span className="loya-step-num">{step.num}</span>
                <div className="loya-step-body">
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <Reveal className="loya-phone-wrap">
          <div className="loya-phone">
            <div className="loya-phone-notch" />
            <div className="loya-phone-screen">
              <div className="loya-pass">
                <div className="loya-pass-header">
                  <span className="loya-pass-logo">وايا</span>
                  <span className="loya-pass-brand">Waya</span>
                </div>
                <div className="loya-pass-stamps">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`loya-pass-stamp ${i < 4 ? 'on' : ''}`}>
                      {i < 4 ? '☕' : '○'}
                    </div>
                  ))}
                </div>
                <div className="loya-pass-meta">
                  <span>قهوة مجانية عند ٦ أختام</span>
                  <strong>4 / 6</strong>
                </div>
                <div className="loya-pass-qr" aria-hidden>
                  <div className="loya-qr-grid">
                    {Array.from({ length: 49 }).map((_, i) => (
                      <span key={i} style={{ opacity: (i * 7 + 3) % 3 === 0 ? 1 : 0.25 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="loya-phone-bubbles">
            <span className="loya-bubble loya-bubble-1">✨ نقاط</span>
            <span className="loya-bubble loya-bubble-2">🤑 كاش باك</span>
            <span className="loya-bubble loya-bubble-3">😋 أختام</span>
            <span className="loya-bubble loya-bubble-4">🥳 اشتراكات</span>
            <span className="loya-bubble loya-bubble-5">🤩 التخفيض</span>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <h3 className="loya-types-title">{data.typesTitle}</h3>
        <div className="loya-tabs-row">
          {data.tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`loya-tab ${active === tab.key ? 'loya-tab-on' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="loya-type-detail">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="loya-type-detail-inner"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="loya-type-copy">
              <h4>{detail.title}</h4>
              <p>{detail.desc}</p>
            </div>
            <div className="loya-type-card">
              <div className={`loya-type-card-inner loya-type-${active}`}>
                <div className="loya-type-card-head">
                  <span>{detail.title}</span>
                  <span className="loya-type-card-dot">●</span>
                </div>
                <div className="loya-type-card-art">
                  {active === 'stamp' && <div className="loya-art-stamps">{['☕','☕','☕','○','○','○'].map((s,i)=>(<span key={i}>{s}</span>))}</div>}
                  {active === 'points' && <div className="loya-art-big">240 <small>نقطة</small></div>}
                  {active === 'cashback' && <div className="loya-art-big">٣٢ <small>ر.س</small></div>}
                  {active === 'subscription' && <div className="loya-art-big">VIP</div>}
                  {active === 'discount' && <div className="loya-art-big">١٥٪ <small>خصم</small></div>}
                  {active === 'gift' && <div className="loya-art-big">🎁</div>}
                  {active === 'membership' && <div className="loya-art-big">★</div>}
                </div>
                <div className="loya-type-card-foot">
                  <div className="loya-qr-grid small">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <span key={i} style={{ opacity: (i * 5 + 2) % 3 === 0 ? 1 : 0.25 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

/* ─── Who we serve: 10-card grid ─── */
export function WhoWeServe({ t }) {
  const data = t.whoWeServe
  return (
    <section className="loya-section loya-who" id="who-we-serve">
      <Reveal>
        <div className="loya-section-badge">• {data.badge} •</div>
        <h2 className="loya-section-title loya-who-title">{data.title}</h2>
      </Reveal>

      <div className="loya-who-grid">
        {data.items.map((item, i) => (
          <Reveal key={i} delay={i * 0.04}>
            <motion.div
              className="loya-who-card"
              whileHover={{ y: -6, boxShadow: '0 14px 40px rgba(16,185,129,0.14)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <span className="loya-who-emoji" aria-hidden>{item.emoji}</span>
              <span className="loya-who-label">{item.label}</span>
            </motion.div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.15}>
        <div className="loya-who-cta-wrap">
          <a href="#cta" className="loya-who-cta">
            <span>←</span>
            {data.cta}
          </a>
        </div>
      </Reveal>
    </section>
  )
}

/* ─── POS Integrations: infinite logo marquee ─── */
export function PosIntegrations({ t }) {
  const data = t.posIntegrations
  const logos = [...data.logos, ...data.logos]
  return (
    <section className="loya-section loya-pos" id="pos">
      <Reveal>
        <div className="loya-section-badge">• {data.badge} •</div>
        <h2 className="loya-section-title loya-pos-title">
          {data.title1} <span className="loya-accent">{data.title2}</span>
        </h2>
        <p className="loya-section-sub">{data.subtitle}</p>
      </Reveal>

      <div className="loya-marquee">
        <div className="loya-marquee-track">
          {logos.map((logo, i) => {
            const name = typeof logo === 'string' ? logo : logo.name
            const src = typeof logo === 'string' ? null : logo.src
            return (
              <div key={`${name}-${i}`} className="loya-logo-tile">
                {src ? (
                  <img src={src} alt={name} className="loya-logo-img" />
                ) : (
                  <span>{name}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Reveal delay={0.1}>
        <div className="loya-pos-cta">
          <p>{data.ctaQuestion}</p>
          <a href="#cta" className="loya-who-cta">
            <span>←</span>
            {data.ctaBtn}
          </a>
        </div>
      </Reveal>
    </section>
  )
}

/* ─── Partners: logo carousel ─── */
export function Partners({ t }) {
  const data = t.partners
  const logos = [...data.logos, ...data.logos]
  return (
    <section className="loya-section loya-partners" id="partners">
      <Reveal>
        <div className="loya-section-badge">• {data.badge} •</div>
        <h2 className="loya-section-title loya-partners-title">{data.title}</h2>
      </Reveal>

      <div className="loya-marquee loya-marquee-slow">
        <div className="loya-marquee-track loya-marquee-track-rev">
          {logos.map((name, i) => (
            <div key={`p-${name}-${i}`} className="loya-brand-tile">
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Single Founding Plan — one bold highlighted card ─── */
export function PricingFounding({ t }) {
  const data = t.pricingFounding
  return (
    <section className="loya-section loya-pricing-founding" id="pricing">
      <Reveal>
        <div className="loya-section-badge">• {data.badge} •</div>
        <h2 className="loya-section-title">{data.title}</h2>
        <p className="loya-section-sub">{data.subtitle}</p>
      </Reveal>

      <Reveal delay={0.1}>
        <motion.div
          className="loya-founding-card"
          whileHover={{ y: -6 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="loya-founding-badge">✨ {data.recommended}</div>

          <div className="loya-founding-free">{data.freeTrial}</div>

          <div className="loya-founding-price">
            <span className="loya-founding-amount">{data.price}</span>
            <div className="loya-founding-unit">
              <span className="loya-founding-sar">{data.sar}</span>
              <span className="loya-founding-per">{data.perMonth}</span>
            </div>
          </div>

          <div className="loya-founding-divider" />

          <span className="loya-founding-features-title">{data.featuresTitle}</span>
          <ul className="loya-founding-features">
            {data.features.map((f, i) => (
              <li key={i}>
                <CheckMini on />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="loya-founding-soon">
            <span className="loya-founding-soon-label">{data.soonTitle}</span>
            <ul className="loya-founding-soon-list">
              {data.soonFeatures.map((f, i) => (
                <li key={i}>
                  <span className="loya-founding-soon-dot" aria-hidden>●</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <a href="#cta" className="loya-founding-cta">{data.cta}</a>
        </motion.div>
      </Reveal>
    </section>
  )
}

/* ─── 3-Tier Pricing with monthly / annual toggle ─── */
export function PricingTiered({ t }) {
  const [annual, setAnnual] = useState(true)
  const data = t.pricingTiers

  return (
    <section className="loya-section loya-pricing-tiered" id="pricing">
      <Reveal>
        <div className="loya-section-badge">• {data.badge} •</div>
        <h2 className="loya-section-title">{data.title}</h2>
        <p className="loya-section-sub">{data.subtitle}</p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="loya-toggle-wrap">
          <div className="loya-toggle" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!annual}
              onClick={() => setAnnual(false)}
              className={`loya-toggle-btn ${!annual ? 'on' : ''}`}
            >
              {data.monthly}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={annual}
              onClick={() => setAnnual(true)}
              className={`loya-toggle-btn ${annual ? 'on' : ''}`}
            >
              {data.annual}
            </button>
          </div>
        </div>
      </Reveal>

      <div className="loya-tiers">
        {data.plans.map((plan, i) => {
          const price = annual ? plan.annualMonthly : plan.monthly
          const featured = plan.recommended
          return (
            <Reveal key={plan.key} delay={i * 0.08}>
              <motion.div
                className={`loya-tier ${featured ? 'loya-tier-featured' : ''}`}
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              >
                {featured && <div className="loya-tier-badge">{data.recommended}</div>}

                <div className="loya-tier-head">
                  <div className="loya-tier-annual-badge">
                    <span>{plan.annualTotal.toFixed(2)}</span>
                    <span className="loya-tier-sar">{data.sar}</span>
                    <span className="loya-tier-annual-label">/ {data.annualLabel}</span>
                  </div>
                  <span className="loya-tier-name">{plan.name}</span>
                </div>

                <div className="loya-tier-price">
                  <div className="loya-tier-price-row">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${plan.key}-${annual}`}
                        className="loya-tier-amount"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                      >
                        {price.toFixed(2)}
                      </motion.span>
                    </AnimatePresence>
                    <span className="loya-tier-sar-big">{data.sar}</span>
                  </div>
                  <span className="loya-tier-per">{data.perMonth}</span>
                </div>

                <p className="loya-tier-desc">{plan.desc}</p>

                <div className="loya-tier-divider" />

                <span className="loya-tier-features-title">
                  {t.lang === 'en' ? 'Includes' : 'الباقة تحتوي على'}
                </span>
                <ul className="loya-tier-features">
                  {plan.features.map((f, idx) => (
                    <li key={idx} className={f.on ? 'on' : 'off'}>
                      <CheckMini on={f.on} />
                      <span>{f.label}</span>
                    </li>
                  ))}
                </ul>

                <a href="#cta" className="loya-tier-cta">
                  {data.ctaSubscribe}
                </a>
                {featured && (
                  <a href="#cta" className="loya-tier-trial">
                    {data.ctaTrial}
                  </a>
                )}
              </motion.div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
