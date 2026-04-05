import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import './styles.css'

/* ─── i18n content ─── */
const content = {
  ar: {
    nav: { cta: 'ابدأ مجاناً', pricing: 'الأسعار', features: 'المميزات', how: 'كيف يعمل' },
    hero: {
      title1: 'عميلك اللي يرجع',
      title2: 'يسوى أكثر من عشرة جدد',
      subtitle: 'وايا يحوّل زيارة وحدة إلى علاقة طويلة. برنامج ولاء جاهز، يشتغل من أول يوم — بدون تطبيق، بدون تعقيد، وبدون ما تحتاج فريق تقني.',
      inputPlaceholder: 'إيميلك أو رقم واتسابك',
      btn: 'ابدأ تجربتك المجانية',
    },
    stats: [
      { value: '٥–٢٥x', label: 'تكلفة اكتساب العميل الجديد مقارنة بالاحتفاظ بالحالي' },
      { value: '+١٨٪', label: 'زيادة في الإنفاق من العملاء المسجّلين ببرامج ولاء' },
      { value: '٦٠–٧٠٪', label: 'احتمال الشراء من عميل حالي، مقابل ٥–٢٠٪ من عميل جديد' },
      { value: '٤.٨x', label: 'إنفاق أعلى من العملاء اللي يحسّون بارتباط عاطفي بالعلامة' },
    ],
    how: {
      badge: 'كيف يعمل',
      title: 'ثلاث خطوات. بدون تطبيق. بدون انتظار.',
      subtitle: 'جاهز يشتغل من أول يوم — عميلك يمسح، يجمع، ويرجع.',
      steps: [
        { title: 'سجّل متجرك', desc: 'اختر نوع البرنامج، خصّص الهوية، وحدد المكافآت. كل شي جاهز خلال دقائق.' },
        { title: 'العميل يمسح الكود', desc: 'بدون تحميل تطبيق. العميل يمسح QR من طاولته أو الكاونتر ويبدأ يجمع نقاط فوراً.' },
        { title: 'تابع وكافئ', desc: 'شوف مين رجع، مين قرب من المكافأة، ومين يحتاج دفعة بسيطة — كله من لوحة تحكم وحدة.' },
      ],
    },
    features: {
      title: 'كل اللي تحتاجه. ولا شي زيادة.',
      subtitle: 'أدوات مصممة تخلّي عميلك يرجع — بدون ما تعقّد شغلك.',
      dashboard: 'لوحة تحكم نظام الولاء',
      dashStats: [
        { label: 'ارتفاع الإيرادات', value: '١٤.٢ك ر.س', change: '+٢٢%' },
        { label: 'زيارات متكررة', value: '٦٧%', change: '+٨%' },
        { label: 'مكافآت مرسلة', value: '٣,٨٩١', change: '+٣٤%' },
        { label: 'عملاء نشطين', value: '١,٢٤٧', change: '+١٢%' },
      ],
      items: [
        { icon: 'bell', title: 'تنبيهات ذكية عبر واتساب', desc: 'رسالة في الوقت الصح تذكّر عميلك يرجع. واتساب — لأن الكل يفتحه.' },
        { icon: 'chart', title: 'تحليلات واضحة ومفهومة', desc: 'اعرف مين عميلك الدائم، أي مكافأة تشتغل، ومتى يبدأ العميل يبتعد.' },
        { icon: 'share', title: 'حلقة إحالة مدمجة', desc: 'عميلك يشارك، صديقه يسجّل، والاثنين يكسبون. نمو عضوي بدون ميزانية.' },
        { icon: 'calendar', title: 'حملات المواسم جاهزة', desc: 'رمضان، العيد، اليوم الوطني — قوالب جاهزة تفعّلها بضغطة واحدة.' },
      ],
    },
    walletCards: {
      title: 'بطاقات ولاء رقمية بتصميمك',
      subtitle: 'كل بطاقة تعكس هوية متجرك — قهوة، صالون، أو أي نشاط.',
    },
    comparison: {
      badge: 'ليش وايا؟',
      title: 'ماذا لو برامج الولاء ما كانت بس للكبار؟',
      without: {
        header: 'بدون وايا',
        items: [
          'تصرف على إعلانات وما تدري مين رجع',
          'عميلك يروح للسلسلة لأنها تكافئه',
          'ما تعرف مين عميل دائم ومين زار مرة وحدة',
          'تحتاج مبرمج أو وقت طويل عشان تبني شي',
          'المواسم تعدي عليك وأنت مشغول',
          'كل عميل يمشي بدون ما تقدر ترجعه',
        ],
      },
      with: {
        header: 'مع وايا',
        items: [
          'عملاءك يرجعون — لأن في سبب يرجعون له',
          'تنافس السلاسل بنظام ولاء بمستواهم',
          'تعرف كل عميل بالاسم، وبعادته',
          'تطلق برنامجك بدقائق — بدون سطر كود',
          'حملات رمضان والعيد جاهزة بضغطة',
          'تقدر تتواصل مع عميلك قبل ما يختفي',
        ],
      },
    },
    socialProof: {
      title: 'أرقام تتكلم',
      subtitle: 'من أول شهر، التجار شافوا الفرق.',
      items: [
        { value: '+٤٧٧', label: 'محل مسجّل', desc: 'تجار اختاروا وايا لإدارة ولاء عملائهم' },
        { value: '+٣٢٪', label: 'زيادة في الزيارات المتكررة', desc: 'عملاء يرجعون أكثر بعد تفعيل البرنامج' },
        { value: '+١٨٪', label: 'ارتفاع في متوسط الفاتورة', desc: 'إنفاق أعلى من العملاء المكافَئين' },
      ],
    },
    pricing: {
      badge: 'الأسعار',
      title: 'سعر واضح. بدون مفاجآت. وعائد تحسبه.',
      monthly: {
        label: 'الخطة الشهرية',
        price: '٧٥',
        unit: 'ر.س / شهر',
        note: 'بدون التزام — الغي بأي وقت',
      },
      annual: {
        label: 'الخطة السنوية',
        badge: 'الأكثر توفيراً',
        price: '٥٥',
        unit: 'ر.س / شهر',
        note: 'يُفوتر ١،٤٢٨ ر.س سنوياً — توفير ٣٥٨ ر.س',
      },
      features: [
        'حملات غير محدودة',
        'توصيل واتساب و SMS',
        'لوحة تحكم كاملة',
        'تحليلات وتقارير',
        'حلقة إحالة مدمجة',
        'قوالب رمضان والعيد',
        'دعم فني عربي',
      ],
      cta: 'ابدأ الآن',
    },
    cta: {
      title: 'عميلك القادم ممكن يكون آخر زيارة — أو أول علاقة.',
      subtitle: 'ابدأ مجاناً. بدون بطاقة. بدون التزام. وشوف الفرق من أول أسبوع.',
      btn: 'ابدأ تجربتك المجانية',
    },
    footer: {
      copy: '٢٠٢٦ وايا.',
      links: { privacy: 'الخصوصية', terms: 'الشروط' },
    },
  },
  en: {
    nav: { cta: 'Start Free', pricing: 'Pricing', features: 'Features', how: 'How It Works' },
    hero: {
      title1: 'A returning customer',
      title2: 'is worth more than ten new ones',
      subtitle: 'Waya turns a single visit into a lasting relationship. A ready-made loyalty program that works from day one — no app, no complexity, and no tech team needed.',
      inputPlaceholder: 'Email or WhatsApp number',
      btn: 'Start Your Free Trial',
    },
    stats: [
      { value: '5–25x', label: 'Cost of acquiring a new customer vs. retaining an existing one' },
      { value: '+18%', label: 'Increase in spending from loyalty program members' },
      { value: '60–70%', label: 'Purchase probability from existing customer vs. 5-20% from new' },
      { value: '4.8x', label: 'Higher spending from emotionally connected customers' },
    ],
    how: {
      badge: 'How It Works',
      title: 'Three steps. No app. No waiting.',
      subtitle: 'Ready from day one — your customer scans, collects, and returns.',
      steps: [
        { title: 'Register your store', desc: 'Choose your program type, customize the branding, and set your rewards. Everything is ready in minutes.' },
        { title: 'Customer scans the code', desc: 'No app download needed. Customer scans a QR from the table or counter and starts collecting points instantly.' },
        { title: 'Track & reward', desc: 'See who returned, who\'s close to a reward, and who needs a gentle nudge — all from one dashboard.' },
      ],
    },
    features: {
      title: 'Everything you need. Nothing you don\'t.',
      subtitle: 'Tools designed to bring your customers back — without complicating your work.',
      dashboard: 'Loyalty System Dashboard',
      dashStats: [
        { label: 'Revenue Growth', value: '14.2K SAR', change: '+22%' },
        { label: 'Repeat Visits', value: '67%', change: '+8%' },
        { label: 'Rewards Sent', value: '3,891', change: '+34%' },
        { label: 'Active Customers', value: '1,247', change: '+12%' },
      ],
      items: [
        { icon: 'bell', title: 'Smart WhatsApp Alerts', desc: 'The right message at the right time reminds your customer to come back.' },
        { icon: 'chart', title: 'Clear & Simple Analytics', desc: 'Know your regulars, which rewards work, and when a customer starts drifting away.' },
        { icon: 'share', title: 'Built-in Referral Loop', desc: 'Your customer shares, their friend signs up, both earn. Organic growth, zero budget.' },
        { icon: 'calendar', title: 'Seasonal Campaigns Ready', desc: 'Ramadan, Eid, National Day — ready-made templates you activate with one click.' },
      ],
    },
    walletCards: {
      title: 'Digital loyalty cards with your branding',
      subtitle: 'Each card reflects your store identity — coffee, salon, or any business.',
    },
    comparison: {
      badge: 'Why Waya?',
      title: 'What if loyalty programs weren\'t just for the big chains?',
      without: {
        header: 'Without Waya',
        items: [
          'Spend on ads without knowing who came back',
          'Customers leave for chains that reward them',
          'Can\'t tell a regular from a one-time visitor',
          'Need a developer or months to build something',
          'Seasons pass while you\'re too busy',
          'Every customer walks away and you can\'t bring them back',
        ],
      },
      with: {
        header: 'With Waya',
        items: [
          'Customers return — because they have a reason to',
          'Compete with chains using a loyalty system at their level',
          'Know every customer by name and habit',
          'Launch your program in minutes — no code needed',
          'Ramadan & Eid campaigns ready with one click',
          'Reach your customer before they disappear',
        ],
      },
    },
    socialProof: {
      title: 'Numbers that speak',
      subtitle: 'From the first month, merchants saw the difference.',
      items: [
        { value: '+477', label: 'Registered stores', desc: 'Merchants who chose Waya to manage customer loyalty' },
        { value: '+32%', label: 'Increase in repeat visits', desc: 'Customers return more after activating the program' },
        { value: '+18%', label: 'Rise in average ticket', desc: 'Higher spending from rewarded customers' },
      ],
    },
    pricing: {
      badge: 'Pricing',
      title: 'Clear pricing. No surprises. Measurable ROI.',
      monthly: {
        label: 'Monthly Plan',
        price: '75',
        unit: 'SAR / month',
        note: 'No commitment — cancel anytime',
      },
      annual: {
        label: 'Annual Plan',
        badge: 'Best Value',
        price: '55',
        unit: 'SAR / month',
        note: 'Billed 1,428 SAR/year — save 358 SAR',
      },
      features: [
        'Unlimited campaigns',
        'WhatsApp & SMS delivery',
        'Full dashboard',
        'Analytics & reports',
        'Built-in referral loop',
        'Ramadan & Eid templates',
        'Arabic support team',
      ],
      cta: 'Start Now',
    },
    cta: {
      title: 'Your next customer could be the last visit — or the first relationship.',
      subtitle: 'Start free. No card. No commitment. See the difference from week one.',
      btn: 'Start Your Free Trial',
    },
    footer: {
      copy: '2026 Waya.',
      links: { privacy: 'Privacy', terms: 'Terms' },
    },
  },
}

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
      opacity: 1, y: 0, x: 0, scale: 1,
      transition: { duration: 0.9, delay, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  }

  return (
    <motion.div ref={ref} className={className} initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={variants}>
      {children}
    </motion.div>
  )
}

