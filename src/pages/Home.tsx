import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { navigate } from '../App';

/* ─── Assets ──────────────────────────────────────────────────────────────── */
const imgHero       = "/images/gemini-overlay.png";
const imgTicket     = "/images/ticket-logo.svg";
const imgShape      = "/images/shape.svg";
const imgShape1     = "/images/shape1.svg";
const imgShape2     = "/images/shape2.svg";
const imgContainer  = "/images/container.svg";
const imgContainer1 = "/images/container1.svg";
const imgContainer2 = "/images/container2.svg";
const imgEllipse    = "/images/ellipse.svg";
const imgEllipse1   = "/images/ellipse1.svg";
const imgEllipse2   = "/images/ellipse2.svg";
const imgShape3     = "/images/shape3.svg";

/* ─── Colors from Figma ───────────────────────────────────────────────────── */
const C = {
  green:    '#10BA83',   // rgb(0.06, 0.73, 0.51)
  bg:       '#12110f',
  bgCard:   '#1c1b18',
  bgDark:   '#0f0e0c',
  white:    '#fffbff',
  muted:    '#8a8a8a',
  subtle:   '#6e6a63',
  faint:    '#5a5752',
  cream:    '#f5f0e6',
  red:      '#f04545',   // rgb(0.94, 0.27, 0.27)
  coral:    '#fa856b',   // rgb(0.98, 0.52, 0.42) — step 2
  mint:     '#85d4a8',   // rgb(0.52, 0.83, 0.66) — step 3
  statBg:   '#2e2924',   // rgb(0.18, 0.16, 0.14)
  priceDk:  '#031410',   // rgb(0.01, 0.08, 0.06) — annual bg
  priceM:   '#1c1c17',   // rgb(0.11, 0.11, 0.09) — monthly bg
} as const;

/* Figma step icon background colors */
const stepIconBg = [
  `rgba(16,186,131,0.15)`,  // green
  `rgba(250,133,107,0.15)`, // coral
  `rgba(133,212,168,0.15)`, // mint
];
const stepIconBorder = [
  `rgba(16,186,131,0.25)`,
  `rgba(250,133,107,0.25)`,
  `rgba(133,212,168,0.25)`,
];

/* WhatsApp URL helper */
const waUrl = (input = '', lang = 'ar') => {
  const base = 'https://wa.me/966500000000';
  const msg = lang === 'ar'
    ? (input ? `السلام عليكم، أريد الانضمام إلى وايا. تواصلي: ${input}` : 'السلام عليكم، أريد الانضمام إلى وايا 🎉')
    : (input ? `Hello, I'd like to join Waya. Contact: ${input}` : "Hello, I'd like to join Waya! 🎉");
  return `${base}?text=${encodeURIComponent(msg)}`;
};

/* ─── Fonts ────────────────────────────────────────────────────────────────── */
const F = {
  heading:  "'Almarai', sans-serif",
  headingEN:"'Inter', sans-serif",
  body:     "'Cairo', sans-serif",
  bodyEN:   "'Inter', sans-serif",
  nav:      "'Roboto Slab', serif",
  number:   "'Inter', sans-serif",
} as const;

/* ─── Translations ─────────────────────────────────────────────────────────── */
type Lang = 'ar' | 'en';

