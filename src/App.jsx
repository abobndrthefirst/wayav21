import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import './styles.css'

/* ─── Supabase config ─── */
const SUPABASE_URL = 'https://unnheqshkxpbflozechm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubmhlcXNoa3hwYmZsb3plY2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTkwNjksImV4cCI6MjA5MDQzNTA2OX0.XHAbOOdPtuwD0pJErxhBw9C3RJPouPeUhMS9hSThON0'

async function submitLead({ contact, store_name, industry }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ contact, store_name, industry }),
  })
  return res.ok
}

/* ─── i18n content ─── */
const content = {
  ar: {
    nav: { cta: 'ابدأ مجاناً', pricing: 'الأسعار', features: 'المميزات', how: 'كيف يعمل' },
    hero: {
      title1: 'عميلك اللي يرجع',
      title2: 'يسوى أكثر من عشرة جدد',
      subtitle: 'وايا يحوّل زيارة وحدة إلى علاقة طويلة. برنامج ولاء جاهز، يشتغل من أول يوم — بدون تطبيق، بدون تعقيد، وبدون ما تحتاج فريق تقني.',
      freeTrial: 'اول أسبوعين مجاناً — بدون أي التزام — جربها بنفسك',
      inputPlaceholder: 'إيميلك أو رقم جوالك',
      storeNamePlaceholder: 'اسم متجرك',
      industryPlaceholder: 'نوع النشاط',
      industries: ['مطعم', 'كافيه', 'صالون', 'مغسلة', 'حلويات', 'بقالة', 'ملابس', 'أخرى'],
      btn: 'ابدأ تجربتك المجانية',
      whatsapp: 'تواصل معنا عبر واتساب',
      successMsg: 'تم التسجيل بنجاح! بنتواصل معك قريباً',
      errorMsg: 'يرجى تعبئة جميع الحقول',
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
        { icon: 'bell', title: 'إشعارات ذكية', desc: 'إشعار في الوقت الصح يذكّر عميلك يرجع — بدون إزعاج.' },
        { icon: 'chart', title: 'تحليلات واضحة ومفهومة', desc: 'اعرف مين عميلك الدائم، أي مكافأة تشتغل، ومتى يبدأ العميل يبتعد.' },
        { icon: 'share', title: 'حلقة إحالة مدمجة', desc: 'عميلك يشارك، صديقه يسجّل، والاثنين يكسبون. نمو عضوي بدون ميزانية.' },
        { icon: 'calendar', title: 'حملات المواسم جاهزة', desc: 'رمضان، العيد، اليوم الوطني — قوالب جاهزة تفعّلها بضغطة واحدة.' },
      ],
    },
    demo: {
      badge: 'شوف بنفسك',
      title: 'جولة سريعة داخل وايا',
      subtitle: 'من لوحة التحكم إلى تجربة العميل — كل شي واضح وبسيط.',
      steps: [
        { label: 'سجّل متجرك', desc: 'اختر نوع نشاطك، ارفع شعارك، وحدد المكافآت. جاهز خلال دقائق.' },
        { label: 'شارك الكود', desc: 'اطبع QR أو شاركه رقمياً. العميل يمسح ويبدأ يجمع نقاط بدون تطبيق.' },
        { label: 'تابع النتائج', desc: 'شوف مين رجع، مين قرب من مكافأة، ومين يحتاج إشعار تذكيري.' },
        { label: 'كافئ وكرر', desc: 'المكافأة توصل تلقائياً، والعميل يرجع. حلقة ولاء ما توقف.' },
      ],
      dashboardTitle: 'لوحة تحكم وايا',
      metrics: [
        { icon: 'users', value: '١,٢٤٧', label: 'عميل نشط', trend: '+١٢٪' },
        { icon: 'repeat', value: '٦٧٪', label: 'زيارات متكررة', trend: '+٨٪' },
        { icon: 'gift', value: '٣,٨٩١', label: 'مكافأة مرسلة', trend: '+٣٤٪' },
        { icon: 'sar', value: '١٤.٢ك', label: 'إيرادات إضافية', trend: '+٢٢٪' },
      ],
      customerJourney: 'رحلة العميل',
      journeySteps: ['يمسح QR', 'يجمع نقاط', 'يوصله إشعار', 'يرجع ويستلم مكافأة'],
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
        'إشعارات ذكية للعملاء',
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
      freeTrial: 'First 2 weeks free — no commitment at all — try it yourself',
      inputPlaceholder: 'Your email or phone number',
      storeNamePlaceholder: 'Your store name',
      industryPlaceholder: 'Industry',
      industries: ['Restaurant', 'Café', 'Salon', 'Laundry', 'Bakery', 'Grocery', 'Clothing', 'Other'],
      btn: 'Start Your Free Trial',
      whatsapp: 'Contact us on WhatsApp',
      successMsg: 'Registered successfully! We\'ll be in touch soon',
      errorMsg: 'Please fill in all fields',
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
        { icon: 'bell', title: 'Smart Notifications', desc: 'The right notification at the right time reminds your customer to come back.' },
        { icon: 'chart', title: 'Clear & Simple Analytics', desc: 'Know your regulars, which rewards work, and when a customer starts drifting away.' },
        { icon: 'share', title: 'Built-in Referral Loop', desc: 'Your customer shares, their friend signs up, both earn. Organic growth, zero budget.' },
        { icon: 'calendar', title: 'Seasonal Campaigns Ready', desc: 'Ramadan, Eid, National Day — ready-made templates you activate with one click.' },
      ],
    },
    demo: {
      badge: 'See It In Action',
      title: 'A Quick Tour Inside Waya',
      subtitle: 'From your dashboard to the customer experience — everything is clear and simple.',
      steps: [
        { label: 'Register your store', desc: 'Choose your business type, upload your logo, and set rewards. Ready in minutes.' },
        { label: 'Share the code', desc: 'Print the QR or share it digitally. Customers scan and start earning — no app needed.' },
        { label: 'Track results', desc: 'See who returned, who is close to a reward, and who needs a reminder notification.' },
        { label: 'Reward & repeat', desc: 'Rewards are delivered automatically, and customers come back. A loyalty loop that never stops.' },
      ],
      dashboardTitle: 'Waya Dashboard',
      metrics: [
        { icon: 'users', value: '1,247', label: 'Active Customers', trend: '+12%' },
        { icon: 'repeat', value: '67%', label: 'Repeat Visits', trend: '+8%' },
        { icon: 'gift', value: '3,891', label: 'Rewards Sent', trend: '+34%' },
        { icon: 'sar', value: '14.2K', label: 'Added Revenue', trend: '+22%' },
      ],
      customerJourney: 'Customer Journey',
      journeySteps: ['Scans QR', 'Earns Points', 'Gets Notified', 'Returns & Redeems'],
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
        'Smart customer notifications',
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

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

const featureIcons = { bell: <BellIcon />, chart: <ChartIcon />, share: <ShareIcon />, calendar: <CalendarIcon /> }

/* ─── Navbar ─── */
function Navbar({ lang, setLang, theme, setTheme, t }) {
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
        <div className="nav-logo">
          <Logo size={34} />
          <span className="nav-logo-text">وايا</span>
        </div>
        <div className="nav-links">
          <a href="#how">{t.nav.how}</a>
          <a href="#features">{t.nav.features}</a>
          <a href="#pricing">{t.nav.pricing}</a>
        </div>
        <div className="nav-left-group">
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="lang-toggle" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <GlobeIcon />
            <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
          <a href="#cta" className="nav-cta">{t.nav.cta}</a>
        </div>
      </div>
    </motion.nav>
  )
}