/* ─── Logo ─── */
function Logo({ size = 34 }) {
  return <img src="/logo.svg" alt="وايا" style={{ width: size, height: 'auto' }} />
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

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

const featureIcons = { bell: <BellIcon />, chart: <ChartIcon />, share: <ShareIcon />, calendar: <CalendarIcon /> }

/* ─── Navbar ─── */
function Navbar({ lang, setLang, t }) {
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
        <div className="nav-left-group">
          <a href="#cta" className="nav-cta">{t.nav.cta}</a>
          <button className="lang-toggle" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <GlobeIcon />
            <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
        </div>
        <div className="nav-links">
          <a href="#pricing">{t.nav.pricing}</a>
          <a href="#features">{t.nav.features}</a>
          <a href="#how">{t.nav.how}</a>
        </div>
        <div className="nav-logo">
          <span className="nav-logo-text">وايا</span>
          <Logo size={34} />
        </div>
      </div>
    </motion.nav>
  )
}

/* ─── Hero ─── */
function Hero({ t }) {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 0.3], [0, -60])
  const opacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])

  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="hero-glow-2" />

      <motion.div className="hero-inner" style={{ y, opacity }}>
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
            <motion.div className="floating-bubble floating-bubble-1" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <img src="/icon-monitoring.svg" alt="" width="24" height="24" />
            </motion.div>
            <motion.div className="floating-bubble floating-bubble-2" animate={{ y: [0, 8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
              <img src="/icon-favorite.svg" alt="" width="24" height="24" />
            </motion.div>
            <motion.div className="floating-bubble floating-bubble-3" animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
              <img src="/icon-leaderboard.svg" alt="" width="24" height="24" />
            </motion.div>
          </div>
        </Reveal>

        <div className="hero-text-side">
          <Reveal>
            <h1 className="hero-title">
              <span className="text-cream">{t.hero.title1} </span>
              <span className="text-green">{t.hero.title2}</span>
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="hero-subtitle">{t.hero.subtitle}</p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="hero-form">
              <div className="hero-input-wrap">
                <input type="text" placeholder={t.hero.inputPlaceholder} className="hero-input" />
              </div>
              <button className="hero-btn">{t.hero.btn}</button>
            </div>
          </Reveal>
        </div>
      </motion.div>
    </section>
  )
}

/* ─── Stats Bar ─── */
function StatsBar({ t }) {
  return (
    <section className="stats-bar-section">
      <div className="stats-bar-inner">
        {t.stats.map((stat, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <div className="stats-bar-item">
              <span className="stats-bar-value">{stat.value}</span>
              <span className="stats-bar-label">{stat.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── How It Works ─── */
function HowItWorks({ t }) {
  const stepIcons = [<StoreIcon key={0} />, <QRIcon key={1} />, <HeartIcon key={2} />]

  return (
    <section className="section" id="how">
      <Reveal>
        <div className="section-badge">{t.how.badge}</div>
        <h2 className="section-title">{t.how.title}</h2>
        <p className="section-subtitle">{t.how.subtitle}</p>
      </Reveal>

      <div className="steps-grid">
        {t.how.steps.map((step, i) => (
          <Reveal key={i} delay={i * 0.15}>
            <motion.div className="step-card" whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(16,185,129,0.06)' }} transition={{ duration: 0.3 }}>
              <div className="step-icon">{stepIcons[i]}</div>
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

/* ─── Features + Dashboard ─── */
function Features({ t }) {
  return (
    <section className="section" id="features">
      <Reveal>
        <h2 className="section-title">{t.features.title}</h2>
        <p className="section-subtitle">{t.features.subtitle}</p>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="dashboard-card">
          <div className="dashboard-header">
            <span className="dashboard-label">{t.features.dashboard}</span>
          </div>
          <div className="stats-grid">
            {t.features.dashStats.map((stat, i) => (
              <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}>
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
        {t.features.items.map((feat, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <motion.div className="feature-card" whileHover={{ y: -6 }} transition={{ duration: 0.3 }}>
              <div className="feature-icon">{featureIcons[feat.icon]}</div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── Wallet Cards Showcase ─── */
function WalletCards({ t }) {
  const cards = [
    { src: '/Apple Wallet Pass coffee.svg', alt: 'Coffee loyalty card' },
    { src: '/Apple Wallet Pass salon.svg', alt: 'Salon loyalty card' },
    { src: '/Apple Wallet Pass Kit Coupon.png', alt: 'Coupon card' },
  ]

  return (
    <section className="section wallet-section">
      <Reveal>
        <h2 className="section-title">{t.walletCards.title}</h2>
        <p className="section-subtitle">{t.walletCards.subtitle}</p>
      </Reveal>

      <div className="wallet-cards-row">
        {cards.map((card, i) => (
          <Reveal key={i} delay={i * 0.15}>
            <motion.div
              className="wallet-card-wrap"
              whileHover={{ y: -12, rotateY: 5, scale: 1.03 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <img src={card.src} alt={card.alt} className="wallet-card-img" />
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── Comparison ─── */
function Comparison({ t }) {
  return (
    <section className="section section-alt">
      <Reveal>
        <div className="section-badge">{t.comparison.badge}</div>
        <h2 className="section-title">{t.comparison.title}</h2>
      </Reveal>

      <div className="comparison-grid">
        <Reveal delay={0.1} direction="right">
          <div className="comparison-card comparison-without">
            <div className="comparison-header comparison-header-without">
              <h3>{t.comparison.without.header}</h3>
            </div>
            <ul className="comparison-list">
              {t.comparison.without.items.map((item, i) => (
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
              <h3>{t.comparison.with.header}</h3>
            </div>
            <ul className="comparison-list">
              {t.comparison.with.items.map((item, i) => (
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

/* ─── Social Proof ─── */
function SocialProof({ t }) {
  return (
    <section className="section social-proof-section">
      <Reveal>
        <h2 className="section-title">{t.socialProof.title}</h2>
        <p className="section-subtitle">{t.socialProof.subtitle}</p>
      </Reveal>

      <div className="social-proof-grid">
        {t.socialProof.items.map((item, i) => (
          <Reveal key={i} delay={i * 0.15}>
            <motion.div className="social-proof-card" whileHover={{ y: -6 }} transition={{ duration: 0.3 }}>
              <span className="social-proof-value">{item.value}</span>
              <span className="social-proof-label">{item.label}</span>
              <p className="social-proof-desc">{item.desc}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── Pricing ─── */
function Pricing({ t }) {
  const [annual, setAnnual] = useState(false)

  return (
    <section className="section" id="pricing">
      <Reveal>
        <div className="section-badge">{t.pricing.badge}</div>
        <h2 className="section-title">{t.pricing.title}</h2>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="pricing-cards">
          <motion.div className={`pricing-card ${!annual ? 'pricing-active' : ''}`} onClick={() => setAnnual(false)} whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
            <span className="pricing-plan-label">{t.pricing.monthly.label}</span>
            <div className="pricing-amount">
              <span className="price">{t.pricing.monthly.price}</span>
              <span className="price-label">{t.pricing.monthly.unit}</span>
            </div>
            <p className="price-note">{t.pricing.monthly.note}</p>
            <ul className="pricing-features">
              {t.pricing.features.map((f, i) => (
                <li key={i}><CheckIcon color="#10B981" /> <span>{f}</span></li>
              ))}
            </ul>
            <motion.button className="pricing-cta" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {t.pricing.cta}
            </motion.button>
          </motion.div>

          <motion.div className={`pricing-card ${annual ? 'pricing-active' : ''}`} onClick={() => setAnnual(true)} whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
            <div className="pricing-plan-label-row">
              <span className="pricing-plan-label">{t.pricing.annual.label}</span>
              <span className="save-badge">{t.pricing.annual.badge}</span>
            </div>
            <div className="pricing-amount">
              <span className="price">{t.pricing.annual.price}</span>
              <span className="price-label">{t.pricing.annual.unit}</span>
            </div>
            <p className="price-note">{t.pricing.annual.note}</p>
            <ul className="pricing-features">
              {t.pricing.features.map((f, i) => (
                <li key={i}><CheckIcon color="#10B981" /> <span>{f}</span></li>
              ))}
            </ul>
            <motion.button className="pricing-cta" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {t.pricing.cta}
            </motion.button>
          </motion.div>
        </div>
      </Reveal>
    </section>
  )
}

/* ─── CTA ─── */
function CTA({ t }) {
  return (
    <section className="cta-section" id="cta">
      <div className="cta-glow" />
      <Reveal>
        <h2 className="cta-title">{t.cta.title}</h2>
      </Reveal>
      <Reveal delay={0.15}>
        <p className="cta-subtitle">{t.cta.subtitle}</p>
      </Reveal>
      <Reveal delay={0.3}>
        <div className="hero-form" style={{ justifyContent: 'center', maxWidth: 520, margin: '0 auto' }}>
          <div className="hero-input-wrap">
            <input type="text" placeholder={t.hero.inputPlaceholder} className="hero-input" />
          </div>
          <motion.button className="hero-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            {t.cta.btn}
          </motion.button>
        </div>
      </Reveal>
    </section>
  )
}

/* ─── Footer ─── */
function Footer({ t }) {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-copy">{t.footer.copy}</p>
        <div className="footer-links">
          <a href="#">{t.footer.links.privacy}</a>
          <a href="#">{t.footer.links.terms}</a>
        </div>
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
  const [lang, setLang] = useState('ar')
  const t = content[lang]

  useSmoothScroll()

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  return (
    <div className={`app ${lang === 'en' ? 'ltr-mode' : ''}`}>
      <Navbar lang={lang} setLang={setLang} t={t} />
      <Hero t={t} />
      <StatsBar t={t} />
      <HowItWorks t={t} />
      <Features t={t} />
      <WalletCards t={t} />
      <Comparison t={t} />
      <SocialProof t={t} />
      <Pricing t={t} />
      <CTA t={t} />
      <Footer t={t} />
    </div>
  )
}