const T = {
  ar: {
    dir: 'rtl' as const,
    fonts: { heading: F.heading, body: F.body, nav: F.nav },
    nav: {
      join: 'انضم مجاناً', pricing: 'الأسعار', features: 'المميزات',
      howItWorks: 'كيف يعمل', brand: 'وايا', toggle: 'EN',
      login: 'دخول', signup: 'سجّل', logout: 'خروج', hi: 'مرحباً',
    },
    hero: {
      h1a: 'برامج ولاء تشتغل ', h1b: 'بسهولة',
      sub: 'حوّل عملائك إلى ضيوف دائمين. وايا تمنحك الأدوات لبناء علاقات تدوم — دون تعقيدات تقنية.',
      placeholder: 'إيميلك أو رقم واتسابك', cta: 'اشترك عبر واتساب',
      trustNote: '✓ مجاناً للبدء  ·  ✓ إلغاء بأي وقت  ·  ✓ دعم عربي',
      liveBadge: '+٤٧٧ متجر مسجّل الآن',
    },
    industry: {
      count: '+٤٧٧', label: 'محل مسجّل',
      leftPills:  [{ label: 'حلويات 🍰', rot: -5 }, { label: 'مغاسل 🧴', rot: 3 }, { label: 'صالونات 💅', rot: -8 }],
      rightPills: [{ label: 'مطاعم 🍕', rot: 6 }, { label: 'قهوة ☕', rot: -4 }, { label: 'بقالة 🛒', rot: 7 }],
    },
    how: {
      pill: 'كيف يشتغل', h2: 'ثلاث خطوات بس', sub: 'بساطة التصميم، روعة النتائج.',
      steps: [
        { num: '٠١', title: 'سجل متجرك', desc: 'ابدأ في دقائق. أضف شعارك، هويتك، ونوع المكافآت التي تفضلها.' },
        { num: '٠٢', title: 'شارك الكود', desc: 'اطبع رمز الاستجابة السريعة وضعه على الطاولة. لا يحتاج العميل لتحميل تطبيق.' },
        { num: '٠٣', title: 'ابني الولاء', desc: 'شاهد عملائك يعودون مراراً وتكراراً للحصول على مكافآتهم.' },
      ],
    },
    feat: {
      pill: 'المميزات', h2: 'كل اللي تحتاجه. ولا شي زيادة.',
      dashTitle: 'مركز الولاء، على بعد شاشة واحدة', dashLabel: 'لوحة تحكم',
      stats: [
        { label: 'ارتفاع الإيرادات', value: '١٤.٢ك', unit: 'ر.س', change: '+٢٢%' },
        { label: 'زيارات متكررة', value: '٦٧', unit: '%', change: '+٨%' },
        { label: 'مكافآت مرسلة', value: '٣,٨٩١', unit: '', change: '+٣٤%' },
        { label: 'عملاء نشطين', value: '١,٢٤٧', unit: '', change: '+١٢%' },
      ],
      cards: [
        { title: 'تواصل مع عميلك في أي وقت', desc: 'وصّل عملائك وين ما كانوا. يشتغل مع أي جوال بدون تطبيق.' },
        { title: 'تحليلات مفهومة', desc: 'اعرف أي مكافأة تنجح وأي عميل بدأ يبتعد. بلغة بسيطة.' },
        { title: 'حلقة إحالة مدمجة', desc: 'العملاء يشاركون، أصدقائهم ينضمون، الكل يكسب. نمو تلقائي.' },
        { title: 'حملات رمضان والعيد', desc: 'قوالب جاهزة للمواسم. فعّلها بضغطة واحدة.' },
      ],
    },
    comp: {
      pill: 'ليش التجار يتحولون', h2: 'برامج الولاء ما عادت حكراً على الكبار',
      withoutTitle: 'بدون وايا', withTitle: 'مع وايا',
      withoutItems: [
        'إعلانات مكلفة ما تجيب نتائج', 'عملاؤك يروحون للسلاسل الكبيرة',
        'ما تعرف مين عميل دائم', 'أدوات تقنية معقدة ومربكة', 'تفوّت مواسم رمضان والعيد',
      ],
      withItems: [
        'عملاء يرجعون لك دائماً', 'نافس أي سلسلة بشروطك أنت',
        'تعرف كل عميل بالاسم وعاداته', 'أطلق في دقائق، بدون خبرة تقنية', 'حملات المواسم جاهزة في لحظة',
      ],
    },
    price: {
      pill: 'الأسعار', h2: 'ثلاث خطط تناسب حجم متجرك',
      sub: 'ادفع شهرياً أو وفّر ٢٠٪ بالدفع السنوي. ألغِ متى شئت.',
      toggleMonthly: 'شهري', toggleAnnual: 'سنوي — خصم ٢٠٪',
      unitMonth: 'ر.س / شهر', unitYear: 'ر.س / سنة',
      tiers: [
        {
          id: 'tier1', title: 'البداية', monthly: '٨٠', annual: '٧٦٨',
          features: ['برنامج ولاء واحد', 'حتى ٢٠٠ عميل', 'لوحة تحكم كاملة', 'دعم عبر البريد'],
        },
        {
          id: 'tier2', title: 'النمو', monthly: '١٥٠', annual: '١٬٤٤٠', badge: 'الأكثر شيوعاً',
          features: ['برامج ولاء غير محدودة', 'حتى ٢٬٠٠٠ عميل', 'معمل البطاقات (PassLab)', 'تحليلات متقدمة', 'دعم عبر واتساب'],
        },
        {
          id: 'tier3', title: 'الاحتراف', monthly: '٣٠٠', annual: '٢٬٨٨٠',
          features: ['كل مميزات خطة النمو', 'عملاء غير محدودين', 'حملات مخصصة للمواسم', 'API للمطورين', 'دعم مخصص وذو أولوية'],
        },
      ],
      saveLabel: 'وفّر ٢٠٪', cta: 'ابدأ الآن',
    },
    cta: {
      h2: 'مستعد تحوّل المشتري العابر إلى عميل دائم؟',
      sub: 'انضم لقائمة الانتظار اليوم. كن أول من يطلق برنامج ولائه قبل العيد.',
      placeholder: 'إيميلك أو رقم واتسابك', btn: 'اشترك عبر واتساب',
      note: '✓ مجاناً للبدء  ·  ✓ إلغاء بأي وقت',
    },
    footer: { copy: '٢٠٢٦ وايا. جميع الحقوق محفوظة.', brand: 'وايا' },
    stickyBtn: 'انضم مجاناً عبر واتساب',
  },
  en: {
    dir: 'ltr' as const,
    fonts: { heading: F.headingEN, body: F.bodyEN, nav: F.nav },
    nav: {
      join: 'Join Free', pricing: 'Pricing', features: 'Features',
      howItWorks: 'How It Works', brand: 'Waya', toggle: 'عربي',
      login: 'Log In', signup: 'Sign Up', logout: 'Log Out', hi: 'Hi',
    },
    hero: {
      h1a: 'Loyalty programs that ', h1b: 'just work',
      sub: 'Turn your customers into regulars. Waya gives you the tools to build lasting relationships — without the tech headache.',
      placeholder: 'Your email or WhatsApp number', cta: 'Join via WhatsApp',
      trustNote: '✓ Free to start  ·  ✓ Cancel anytime  ·  ✓ Arabic support',
      liveBadge: '+477 shops live now',
    },
    industry: {
      count: '+477', label: 'registered shops',
      leftPills:  [{ label: 'Sweets 🍰', rot: -5 }, { label: 'Laundry 🧴', rot: 3 }, { label: 'Salons 💅', rot: -8 }],
      rightPills: [{ label: 'Restaurants 🍕', rot: 6 }, { label: 'Cafes ☕', rot: -4 }, { label: 'Groceries 🛒', rot: 7 }],
    },
    how: {
      pill: 'How It Works', h2: 'Three simple steps', sub: 'Simple to start, powerful in results.',
      steps: [
        { num: '01', title: 'Register your shop', desc: 'Get started in minutes. Add your logo, brand colors, and reward type.' },
        { num: '02', title: 'Share the QR code', desc: 'Print your QR code and place it on the table. No app download needed.' },
        { num: '03', title: 'Build loyalty', desc: 'Watch your customers return again and again to collect their rewards.' },
      ],
    },
    feat: {
      pill: 'Features', h2: "Everything you need. Nothing you don't.",
      dashTitle: 'Your loyalty hub, one screen away', dashLabel: 'Dashboard',
      stats: [
        { label: 'Revenue Growth', value: '14.2K', unit: 'SAR', change: '+22%' },
        { label: 'Repeat Visits', value: '67', unit: '%', change: '+8%' },
        { label: 'Rewards Sent', value: '3,891', unit: '', change: '+34%' },
        { label: 'Active Customers', value: '1,247', unit: '', change: '+12%' },
      ],
      cards: [
        { title: 'Reach customers anytime', desc: 'Stay connected wherever they are. Works with any phone, no app needed.' },
        { title: 'Insights in plain English', desc: "Know which rewards work and who's drifting away — no data degree required." },
        { title: 'Built-in referral loop', desc: 'Customers share, friends join, everyone wins. Growth on autopilot.' },
        { title: 'Ramadan & Eid campaigns', desc: 'Ready-made seasonal templates. Activate in one tap.' },
      ],
    },
    comp: {
      pill: 'Why merchants switch', h2: 'Loyalty programs, finally built for small businesses',
      withoutTitle: 'Without Waya', withTitle: 'With Waya',
      withoutItems: [
        'Spending on ads that don\'t convert', 'Customers going to big chains instead',
        'No idea who your regulars are', 'Tech tools that feel impossibly complex', 'Missing Ramadan and Eid seasons',
      ],
      withItems: [
        'Customers who keep coming back', 'Compete with any chain on your terms',
        'Know every customer by name and habit', 'Launch in minutes, zero tech skills', 'Seasonal campaigns ready in seconds',
      ],
    },
    price: {
      pill: 'Pricing', h2: 'Three plans, sized to your shop',
      sub: 'Pay monthly or save 20% with annual billing. Cancel anytime.',
      toggleMonthly: 'Monthly', toggleAnnual: 'Annual — save 20%',
      unitMonth: 'SAR / month', unitYear: 'SAR / year',
      tiers: [
        {
          id: 'tier1', title: 'Starter', monthly: '80', annual: '768',
          features: ['1 loyalty program', 'Up to 200 customers', 'Full dashboard access', 'Email support'],
        },
        {
          id: 'tier2', title: 'Growth', monthly: '150', annual: '1,440', badge: 'Most popular',
          features: ['Unlimited loyalty programs', 'Up to 2,000 customers', 'Apple Wallet PassLab', 'Advanced analytics', 'WhatsApp support'],
        },
        {
          id: 'tier3', title: 'Pro', monthly: '300', annual: '2,880',
          features: ['Everything in Growth', 'Unlimited customers', 'Seasonal campaigns', 'Developer API', 'Priority dedicated support'],
        },
      ],
      saveLabel: 'Save 20%', cta: 'Get started',
    },
    cta: {
      h2: 'Ready to turn one-time buyers into loyal regulars?',
      sub: 'Join the waitlist today. Be first to launch before Eid.',
      placeholder: 'Your email or WhatsApp number', btn: 'Join via WhatsApp',
      note: '✓ Free to start  ·  ✓ Cancel anytime',
    },
    footer: { copy: '2026 Waya. All rights reserved.', brand: 'Waya' },
    stickyBtn: 'Join Free via WhatsApp',
  },
} as const;

