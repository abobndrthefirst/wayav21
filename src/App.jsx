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

/* ─── Logo SVG ─── */
function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size * 0.67} viewBox="0 0 81 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_f_logo)">
        <path d="M60.3354 43.9013H47.1469C44.8562 43.9013 43 42.045 43 39.7543V22.3071C43 21.3487 43.3323 20.4222 43.9361 19.681L50.5303 11.6203C52.1884 9.59156 55.2907 9.59156 56.9488 11.6203L63.543 19.681C64.15 20.4222 64.4791 21.3487 64.4791 22.3071V39.7543C64.4791 42.045 62.6229 43.9013 60.3322 43.9013H60.3354Z" fill="url(#paint0_linear_logo)"/>
      </g>
      <defs>
        <filter id="filter0_f_logo" x="0" y="-32.9013" width="107.479" height="119.803" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feGaussianBlur stdDeviation="21.5" result="effect1_foregroundBlur"/>
        </filter>
        <linearGradient id="paint0_linear_logo" x1="53.7411" y1="45.2623" x2="53.7411" y2="11.6363" gradientUnits="userSpaceOnUse">
          <stop stopColor="#559D36"/>
          <stop offset="0.52" stopColor="#39B139"/>
          <stop offset="1" stopColor="#35A977"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ─── Icons ─── */
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M16.5 5.5L7.5 14.5L3.5 10.5" stroke="#00FFA9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M15 5L5 15M5 5L15 15" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function StoreIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00FFA9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function QRIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00FFA9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00FFA9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00FFA9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00FFA9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00FFA9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00FFA9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

/* ─── Navbar ─── */
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
      <div className="nav-content">
        <div className="nav-logo">
          <Logo size={48} />
          <span className="nav-logo-text">وايا</span>
        </div>
        <div className="nav-links">
          <a href="#how">كيف يعمل</a>
          <a href="#features">المميزات</a>
          <a href="#pricing">الأسعار</a>
        </div>
        <a href="#cta" className="nav-cta">انضم</a>
      </div>
    </motion.nav>
  )
}

/* ─── Hero ─── */
function Hero() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 0.3], [0, -80])
  const opacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])

  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="hero-glow-2" />

      <motion.div className="hero-content" style={{ y, opacity }}>
        <Reveal>
          <h1 className="hero-title">
            <span className="text-white">برامج ولاء تشتغل </span>
            <span className="text-green">بسهولة</span>
          </h1>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="hero-subtitle">
            حوّل عملائك إلى ضيوف دائمين. منصة الموقد تمنحك الأدوات الدافئة
            <br />
            لبناء علاقات تدوم، دون تعقيدات تقنية.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="hero-input-group">
            <input type="text" placeholder="إيميلك أو رقم واتسابك" className="hero-input" />
            <button className="hero-btn">اشترك عبر الواتس اب</button>
          </div>
        </Reveal>

        <Reveal delay={0.45}>
          <div className="hero-stats">
            <div className="hero-stat-badge">
              <span className="stat-number">+٤٧٧</span>
              <span className="stat-label">محل مسجّل</span>
            </div>
          </div>
        </Reveal>
      </motion.div>

      <Reveal delay={0.2} className="hero-image-wrapper">
        <motion.img
          src="/hero.png"
          alt="وايا"
          className="hero-image"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </Reveal>

      <Reveal delay={0.6}>
        <div className="industry-tags">
          {['حلويات', 'مغاسل', 'صالونات'].map((tag, i) => (
            <motion.span
              key={i}
              className="tag"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,255,169,0.15)' }}
              transition={{ duration: 0.2 }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </Reveal>
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
        <h2 className="section-title">ثلاث خطوات بس</h2>
        <p className="section-subtitle">بساطة التصميم، روعة النتائج.</p>
      </Reveal>

      <div className="steps-grid">
        {steps.map((step, i) => (
          <Reveal key={i} delay={i * 0.15}>
            <motion.div
              className="step-card"
              whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(0,255,169,0.08)' }}
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
              whileHover={{ y: -6, backgroundColor: 'rgba(255,255,255,0.06)' }}
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
    <section className="section">
      <Reveal>
        <p className="section-tag">ليش التجار يتحولون</p>
        <h2 className="section-title">ماذا لو برامج الولاء ما كانت بس للكبار؟</h2>
      </Reveal>

      <div className="comparison-grid">
        <Reveal delay={0.1} direction="right">
          <div className="comparison-card comparison-without">
            <h3 className="comparison-heading">بدون نظام الولاء</h3>
            <ul className="comparison-list">
              {withoutItems.map((item, i) => (
                <li key={i}><XIcon /> <span>{item}</span></li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.2} direction="left">
          <div className="comparison-card comparison-with">
            <h3 className="comparison-heading comparison-heading-green">مع نظام الولاء</h3>
            <ul className="comparison-list">
              {withItems.map((item, i) => (
                <li key={i}><CheckIcon /> <span>{item}</span></li>
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
        <p className="section-tag">الاسعار</p>
        <h2 className="section-title">خطة بسيطة، بدون تعقيد</h2>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="pricing-toggle">
          <button className={`toggle-btn ${!annual ? 'active' : ''}`} onClick={() => setAnnual(false)}>
            الخطة الشهرية
          </button>
          <button className={`toggle-btn ${annual ? 'active' : ''}`} onClick={() => setAnnual(true)}>
            <span>الخطة السنوية</span>
            <span className="save-badge">الأكثر توفيراً</span>
          </button>
        </div>
      </Reveal>

      <Reveal delay={0.3}>
        <motion.div className="pricing-card" layout transition={{ duration: 0.4 }}>
          <div className="pricing-card-inner">
            <div className="pricing-amount">
              <motion.span
                className="price"
                key={annual ? 'annual' : 'monthly'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {annual ? '٥٥' : '٧٥'}
              </motion.span>
              <span className="price-label">ر.س / شهر</span>
            </div>

            {annual ? (
              <p className="price-note">يُفوتر ١،٤٢٨ ر.س سنوياً — توفير ٣٥٨ ر.س</p>
            ) : (
              <p className="price-note">بدون التزام — الغي بأي وقت</p>
            )}

            <ul className="pricing-features">
              {planFeatures.map((f, i) => (
                <li key={i}><CheckIcon /> <span>{f}</span></li>
              ))}
            </ul>

            <motion.button className="pricing-cta" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              ابدأ الآن
            </motion.button>
          </div>
        </motion.div>
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
        <div className="hero-input-group" style={{ justifyContent: 'center' }}>
          <input type="text" placeholder="إيميلك أو رقم واتسابك" className="hero-input" />
          <motion.button className="hero-btn" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
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
        <div className="footer-logo">
          <Logo size={36} />
          <span className="nav-logo-text">وايا</span>
        </div>
        <p className="footer-copy">٢٠٢٦ وايا.</p>
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
      <HowItWorks />
      <Features />
      <Comparison />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}