/* ─── Signup Form (shared between Hero and CTA) ─── */
function SignupForm({ t, id }) {
  const [contact, setContact] = useState('')
  const [storeName, setStoreName] = useState('')
  const [industry, setIndustry] = useState('')
  const [status, setStatus] = useState(null) // null | 'sending' | 'success' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!contact.trim() || !storeName.trim() || !industry) {
      setStatus('error')
      setTimeout(() => setStatus(null), 3000)
      return
    }
    setStatus('sending')
    const ok = await submitLead({ contact: contact.trim(), store_name: storeName.trim(), industry })
    if (ok) {
      setStatus('success')
      setContact('')
      setStoreName('')
      setIndustry('')
    } else {
      setStatus('error')
      setTimeout(() => setStatus(null), 3000)
    }
  }

  return (
    <form className="hero-form" id={id} onSubmit={handleSubmit}>
      <div className="hero-input-wrap">
        <input type="text" placeholder={t.hero.inputPlaceholder} className="hero-input" value={contact} onChange={(e) => setContact(e.target.value)} />
      </div>
      <div className="hero-input-wrap">
        <input type="text" placeholder={t.hero.storeNamePlaceholder} className="hero-input" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
      </div>
      <div className="hero-input-wrap">
        <select className="hero-input hero-select" value={industry} onChange={(e) => setIndustry(e.target.value)}>
          <option value="" disabled>{t.hero.industryPlaceholder}</option>
          {t.hero.industries.map((ind, i) => (
            <option key={i} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {status === 'success' ? (
        <motion.div className="form-success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M16.5 5.5L7.5 14.5L3.5 10.5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>{t.hero.successMsg}</span>
        </motion.div>
      ) : (
        <>
          <button type="submit" className="hero-btn" disabled={status === 'sending'}>
            {status === 'sending' ? '...' : t.hero.btn}
          </button>
          {status === 'error' && (
            <motion.p className="form-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{t.hero.errorMsg}</motion.p>
          )}
        </>
      )}

      <a href="https://wa.me/966509076104" target="_blank" rel="noopener noreferrer" className="hero-whatsapp-btn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        <span>{t.hero.whatsapp}</span>
      </a>
    </form>
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
          <Reveal delay={0.25}>
            <div className="hero-free-badge">{t.hero.freeTrial}</div>
          </Reveal>
          <Reveal delay={0.3}>
            <SignupForm t={t} id="hero-signup" />
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

/* ─── Product Demo / Showcase ─── */
function DemoMetricIcon({ type }) {
  if (type === 'users') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )
  if (type === 'repeat') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
  )
  if (type === 'gift') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
  )
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  )
}