/* ─── Hooks ────────────────────────────────────────────────────────────────── */

function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useParallax<T extends HTMLElement>(speed = 0.06): React.RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const offset = (window.innerHeight / 2 - rect.top - rect.height / 2) * speed;
      el.style.transform = `translateY(${Math.max(-24, Math.min(24, offset))}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);
  return ref as React.RefObject<T>;
}

/* ─── Small components ─────────────────────────────────────────────────────── */

function Pill({ children, font }: { children: React.ReactNode; font: string }) {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] px-4 py-1.5 rounded-full inline-flex">
      <p className="font-medium text-sm text-[#e2e2e2]" style={{ fontFamily: font }}>{children}</p>
    </div>
  );
}

function CheckRow({ text, font }: { text: string; font: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-[rgba(16,186,131,0.15)] flex items-center justify-center shrink-0">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M2 5.5L4.5 8L9 3" stroke={C.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span className="text-base leading-6 text-[#e2e2e2]" style={{ fontFamily: font }}>{text}</span>
    </div>
  );
}

const WaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);

function Hamburger({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      {open ? (
        <><line x1="4" y1="4" x2="18" y2="18" /><line x1="18" y1="4" x2="4" y2="18" /></>
      ) : (
        <><line x1="3" y1="7" x2="19" y2="7" /><line x1="3" y1="11" x2="19" y2="11" /><line x1="3" y1="15" x2="19" y2="15" /></>
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HOME                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function Home() {
  const { user, signOut } = useAuth();
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem('waya-lang') as Lang) || 'ar'; } catch { return 'ar'; }
  });
  const [email, setEmail]       = useState('');
  const [ctaEmail, setCtaEmail] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [pricingInterval, setPricingInterval] = useState<'monthly' | 'annual'>('annual');

  const t    = T[lang];
  const isAR = lang === 'ar';
  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';
  const hFont = t.fonts.heading;
  const bFont = t.fonts.body;
  const nFont = t.fonts.nav;

  useEffect(() => {
    document.documentElement.dir  = t.dir;
    document.documentElement.lang = lang;
  }, [lang, t.dir]);

  useEffect(() => {
    const h = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useScrollReveal();
  const heroRef = useParallax<HTMLDivElement>(0.05);

  const toggleLang = () => {
    const next: Lang = isAR ? 'en' : 'ar';
    setLang(next);
    try { localStorage.setItem('waya-lang', next); } catch {}
    setMenuOpen(false);
  };

  const wa        = waUrl('', lang);
  const heroWa    = waUrl(email, lang);
  const ctaWa     = waUrl(ctaEmail, lang);

  /* ── Nav pieces ── */
  const NavCTA = user ? (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold whitespace-nowrap" style={{ color: C.cream, fontFamily: nFont }}>{t.nav.hi}, {displayName}</span>
      <button onClick={() => signOut()} className="flex items-center px-4 py-2 rounded-full min-h-[36px] border transition-colors hover:border-[rgba(16,186,131,0.3)] cursor-pointer" style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'transparent' }}>
        <span className="font-medium text-sm whitespace-nowrap" style={{ color: C.muted, fontFamily: nFont }}>{t.nav.logout}</span>
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <button onClick={() => navigate('/login')} className="flex items-center px-4 py-2 rounded-full min-h-[36px] transition-colors hover:opacity-80 cursor-pointer" style={{ background: 'transparent' }}>
        <span className="font-medium text-sm whitespace-nowrap" style={{ color: C.cream, fontFamily: nFont }}>{t.nav.login}</span>
      </button>
      <button onClick={() => navigate('/signup')} className="waya-btn flex items-center px-5 py-2.5 rounded-full min-h-[44px] cursor-pointer" style={{ background: 'rgba(16,186,131,0.5)' }}>
        <span className="font-semibold text-[15px] text-white whitespace-nowrap" style={{ fontFamily: nFont }}>{t.nav.signup}</span>
      </button>
    </div>
  );

  const NavLinks = (
    <div className="hidden md:flex gap-6 items-center">
      {[
        { href: '#pricing', label: t.nav.pricing },
        { href: '#features', label: t.nav.features },
        { href: '#how-it-works', label: t.nav.howItWorks },
      ].map(l => (
        <a key={l.href} href={l.href} className="waya-nav-link font-medium text-base text-[#c8c4bc]" style={{ fontFamily: nFont }}>{l.label}</a>
      ))}
    </div>
  );

  const NavBrand = (
    <div className="flex items-center gap-2">
      <img alt="Waya" src={imgTicket} className="waya-logo w-8 h-8 object-contain" />
      <span className="font-extrabold text-xl text-[#f5f0e6]" style={{ fontFamily: F.number }}>{t.nav.brand}</span>
      <button onClick={toggleLang}
        className="ms-1 text-xs font-semibold text-[#8a8a8a] hover:text-[#10BA83] transition-colors px-2 py-1 rounded-md border border-[rgba(255,255,255,0.1)] hover:border-[rgba(16,186,131,0.3)] min-h-[28px]"
        style={{ fontFamily: F.number }}
      >{t.nav.toggle}</button>
    </div>
  );

  return (
    <div dir={t.dir} className="flex flex-col items-center w-full min-h-screen overflow-hidden" style={{ background: C.bg }}>

      {/* ══════════════ SECTION 1 — HERO ══════════════ */}
      <section className="w-full relative overflow-hidden" style={{ background: C.bg }}>
        <div className="max-w-[1280px] mx-auto flex flex-col gap-12 items-center pt-6 pb-20 px-4 sm:px-8 md:px-16 relative">

          {/* Ambient glow */}
          <div className="hidden md:block absolute w-[440px] h-[440px] rounded-full blur-[80px] animate-breathe pointer-events-none"
            style={{ background: 'rgba(16,186,131,0.18)', top: '160px', insetInlineStart: '80px' }} />
          <div className="hidden md:block absolute w-[340px] h-[340px] rounded-full blur-[60px] animate-breathe pointer-events-none"
            style={{ background: 'rgba(16,186,131,0.1)', top: '80px', insetInlineStart: '300px', animationDelay: '1.4s' }} />

          {/* Nav */}
          <nav className="glass-nav flex items-center justify-between px-4 py-2 rounded-full w-full sticky top-4 z-50 relative">
            {isAR ? <>{NavCTA}{NavLinks}{NavBrand}</> : <>{NavBrand}{NavLinks}{NavCTA}</>}
            <button className="md:hidden flex items-center justify-center w-11 h-11 rounded-full hover:bg-[rgba(255,255,255,0.08)] transition-colors"
              onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              <Hamburger open={menuOpen} />
            </button>
            {menuOpen && (
              <div className="md:hidden absolute top-full inset-x-0 mt-2 z-50 bg-[#1c1b18] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 flex flex-col gap-4 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
                {[
                  { href: '#how-it-works', label: t.nav.howItWorks },
                  { href: '#features', label: t.nav.features },
                  { href: '#pricing', label: t.nav.pricing },
                ].map(link => (
                  <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                    className="font-medium text-lg text-[#e2e2e2] hover:text-[#10BA83] transition-colors py-1"
                    style={{ fontFamily: bFont }}>{link.label}</a>
                ))}
                <div className="border-t border-[rgba(255,255,255,0.06)] pt-4 flex flex-col gap-3">
                  {user ? (
                    <>
                      <p className="text-sm font-semibold text-center" style={{ color: C.cream, fontFamily: bFont }}>{t.nav.hi}, {displayName}</p>
                      <button onClick={() => { setMenuOpen(false); signOut(); }}
                        className="flex items-center justify-center px-6 py-3 rounded-full w-full border cursor-pointer"
                        style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'transparent' }}>
                        <span className="font-semibold text-base" style={{ color: C.muted, fontFamily: bFont }}>{t.nav.logout}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setMenuOpen(false); navigate('/login'); }}
                        className="flex items-center justify-center px-6 py-3 rounded-full w-full border cursor-pointer"
                        style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'transparent' }}>
                        <span className="font-semibold text-base" style={{ color: C.cream, fontFamily: bFont }}>{t.nav.login}</span>
                      </button>
                      <button onClick={() => { setMenuOpen(false); navigate('/signup'); }}
                        className="waya-btn flex items-center justify-center px-6 py-3 rounded-full w-full cursor-pointer"
                        style={{ background: 'rgba(16,186,131,0.5)' }}>
                        <span className="font-semibold text-base text-white" style={{ fontFamily: bFont }}>{t.nav.signup}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </nav>

          {/* Hero body */}
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-center justify-center w-full relative z-10">

            {/* Text side */}
            <div className={`flex flex-col gap-5 w-full lg:w-1/2 lg:min-w-0 ${isAR ? 'items-end text-end' : 'items-start text-start'}`}>
              <div className="fade-up delay-100">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                  style={{ background: 'rgba(16,186,131,0.08)', border: '1px solid rgba(16,186,131,0.2)' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.green }} />
                  <span className="text-xs font-semibold" style={{ color: C.green, fontFamily: bFont }}>{t.hero.liveBadge}</span>
                </div>
                <h1 className="font-bold text-[38px] sm:text-[52px] md:text-[58px] leading-[1.1] tracking-[-1.5px]"
                  style={{ color: C.white, fontFamily: hFont }}>
                  {t.hero.h1a}<span style={{ color: C.green }}>{t.hero.h1b}</span>
                </h1>
              </div>

              <p className="font-medium text-base md:text-lg leading-relaxed max-w-[500px] fade-up delay-200"
                style={{ color: '#a8a49d', fontFamily: bFont }}>{t.hero.sub}</p>

              <div className="flex flex-col gap-3 w-full fade-up delay-300">
                <div className="flex items-center px-4 py-3.5 rounded-xl w-full transition-colors"
                  style={{ background: '#1e1d1a', border: '1px solid #32302a' }}>
                  <input type="text" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder={t.hero.placeholder}
                    className={`waya-input flex-1 bg-transparent text-[15px] outline-none w-full ${isAR ? 'text-end' : 'text-start'}`}
                    style={{ color: C.white, fontFamily: bFont }} dir={t.dir} />
                </div>
                <a href={heroWa}
                  className="waya-btn flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl w-full transition-colors"
                  style={{ background: 'rgba(16,186,131,0.55)' }}>
                  <WaIcon />
                  <span className="font-semibold text-base" style={{ color: C.white, fontFamily: bFont }}>{t.hero.cta}</span>
                </a>
                <p className="text-xs text-center" style={{ color: C.faint, fontFamily: bFont }}>{t.hero.trustNote}</p>
              </div>
            </div>

            {/* Image side */}
            <div className="w-full lg:w-1/2 lg:min-w-0 relative fade-up delay-200">
              <div ref={heroRef} className="aspect-[16/11] w-full rounded-[40px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative">
                <img alt="Waya loyalty dashboard" className="w-full h-full object-cover" src={imgHero} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top left, rgba(16,186,131,0.08), transparent)' }} />
              </div>
              {[
                { pct: '64%', off: '10px', img: imgShape },
                { pct: '58%', off: '56px', img: imgShape1 },
                { pct: '80%', off: '20px', img: imgShape2 },
              ].map((c, i) => (
                <div key={i} className="hidden xl:flex absolute floating-stat items-center justify-center"
                  style={{ top: c.pct, [isAR ? 'right' : 'left']: c.off }}>
                  <img src={c.img} alt="" className="w-6 h-6 object-contain" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ SECTION 2 — INDUSTRY TAGS ══════════════ */}
      <section className="w-full relative overflow-hidden py-2" style={{ background: C.bgCard }}>
        <div className="absolute inset-0 grid-pattern pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-6 md:px-16 py-14 flex items-center justify-between gap-8">
          <div className="hidden lg:flex flex-col gap-3 items-start shrink-0 reveal">
            {t.industry.leftPills.map((p, i) => (
              <span key={i} className="industry-pill" style={{ transform: `rotate(${p.rot}deg)`, fontFamily: nFont, marginInlineStart: i === 1 ? '20px' : '0' }}>{p.label}</span>
            ))}
          </div>
          <div className="flex flex-col items-center text-center flex-1 reveal">
            <p className="font-black text-[64px] md:text-[80px] leading-none tracking-[-3px]" style={{ color: C.cream, fontFamily: F.number }}>{t.industry.count}</p>
            <p className="font-bold text-2xl md:text-3xl mt-1" style={{ color: C.muted, fontFamily: hFont }}>{t.industry.label}</p>
          </div>
          <div className="hidden lg:flex flex-col gap-3 items-end shrink-0 reveal">
            {t.industry.rightPills.map((p, i) => (
              <span key={i} className="industry-pill" style={{ transform: `rotate(${p.rot}deg)`, fontFamily: nFont, marginInlineEnd: i === 1 ? '20px' : '0' }}>{p.label}</span>
            ))}
          </div>
        </div>
        <div className="lg:hidden flex gap-3 overflow-x-auto px-6 pb-6 no-scrollbar">
          {[...t.industry.leftPills, ...t.industry.rightPills].map((p, i) => (
            <span key={i} className="industry-pill shrink-0" style={{ fontFamily: nFont }}>{p.label}</span>
          ))}
        </div>
      </section>

      {/* ══════════════ SECTION 3 — HOW IT WORKS ══════════════ */}
      <section id="how-it-works" className="w-full py-24 px-4 sm:px-8 md:px-16 overflow-hidden" style={{ background: C.bg }}>
        <div className="max-w-[1200px] mx-auto flex flex-col gap-14 items-center">
          <div className="flex flex-col items-center gap-4 text-center reveal">
            <Pill font={nFont}>{t.how.pill}</Pill>
            <h2 className="font-bold text-3xl md:text-5xl tracking-[-1px]" style={{ color: C.white, fontFamily: hFont }}>{t.how.h2}</h2>
            <p className="text-base md:text-lg max-w-[500px]" style={{ color: C.muted, fontFamily: bFont }}>{t.how.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
            {t.how.steps.map((step, i) => (
              <div key={i} className={`reveal reveal-delay-${i + 1} waya-card rounded-3xl p-8 flex flex-col gap-5 relative overflow-hidden`}
                style={{ background: C.bgCard, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: stepIconBg[i], border: `1px solid ${stepIconBorder[i]}` }}>
                    <img src={[imgContainer, imgContainer1, imgContainer2][i]} alt="" className="w-7 h-7 object-contain" />
                  </div>
                  <span className="font-black text-4xl" style={{ color: 'rgba(255,255,255,0.06)', fontFamily: F.number }}>{step.num}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-xl text-start" style={{ color: C.white, fontFamily: hFont }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed text-start" style={{ color: C.subtle, fontFamily: bFont }}>{step.desc}</p>
                </div>
                {i < 2 && <div className="hidden md:block absolute top-[54px] -end-3 w-6 h-px" style={{ background: `rgba(16,186,131,0.3)` }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ SECTION 4 — FEATURES ══════════════ */}
      <section id="features" className="w-full py-24 px-4 sm:px-8 md:px-16 overflow-hidden" style={{ background: C.bg }}>
        <div className="max-w-[1200px] mx-auto flex flex-col gap-14 items-center">
          <div className="flex flex-col items-center gap-4 text-center reveal">
            <Pill font={nFont}>{t.feat.pill}</Pill>
            <h2 className="font-bold text-3xl md:text-5xl tracking-[-1px]" style={{ color: C.white, fontFamily: hFont }}>{t.feat.h2}</h2>
          </div>

          {/* Dashboard mockup */}
          <div className="reveal-scale waya-card rounded-3xl p-6 md:p-8 w-full" style={{ background: '#181714', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className={`flex flex-col gap-1 ${isAR ? 'items-end' : 'items-start'}`}>
                <h3 className="font-bold text-lg md:text-xl" style={{ color: C.white, fontFamily: hFont }}>{t.feat.dashTitle}</h3>
                <span className="text-xs" style={{ color: C.faint, fontFamily: bFont }}>{t.feat.dashLabel}</span>
              </div>
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map(j => <div key={j} className="w-2.5 h-2.5 rounded-full" style={{ background: C.green }} />)}
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {t.feat.stats.map((stat, i) => (
                <div key={i} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: C.statBg, border: '1px solid #2e2c26' }}>
                  <p className="text-xs font-medium" style={{ color: C.faint, fontFamily: bFont }}>{stat.label}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl md:text-2xl font-black" style={{ color: C.white, fontFamily: F.number }}>{stat.value}</span>
                    {stat.unit && <span className="text-xs" style={{ color: C.faint, fontFamily: bFont }}>{stat.unit}</span>}
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit" style={{ color: C.green, background: 'rgba(16,186,131,0.1)' }}>{stat.change}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature cards 2×2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            {t.feat.cards.map((card, i) => (
              <div key={i} className={`reveal reveal-delay-${(i % 2) + 1} feature-card rounded-3xl p-7 md:p-8 flex flex-col gap-4`}
                style={{ background: C.bgCard, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(60,60,50,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <img src={[imgEllipse, imgEllipse1, imgEllipse2, imgShape3][i]} alt="" className="w-6 h-6 object-contain" />
                </div>
                <h3 className="font-bold text-lg text-start" style={{ color: C.white, fontFamily: hFont }}>{card.title}</h3>
                <p className="text-sm leading-relaxed text-start" style={{ color: C.subtle, fontFamily: bFont }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ SECTION 5 — COMPARISON ══════════════ */}
      <section className="w-full py-24 px-4 sm:px-8 md:px-16 overflow-hidden" style={{ background: C.bgDark }}>
        <div className="max-w-[1100px] mx-auto flex flex-col gap-14 items-center">
          <div className="flex flex-col items-center gap-4 text-center reveal">
            <Pill font={nFont}>{t.comp.pill}</Pill>
            <h2 className="font-bold text-3xl md:text-5xl tracking-[-1px] max-w-[700px]" style={{ color: C.white, fontFamily: hFont }}>{t.comp.h2}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">

            {/* Without */}
            <div className="reveal-left comparison-without rounded-3xl overflow-hidden">
              <div className="flex items-center gap-3 px-7 pt-7 pb-4">
                <span className="text-xl">❌</span>
                <h3 className="font-bold text-lg" style={{ color: C.white, fontFamily: hFont }}>{t.comp.withoutTitle}</h3>
              </div>
              <div className="flex flex-col px-7 pb-7">
                {t.comp.withoutItems.map((text, i) => (
                  <div key={i} className="flex items-start gap-3 py-3.5 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(240,69,69,0.12)' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke={C.red} strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </div>
                    <p className="text-sm leading-relaxed line-through" style={{ color: C.muted, fontFamily: bFont, textDecorationColor: 'rgba(240,69,69,0.4)' }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* With */}
            <div className="reveal-right rounded-3xl overflow-hidden"
              style={{ background: `linear-gradient(145deg, rgba(16,186,131,0.1), rgba(16,186,131,0.04))`, border: `1px solid rgba(16,186,131,0.18)` }}>
              <div className="flex items-center gap-3 px-7 pt-7 pb-4">
                <span className="text-xl">✅</span>
                <h3 className="font-bold text-lg" style={{ color: C.white, fontFamily: hFont }}>{t.comp.withTitle}</h3>
              </div>
              <div className="flex flex-col px-7 pb-7">
                {t.comp.withItems.map((text, i) => (
                  <div key={i} className="flex items-start gap-3 py-3.5 last:border-0" style={{ borderBottom: '1px solid rgba(16,186,131,0.07)' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(16,186,131,0.18)' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke={C.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#c8c4bc', fontFamily: bFont }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════ SECTION 6 — PRICING ══════════════ */}
      <section id="pricing" className="w-full py-24 px-4 sm:px-8 md:px-16 overflow-hidden" style={{ background: C.bg }}>
        <div className="max-w-[1100px] mx-auto flex flex-col gap-10 md:gap-14 items-center">
          <div className="flex flex-col items-center gap-4 text-center reveal">
            <Pill font={nFont}>{t.price.pill}</Pill>
            <h2 className="font-bold text-3xl md:text-5xl tracking-[-1px]" style={{ color: C.white, fontFamily: hFont }}>{t.price.h2}</h2>
            <p className="text-base max-w-[520px]" style={{ color: C.muted, fontFamily: bFont }}>{t.price.sub}</p>
          </div>

          {/* Billing-interval toggle */}
          <div className="reveal flex items-center gap-2 rounded-full p-1"
               style={{ background: C.bgCard, border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['monthly', 'annual'] as const).map(opt => {
              const active = pricingInterval === opt;
              return (
                <button key={opt} onClick={() => setPricingInterval(opt)}
                  className="px-5 py-2 text-sm rounded-full transition-colors"
                  style={{
                    background: active ? C.green : 'transparent',
                    color: active ? '#0a0a08' : C.white,
                    fontFamily: bFont, fontWeight: active ? 700 : 500,
                  }}>
                  {opt === 'monthly' ? t.price.toggleMonthly : t.price.toggleAnnual}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
            {t.price.tiers.map(tier => {
              const isFeatured = tier.id === 'tier2';
              const price = pricingInterval === 'monthly' ? tier.monthly : tier.annual;
              const unit = pricingInterval === 'monthly' ? t.price.unitMonth : t.price.unitYear;
              const planId = `${tier.id}_${pricingInterval}`;
              const onClick = () => {
                const target = `/billing?plan=${planId}`;
                if (user) navigate(target);
                else navigate(`/signup?next=${encodeURIComponent(target)}`);
              };
              return (
                <div key={tier.id}
                  className={`${isFeatured ? 'reveal-scale' : 'reveal'} rounded-3xl p-7 md:p-9 flex flex-col gap-6 relative overflow-hidden min-w-0`}
                  style={{
                    background: isFeatured ? C.priceDk : C.priceM,
                    border: `1px solid ${isFeatured ? 'rgba(16,186,131,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {isFeatured && 'badge' in tier && tier.badge && (
                    <div className="absolute top-5 px-3 py-1 rounded-full"
                      style={{ background: C.green, [isAR ? 'left' : 'right']: '20px' }}>
                      <span className="font-bold text-xs" style={{ color: '#0a0a08', fontFamily: bFont }}>
                        {tier.badge}
                      </span>
                    </div>
                  )}
                  <div className={`flex flex-col gap-1.5 ${isAR ? 'items-end' : 'items-start'}`}>
                    <h3 className="font-bold text-xl" style={{ color: C.white, fontFamily: hFont }}>{tier.title}</h3>
                    <div className={`flex items-baseline gap-2 ${isAR ? 'flex-row-reverse' : ''}`}>
                      <span className="font-black text-[44px] md:text-[56px] leading-none tracking-[-2px]"
                        style={{ color: C.white, fontFamily: F.number }}>{price}</span>
                      <span className="text-sm" style={{ color: C.muted, fontFamily: bFont }}>{unit}</span>
                    </div>
                    {pricingInterval === 'annual' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: C.green, background: 'rgba(16,186,131,0.1)' }}>
                        {t.price.saveLabel}
                      </span>
                    )}
                  </div>
                  <div style={{ borderTop: `1px solid ${isFeatured ? 'rgba(16,186,131,0.1)' : 'rgba(255,255,255,0.06)'}` }} />
                  <div className="flex flex-col gap-3 flex-1">
                    {tier.features.map((f, i) => <CheckRow key={i} text={f} font={bFont} />)}
                  </div>
                  <button onClick={onClick}
                    className="waya-btn flex items-center justify-center px-6 py-4 rounded-xl mt-2 transition-colors"
                    style={{
                      background: isFeatured ? C.green : 'rgba(255,255,255,0.06)',
                      border: isFeatured ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    }}>
                    <span className="font-bold text-base"
                      style={{ color: isFeatured ? '#0a0a08' : '#e2e2e2', fontFamily: bFont }}>
                      {t.price.cta}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ SECTION 7 — CTA ══════════════ */}
      <section className="w-full py-28 px-4 sm:px-8 md:px-16 overflow-hidden" style={{ background: C.bg }}>
        <div className="max-w-[800px] mx-auto flex flex-col gap-7 items-center text-center">
          <h2 className="reveal font-bold text-2xl sm:text-3xl md:text-[44px] md:leading-[1.15] tracking-[-1.5px] max-w-[700px]"
            style={{ color: C.white, fontFamily: hFont }}>{t.cta.h2}</h2>
          <p className="reveal reveal-delay-1 text-base md:text-lg max-w-[560px]"
            style={{ color: C.muted, fontFamily: bFont }}>{t.cta.sub}</p>

          <div className="reveal reveal-delay-2 flex flex-col sm:flex-row gap-3 w-full max-w-[640px]">
            <div className="flex items-center px-4 py-3.5 rounded-xl flex-1 transition-colors"
              style={{ background: '#1e1d1a', border: '1px solid #32302a' }}>
              <input type="text" value={ctaEmail} onChange={e => setCtaEmail(e.target.value)}
                placeholder={t.cta.placeholder}
                className={`waya-input flex-1 bg-transparent text-[15px] outline-none w-full ${isAR ? 'text-end' : 'text-start'}`}
                style={{ color: C.white, fontFamily: bFont }} dir={t.dir} />
            </div>
            <a href={ctaWa}
              className="waya-btn flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl whitespace-nowrap transition-colors"
              style={{ background: 'rgba(16,186,131,0.55)' }}>
              <span className="font-semibold text-base text-white" style={{ fontFamily: bFont }}>{t.cta.btn}</span>
            </a>
          </div>
          <p className="reveal reveal-delay-3 text-xs" style={{ color: C.faint, fontFamily: bFont }}>{t.cta.note}</p>
        </div>
      </section>

      {/* ══════════════ SECTION 8 — FOOTER ══════════════ */}
      <footer className="w-full px-4 sm:px-8 md:px-16 py-8" style={{ background: C.bgDark, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm" style={{ color: C.faint, fontFamily: bFont }}>{t.footer.copy}</p>
          <div className="flex gap-1 items-center">
            <img alt="" src={imgTicket} className="w-7 h-7 object-contain" />
            <span className="font-extrabold text-lg" style={{ color: C.cream, fontFamily: F.number }}>{t.footer.brand}</span>
          </div>
        </div>
      </footer>

      {/* ══════════════ MOBILE STICKY CTA ══════════════ */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-3 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #12110f, rgba(18,17,15,0.95), transparent)' }}>
        <a href={wa}
          className="waya-btn pointer-events-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl w-full transition-colors"
          style={{ background: 'rgba(16,186,131,0.7)', boxShadow: '0 8px 32px rgba(16,186,131,0.2)' }}>
          <WaIcon />
          <span className="font-bold text-base text-white" style={{ fontFamily: bFont }}>{t.stickyBtn}</span>
        </a>
      </div>

    </div>
  );
}
