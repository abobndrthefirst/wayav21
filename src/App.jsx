import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import './styles.css'

/* ─── Reusable scroll-reveal wrapper ─── */
function Reveal({ children, delay = 0, direction = 'up', className = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 60 : direction === 'down' ? -60 : 0,
      x: direction === 'right' ? -60 : direction === 'left' ? 60 : 0,
      scale: 0.97,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.9,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}

/* ─── Logo (from Figma) ─── */
function Logo({ size = 34 }) {
  return (
    <img src="/logo.svg" alt="وايا" style={{ width: size, height: 'auto' }} />
  )
}

/* ─── Icons ─── */
function CheckIcon({ color = '#10B981' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M16.5 5.5L7.5 14.5L3.5 10.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M13 5L5 13M5 5L13 13" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function StoreIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function QRIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

/* ─── Navbar (glass-morphism pill) ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="nav-pill">
        <a href="#cta" className="nav-cta">انضم</a>
        <div className="nav-links">
          <a href="#pricing">الأسعار</a>
          <a href="#features">المميزات</a>
          <a href="#how">كيف يعمل</a>
        </div>
        <div className="nav-logo">
          <span className="nav-logo-text">وايا</span>
          <Logo size={34} />
        </div>
      </div>
    </motion.nav>
  )
}

/* ─── Hero (side-by-side layout) ─── */
function Hero() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 0.3], [0, -60])
  const opacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])

  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="hero-glow-2" />

      <motion.div className="hero-inner" style={{ y, opacity }}>
        {/* Image side (left in RTL = visually left) */}
        <Reveal delay={0.2} direction="right" className="hero-image-side">
          <div className="hero-image-container">
            <motion.img
              src="/hero.png"
              alt="وايا"
              className="hero-image"
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
            {/* Floating stat bubbles */}
            <motion.div
              className="floating-bubble floating-bubble-1"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img src="/icon-monitoring.svg" alt="" width="24" height="24" />
            </motion.div>
            <motion.div
              className="floating-bubble floating-bubble-2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <img src="/icon-favorite.svg" alt="" width="24" height="24" />
            </motion.div>
            <motion.div
              className="floating-bubble floating-bubble-3"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              <img src="/icon-leaderboard.svg" alt="" width="24" height="24" />
            </motion.div>
          </div>
        </Reveal>

        {/* Text side (right) */}
        <div className="hero-text-side">
          <Reveal>
            <h1 className="hero-title">
              <span className="text-cream">برامج ولاء تشتغل </span>
              <span className="text-green">بسهولة</span>
            </h1>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="hero-subtitle">
              حوّل عملائك إلى ضيوف دائمين. منصة الموقد تمنحك الأدوات الدافئة
              لبناء علاقات تدوم، دون تعقيدات تقنية.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="hero-form">
              <div className="hero-input-wrap">
                <input type="text" placeholder="إيميلك أو رقم واتسابك" className="hero-input" />
              </div>
              <button className="hero-btn">اشترك عبر الواتس اب</button>
            </div>
          </Reveal>
        </div>
      </motion.div>
    </section>
  )
}