function ProductDemo({ t }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % t.demo.steps.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [t.demo.steps.length])

  return (
    <section className="section demo-section" id="demo">
      <Reveal>
        <div className="section-badge">{t.demo.badge}</div>
        <h2 className="section-title">{t.demo.title}</h2>
        <p className="section-subtitle">{t.demo.subtitle}</p>
      </Reveal>

      <div className="demo-layout">
        {/* Interactive Steps */}
        <Reveal delay={0.1} direction="right">
          <div className="demo-steps-panel">
            {t.demo.steps.map((step, i) => (
              <motion.div
                key={i}
                className={`demo-step ${activeStep === i ? 'demo-step-active' : ''}`}
                onClick={() => setActiveStep(i)}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="demo-step-num">{i + 1}</div>
                <div className="demo-step-content">
                  <h4 className="demo-step-label">{step.label}</h4>
                  <AnimatePresence mode="wait">
                    {activeStep === i && (
                      <motion.p
                        className="demo-step-desc"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {step.desc}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                {activeStep === i && <motion.div className="demo-step-bar" layoutId="demoBar" />}
              </motion.div>
            ))}
          </div>
        </Reveal>

        {/* Dashboard Preview */}
        <Reveal delay={0.2} direction="left">
          <div className="demo-preview">
            <div className="demo-preview-header">
              <div className="demo-preview-dots">
                <span /><span /><span />
              </div>
              <span className="demo-preview-title">{t.demo.dashboardTitle}</span>
            </div>

            <div className="demo-metrics-grid">
              {t.demo.metrics.map((metric, i) => (
                <motion.div
                  key={i}
                  className="demo-metric-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <div className="demo-metric-icon">
                    <DemoMetricIcon type={metric.icon} />
                  </div>
                  <span className="demo-metric-value">{metric.value}</span>
                  <span className="demo-metric-label">{metric.label}</span>
                  <span className="demo-metric-trend">{metric.trend}</span>
                </motion.div>
              ))}
            </div>

            {/* Customer Journey Flow */}
            <div className="demo-journey">
              <span className="demo-journey-title">{t.demo.customerJourney}</span>
              <div className="demo-journey-flow">
                {t.demo.journeySteps.map((step, i) => (
                  <motion.div
                    key={i}
                    className="demo-journey-step"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                  >
                    <span className="demo-journey-num">{i + 1}</span>
                    <span className="demo-journey-label">{step}</span>
                    {i < t.demo.journeySteps.length - 1 && (
                      <svg className="demo-journey-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5"><polyline points="9 18 15 12 9 6"/></svg>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
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

        <Reveal delay={0.2} direction="left">
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
            <a href="#cta" className="pricing-cta-link">
              <motion.button className="pricing-cta" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {t.pricing.cta}
              </motion.button>
            </a>
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
            <a href="#cta" className="pricing-cta-link">
              <motion.button className="pricing-cta" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {t.pricing.cta}
              </motion.button>
            </a>
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
      <Reveal delay={0.2}>
        <div className="hero-free-badge" style={{ marginBottom: 16 }}>{t.hero.freeTrial}</div>
      </Reveal>
      <Reveal delay={0.3}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <SignupForm t={t} id="cta-signup" />
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
        <div className="footer-logo">
          <Logo size={28} />
          <span className="nav-logo-text">وايا</span>
        </div>
        <div className="footer-links">
          <a href="#">{t.footer.links.privacy}</a>
          <a href="#">{t.footer.links.terms}</a>
        </div>
        <p className="footer-copy">{t.footer.copy}</p>
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
  const [theme, setTheme] = useState('dark')
  const t = content[lang]

  useSmoothScroll()

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className={`app ${lang === 'en' ? 'ltr-mode' : ''}`}>
      <Navbar lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />
      <Hero t={t} />
      <StatsBar t={t} />
      <HowItWorks t={t} />
      <Features t={t} />
      <ProductDemo t={t} />
      <WalletCards t={t} />
      <Comparison t={t} />
      <SocialProof t={t} />
      <Pricing t={t} />
      <CTA t={t} />
      <Footer t={t} />
    </div>
  )
}