/* ─── Industry Tags + Stats ─── */
function IndustryTags() {
  const tags = [
    { label: 'مغاسل', emoji: '👔' },
    { label: 'حلويات', emoji: '🍰' },
    { label: 'صالونات', emoji: '💇' },
  ]

  return (
    <section className="tags-section">
      <div className="tags-content">
        <Reveal>
          <div className="tags-stat">
            <span className="tags-stat-number">+٤٧٧</span>
            <span className="tags-stat-label">محل مسجّل</span>
          </div>
        </Reveal>

        <div className="tags-floating">
          {/* Left side tags */}
          <div className="tags-column tags-left">
            {tags.map((tag, i) => (
              <Reveal key={`l-${i}`} delay={0.1 * i} direction="right">
                <motion.span
                  className="industry-tag"
                  style={{ opacity: 0.7 + i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {tag.label} {tag.emoji}
                </motion.span>
              </Reveal>
            ))}
          </div>

          {/* Right side tags */}
          <div className="tags-column tags-right">
            {tags.map((tag, i) => (
              <Reveal key={`r-${i}`} delay={0.15 * i} direction="left">
                <motion.span
                  className="industry-tag"
                  style={{ opacity: 0.7 + i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {tag.emoji} {tag.label}
                </motion.span>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    { icon: <StoreIcon />, title: 'سجل متجرك', desc: 'ابدأ في دقائق. أضف شعارك، هويتك، ونوع المكافآت التي تفضلها.' },
    { icon: <QRIcon />, title: 'شارك الكود', desc: 'اطبع رمز الاستجابة السريعة وضعه على الطاولة. لا يحتاج العميل لتحميل تطبيقات معقدة.' },
    { icon: <HeartIcon />, title: 'ابني الولاء', desc: 'شاهد عملائك يعودون مراراً وتكراراً للحصول على مكافآتهم.' },
  ]

  return (
    <section className="section" id="how">
      <Reveal>
        <div className="section-badge">حلويات</div>
        <h2 className="section-title">ثلاث خطوات بس</h2>
        <p className="section-subtitle">بساطة التصميم، روعة النتائج.</p>
      </Reveal>

      <div className="steps-grid">
        {steps.map((step, i) => (
          <Reveal key={i} delay={i * 0.15}>
            <motion.div
              className="step-card"
              whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(16,185,129,0.06)' }}
              transition={{ duration: 0.3 }}
            >
              <div className="step-icon">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
              <span className="step-number">{i + 1}</span>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── Dashboard / Features ─── */
function Features() {
  const stats = [
    { label: 'ارتفاع الإيرادات', value: '١٤.٢ك ر.س', change: '+٢٢%' },
    { label: 'زيارات متكررة', value: '٦٧%', change: '+٨%' },
    { label: 'مكافآت مرسلة', value: '٣,٨٩١', change: '+٣٤%' },
    { label: 'عملاء نشطين', value: '١,٢٤٧', change: '+١٢%' },
  ]

  const features = [
    { icon: <BellIcon />, title: 'ذكر عميلك اي وقت', desc: 'وصّل عملائك وين ما كانوا. يشتغل مع أي جوال.' },
    { icon: <ChartIcon />, title: 'تحليلات مفهومة', desc: 'تحليلات بلغة بسيطة. اعرف أي مكافأة تنجح وأي عميل بدأ يبتعد.' },
    { icon: <ShareIcon />, title: 'حلقة الإحالة المدمجة', desc: 'العملاء يشاركون، أصدقائهم ينضمون، الكل يكسب. نمو بدون تعب.' },
    { icon: <CalendarIcon />, title: 'حملات رمضان والعيد', desc: 'قوالب جاهزة للمواسم. فعّلها بضغطة. أسعد عملاءك في الوقت المناسب.' },
  ]

  return (
    <section className="section" id="features">
      <Reveal>
        <h2 className="section-title">كل اللي تحتاجه. ولا شي زيادة.</h2>
        <p className="section-subtitle">مركز الولاء، على بعد شاشة واحدة</p>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="dashboard-card">
          <div className="dashboard-header">
            <span className="dashboard-label">لوحة تحكم نظام الولاء</span>
          </div>
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              >
                <div className="stat-card-header">
                  <span className="stat-card-label">{stat.label}</span>
                  <span className="stat-card-change">{stat.change}</span>
                </div>
                <span className="stat-card-value">{stat.value}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="features-grid">
        {features.map((feat, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <motion.div
              className="feature-card"
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
            >
              <div className="feature-icon">{feat.icon}</div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── Comparison Table ─── */
function Comparison() {
  const withoutItems = [
    'دفع إعلانات ما تجيب نتيجة',
    'تشوف عملائك يروحون للسلاسل',
    'ما تعرف مين عميل دائم ومين مرة وحدة',
    'أدوات تقنية تحس إنها لناسا',
    'تفوّت موسم رمضان والعيد',
  ]

  const withItems = [
    'عملاء يرجعون لك دايم',
    'نافس أي سلسلة بشروطك',
    'اعرف كل عميل بالاسم (والعادة)',
    'أطلق بدقائق، بدون خبرة تقنية',
    'حملات رمضان والعيد جاهزة',
  ]

  return (
    <section className="section section-alt">
      <Reveal>
        <div className="section-badge">ليش التجار يتحولون</div>
        <h2 className="section-title">ماذا لو برامج الولاء ما كانت بس للكبار؟</h2>
      </Reveal>

      <div className="comparison-grid">
        <Reveal delay={0.1} direction="right">
          <div className="comparison-card comparison-without">
            <div className="comparison-header comparison-header-without">
              <h3>بدون نظام الولاء</h3>
            </div>
            <ul className="comparison-list">
              {withoutItems.map((item, i) => (
                <li key={i} className="comparison-item-without">
                  <div className="comparison-x-icon"><XIcon /></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.2} direction="left">
          <div className="comparison-card comparison-with">
            <div className="comparison-header comparison-header-with">
              <h3>مع نظام الولاء</h3>
            </div>
            <ul className="comparison-list">
              {withItems.map((item, i) => (
                <li key={i} className="comparison-item-with">
                  <div className="comparison-check-icon"><CheckIcon color="#10B981" /></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─── Pricing ─── */
function Pricing() {
  const [annual, setAnnual] = useState(false)

  const planFeatures = [
    'حملات غير محدودة',
    'توصيل واتساب و SMS',
    'لوحة تحكم كاملة',
    'تحليلات وتقارير',
    'حلقة إحالة مدمجة',
    'قوالب رمضان والعيد',
    'دعم فني عربي',
  ]

  return (
    <section className="section" id="pricing">
      <Reveal>
        <div className="section-badge">الاسعار</div>
        <h2 className="section-title">خطة بسيطة، بدون تعقيد</h2>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="pricing-cards">
          {/* Monthly */}
          <motion.div
            className={`pricing-card ${!annual ? 'pricing-active' : ''}`}
            onClick={() => setAnnual(false)}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <span className="pricing-plan-label">الخطة الشهرية</span>
            <div className="pricing-amount">
              <span className="price">٧٥</span>
              <span className="price-label">ر.س / شهر</span>
            </div>
            <p className="price-note">بدون التزام — الغي بأي وقت</p>
            <ul className="pricing-features">
              {planFeatures.map((f, i) => (
                <li key={i}><CheckIcon color="#10B981" /> <span>{f}</span></li>
              ))}
            </ul>
            <motion.button className="pricing-cta" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              ابدأ الآن
            </motion.button>
          </motion.div>

          {/* Annual */}
          <motion.div
            className={`pricing-card ${annual ? 'pricing-active' : ''}`}
            onClick={() => setAnnual(true)}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <div className="pricing-plan-label-row">
              <span className="pricing-plan-label">الخطة السنوية</span>
              <span className="save-badge">الأكثر توفيراً</span>
            </div>
            <div className="pricing-amount">
              <span className="price">٥٥</span>
              <span className="price-label">ر.س / شهر</span>
            </div>
            <p className="price-note">يُفوتر ١،٤٢٨ ر.س سنوياً — توفير ٣٥٨ ر.س</p>
            <ul className="pricing-features">
              {planFeatures.map((f, i) => (
                <li key={i}><CheckIcon color="#10B981" /> <span>{f}</span></li>
              ))}
            </ul>
            <motion.button className="pricing-cta" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              ابدأ الآن
            </motion.button>
          </motion.div>
        </div>
      </Reveal>
    </section>
  )
}

/* ─── CTA ─── */
function CTA() {
  return (
    <section className="cta-section" id="cta">
      <div className="cta-glow" />
      <Reveal>
        <h2 className="cta-title">مستعد تحوّل المشتري العابر إلى عميل دائم؟</h2>
      </Reveal>
      <Reveal delay={0.15}>
        <p className="cta-subtitle">انضم لقائمة الانتظار اليوم. كن أول من يطلق برنامج ولائه قبل العيد.</p>
      </Reveal>
      <Reveal delay={0.3}>
        <div className="hero-form" style={{ justifyContent: 'center', maxWidth: 520, margin: '0 auto' }}>
          <div className="hero-input-wrap">
            <input type="text" placeholder="إيميلك أو رقم واتسابك" className="hero-input" />
          </div>
          <motion.button className="hero-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            اشترك عبر واتس اب
          </motion.button>
        </div>
      </Reveal>
    </section>
  )
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-copy">٢٠٢٦ وايا.</p>
        <div className="footer-logo">
          <span className="nav-logo-text">وايا</span>
          <Logo size={28} />
        </div>
      </div>
    </footer>
  )
}

/* ─── Smooth scroll ─── */
function useSmoothScroll() {
  useEffect(() => {
    const handler = (e) => {
      const target = e.target.closest('a[href^="#"]')
      if (!target) return
      e.preventDefault()
      const el = document.querySelector(target.getAttribute('href'))
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])
}

/* ─── App ─── */
export default function App() {
  useSmoothScroll()

  return (
    <div className="app">
      <Navbar />
      <Hero />
      <IndustryTags />
      <HowItWorks />
      <Features />
      <Comparison />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}
