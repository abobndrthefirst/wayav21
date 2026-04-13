import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Globe, Menu, X, CheckCircle2 } from 'lucide-react';

// ─── Brand Tokens (Updated for Dark Design) ───────────────────────────────────
const C = {
  // Dark backgrounds
  darkBg: '#12110f',
  darkBgSecond: '#1c1b18',
  darkCard: '#272620',
  darkBorder: '#32302a',

  // Green accents
  greenPrimary: 'rgba(16,185,129,0.5)',
  greenBright: '#00ffa9',

  // Text colors
  textPrimary: '#fffbff',
  textSecondary: '#e2e2e2',
  textMuted: '#8a8a8a',

  // Warm/Cream
  cream: '#f5f0e6',

  // Tags
  tagBg: '#f8f5f0',
  tagText: '#736e64',
};

const WA_URL = 'https://wa.me/966500000000';

// ─── Scroll Reveal Hook ────────────────────────────────────────────────────────
function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in-view');
          obs.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ─── Animated Counter ──────────────────────────────────────────────────────────
function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.unobserve(el);
        const duration = 1200;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setCount(Math.round(ease * value));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Reveal Wrapper ────────────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

// ─── Translations ──────────────────────────────────────────────────────────────
const AR = {
  nav: {
    logo: 'وايا',
    howLink: 'كيف يعمل',
    featuresLink: 'المميزات',
    pricingLink: 'الأسعار',
    cta: 'انضم',
  },
  hero: {
    badge: 'برامج ولاء تشتغل بسهولة',
    headline: 'برامج ولاء تشتغل بسهولة',
    headlineGreen: 'بسهولة',
    sub: 'بطاقة ولاء رقمية تنزل مباشرة على جوال العميل — بدون تطبيقات، بدون أجهزة، جاهز في ٥ دقايق.',
    waBtn: 'اشترك عبر الواتس اب',
    placeholder: 'إيميلك أو رقم واتسابك',
    formBtn: 'اشترك',
    trust: 'أسبوعين مجاناً · ضمان استرداد ٣٠ يوم · ٧٥ ريال/شهر',
    success: '🎉 تمام! بنتواصل معك قريب على واتساب أو الإيميل.',
    err: 'ادخل إيميل صحيح أو رقم جوال يبدأ بـ 05',
  },
  stats: {
    registered: '+٤٧٧ محل مسجّل',
  },
  businessTypes: [
    { emoji: '🍰', label: 'حلويات' },
    { emoji: '🧴', label: 'مغاسل' },
    { emoji: '💅', label: 'صالونات' },
    { emoji: '☕', label: 'كافيهات' },
    { emoji: '🍕', label: 'مطاعم' },
    { emoji: '✂️', label: 'حلاقين' },
  ],
  threeSteps: {
    label: 'ثلاث خطوات بس',
    heading: 'كيفية البدء',
    steps: [
      { num: '١', title: 'سجّل معلوماتك', desc: 'أنشئ بطاقتك وأضف اسم المحل والمكافأة.' },
      { num: '٢', title: 'شفّر الكود', desc: 'خصّص البطاقة حسب هويتك وألوان محلك.' },
      { num: '٣', title: 'ابني الولاء', desc: 'ابدأ بطوابع وشاهد عملاءك يرجعون.' },
    ],
  },
  features: {
    heading: 'كل اللي تحتاجه، ولا شي زيادة',
    subheading: 'مركز الولاء بين يدك، شاملة واحدة',
    items: [
      { icon: '📲', title: 'مركز الولاء', stat: '100%', desc: 'إدارة كاملة للبطاقات والطوابع من لوحة واحدة بسيطة.' },
      { icon: '📊', title: 'تحليلات فورية', stat: '+٥٠%', desc: 'شوف عملاءك الأوفياء والمبيعات والعائد بشكل مباشر.' },
      { icon: '🎯', title: 'حملات موجهة', stat: '3X', desc: 'أرسل عروض وتنبيهات مباشرة لعملاءك عبر الواتس.' },
      { icon: '⚡', title: 'سهل التشغيل', stat: '5 دقائق', desc: 'بدون معقدات — أطلق البطاقة وابدأ الطوابع فوراً.' },
      { icon: '🔐', title: 'آمن وموثوق', stat: '100%', desc: 'بيانات عملائك محمية بأعلى مستويات الأمان.' },
      { icon: '💬', title: 'دعم عربي 24/7', stat: 'فوري', desc: 'فريقنا جاهز يساعدك عبر الواتس أي وقت.' },
    ],
  },
  comparison: {
    heading: 'ماذا لو برامج الولاء ما كانت بس للكبار؟',
    with: 'مع وايا الولاء',
    without: 'بدون نظام ولاء',
    benefits: [
      'عملاء يرجعون بانتظام',
      'مبيعات أعلى بـ 3x',
      'ولاء حقيقي للمحل',
      'بيانات واضحة عن العملاء',
    ],
    problems: [
      'عملاء عابرون يذهبون للمنافس',
      'مبيعات غير مستقرة',
      'لا تعرف من يرجع إليك',
      'عشوائية في التخطيط',
    ],
  },
  pricing: {
    heading: 'خطة بسيطة، بدون تعقيد',
    price: '٧٥',
    period: 'ريال سعودي / شهر',
    sub: 'كل المميزات في باقة واحدة',
    lines: [
      'أسبوعين تجربة مجانية — بدون بطاقة بنكية',
      'ضمان استرداد كامل خلال ٣٠ يوم',
      'عملاء بلا حدود · طوابع بلا حدود',
      'دعم واتساب مباشر بالعربي',
    ],
    cta: 'ابدأ مجاناً الحين',
    waLink: 'أو تواصل على واتساب',
  },
  finalCta: {
    heading: 'مستعد تحوّل المشتري العابر إلى عميل دائم؟',
    sub: 'أسبوعين مجاناً · ضمان ٣٠ يوم · بدون بطاقة بنكية',
    placeholder: 'إيميلك أو رقم واتسابك',
    cta: 'ابدأ مجاناً',
    waBtn: 'أو تواصل على الواتس',
  },
  footer: {
    tagline: 'أسهل برنامج ولاء للمحلات في السعودية',
    copy: '© 2025 وايا',
  },
};

const EN = {
  nav: {
    logo: 'Waya',
    howLink: 'How it works',
    featuresLink: 'Features',
    pricingLink: 'Pricing',
    cta: 'Join',
  },
  hero: {
    badge: 'Loyalty programs that just work',
    headline: 'Loyalty programs that just work',
    headlineGreen: 'just work',
    sub: 'A digital stamp card that lands in your customer\'s phone wallet — no app, no hardware, live in 5 minutes.',
    waBtn: 'Subscribe on WhatsApp',
    placeholder: 'Your email or WhatsApp number',
    formBtn: 'Subscribe',
    trust: '2 weeks free · 30-day money-back guarantee · 75 SAR/month',
    success: '🎉 You\'re in! We\'ll reach out soon.',
    err: 'Please enter a valid email or a mobile number starting with 05',
  },
  stats: {
    registered: '+477 shops registered',
  },
  businessTypes: [
    { emoji: '🍰', label: 'Bakeries' },
    { emoji: '🧴', label: 'Laundry' },
    { emoji: '💅', label: 'Salons' },
    { emoji: '☕', label: 'Cafes' },
    { emoji: '🍕', label: 'Restaurants' },
    { emoji: '✂️', label: 'Barbers' },
  ],
  threeSteps: {
    label: 'Three simple steps',
    heading: 'Getting started',
    steps: [
      { num: '1', title: 'Register your info', desc: 'Create your card and add your shop name and reward.' },
      { num: '2', title: 'Customize your code', desc: 'Make it yours with your shop colors and branding.' },
      { num: '3', title: 'Build loyalty', desc: 'Start stamping and watch customers come back.' },
    ],
  },
  features: {
    heading: 'Everything you need, nothing extra',
    subheading: 'Loyalty hub in your hand, all-in-one',
    items: [
      { icon: '📲', title: 'Loyalty Hub', stat: '100%', desc: 'Full card and stamp management from one simple dashboard.' },
      { icon: '📊', title: 'Live Analytics', stat: '+50%', desc: 'See your loyal customers, sales, and ROI in real-time.' },
      { icon: '🎯', title: 'Smart Campaigns', stat: '3X', desc: 'Send targeted offers and alerts directly to customers.' },
      { icon: '⚡', title: 'Easy Setup', stat: '5 mins', desc: 'No complexity — launch your card and start stamping instantly.' },
      { icon: '🔐', title: 'Secure & Reliable', stat: '100%', desc: 'Your customer data is protected with enterprise-grade security.' },
      { icon: '💬', title: '24/7 Arab Support', stat: 'instant', desc: 'Our team is ready to help you on WhatsApp anytime.' },
    ],
  },
  comparison: {
    heading: 'What if loyalty programs weren\'t just for big businesses?',
    with: 'With Waya',
    without: 'Without loyalty',
    benefits: [
      'Customers return regularly',
      '3x higher sales',
      'Real customer loyalty',
      'Clear customer insights',
    ],
    problems: [
      'One-time visitors leave forever',
      'Unpredictable sales',
      'You don\'t know who returns',
      'Blind decision-making',
    ],
  },
  pricing: {
    heading: 'Simple pricing, no surprises',
    price: '75',
    period: 'SAR / month',
    sub: 'All features in one plan',
    lines: [
      '2 weeks free — no credit card required',
      'Full 30-day money-back guarantee',
      'Unlimited customers · stamps · rewards',
      'Direct WhatsApp support',
    ],
    cta: 'Start Free Now',
    waLink: 'or chat on WhatsApp',
  },
  finalCta: {
    heading: 'Ready to turn one-time buyers into loyal regulars?',
    sub: '2 weeks free · 30-day guarantee · No credit card',
    placeholder: 'Your email or WhatsApp number',
    cta: 'Start Free',
    waBtn: 'or contact on WhatsApp',
  },
  footer: {
    tagline: 'The simplest loyalty program for businesses in Saudi Arabia',
    copy: '© 2025 Waya',
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function validate(v: string) {
  const s = v.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || /^05\d{8}$/.test(s);
}

function WaIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" focusable="false">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.855L.053 23.294a1 1 0 001.207 1.249l5.652-1.483A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.04-1.394l-.36-.214-3.732.979.996-3.638-.234-.374A9.818 9.818 0 112 12 9.818 9.818 0 0121.818 12z" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7V4a1 1 0 011-1h16a1 1 0 011 1v3M3 7h18M3 7v10a1 1 0 001 1h16a1 1 0 001-1V7M9 14v.01M15 14v.01" />
    </svg>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [input, setInput] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  const t = lang === 'ar' ? AR : EN;
  const isRtl = lang === 'ar';
  const heroRef = useRef<HTMLElement>(null);
  const ff = isRtl ? '"Noto Sans Arabic", sans-serif' : '"Inter", sans-serif';

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (validate(input)) {
      setFormSuccess(true);
      setFormError(false);
    } else {
      setFormError(true);
    }
  }

  return (
    <div
      style={{
        fontFamily: ff,
        background: C.darkBg,
        color: C.textPrimary,
        overflowX: 'hidden',
      }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: 'calc(100% - 40px)',
          maxWidth: 1000,
        }}
      >
        {/* Glassmorphism pill */}
        <div
          style={{
            backdropFilter: 'blur(10px)',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 999,
            padding: '12px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo + Ticket */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.greenBright }}>
            <TicketIcon />
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>{t.nav.logo}</span>
          </div>

          {/* Center nav links - hidden on mobile */}
          <div
            style={{
              display: menuOpen ? 'flex' : 'none',
              position: 'absolute',
              top: '100%',
              [isRtl ? 'right' : 'left']: 0,
              width: '100%',
              flexDirection: 'column',
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: 12,
              padding: '16px',
              gap: 12,
              marginTop: 12,
            }}
          >
            <button
              onClick={() => scrollTo('how-it-works')}
              style={{
                background: 'none',
                border: 'none',
                color: C.textSecondary,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {t.nav.howLink}
            </button>
            <button
              onClick={() => scrollTo('features')}
              style={{
                background: 'none',
                border: 'none',
                color: C.textSecondary,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {t.nav.featuresLink}
            </button>
            <button
              onClick={() => scrollTo('pricing')}
              style={{
                background: 'none',
                border: 'none',
                color: C.textSecondary,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {t.nav.pricingLink}
            </button>
          </div>

          {/* Right side: lang toggle + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              style={{
                background: 'none',
                border: 'none',
                color: C.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
              }}
            >
              <Globe size={16} />
              {lang === 'ar' ? 'EN' : 'AR'}
            </button>

            <a
              href={WA_URL}
              style={{
                background: C.greenBright,
                color: C.darkBg,
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {t.nav.cta}
            </a>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: C.textPrimary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        id="hero"
        style={{
          position: 'relative',
          paddingTop: 160,
          paddingBottom: 100,
          paddingLeft: 20,
          paddingRight: 20,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Glowing blur background */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,255,169,0.15), transparent)',
            top: '10%',
            left: isRtl ? 'auto' : '-100px',
            right: isRtl ? '-100px' : 'auto',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, position: 'relative', zIndex: 1, alignItems: 'center' }}>
          {/* Left: Hero Image */}
          <Reveal>
            <div
              style={{
                borderRadius: 48,
                overflow: 'hidden',
                width: '100%',
                aspectRatio: '1/1',
                maxWidth: 400,
                margin: '0 auto',
              }}
            >
              <img
                src="https://www.figma.com/api/mcp/asset/83b9626c-cc10-44c5-847b-e78699533cf3"
                alt="Happy customer"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          </Reveal>

          {/* Right: Content */}
          <Reveal delay={100}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Headline */}
                <h1
                  style={{
                    fontSize: isRtl ? 56 : 56,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    margin: 0,
                    letterSpacing: -1,
                  }}
                >
                  {isRtl ? (
                    <>
                      برامج ولاء تشتغل <span style={{ color: C.greenBright }}>{t.hero.headlineGreen}</span>
                    </>
                  ) : (
                    <>
                      Loyalty programs that <span style={{ color: C.greenBright }}>just work</span>
                    </>
                  )}
                </h1>

                {/* Subtitle */}
                <p style={{ fontSize: 16, lineHeight: 1.6, color: C.textSecondary, margin: 0 }}>{t.hero.sub}</p>
              </div>

              {/* Form */}
              <form
                onSubmit={submit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setFormError(false);
                  }}
                  placeholder={t.hero.placeholder}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: `1px solid ${C.darkBorder}`,
                    background: C.darkCard,
                    color: C.textPrimary,
                    fontSize: 14,
                    width: '100%',
                    outline: 'none',
                  }}
                  dir={isRtl ? 'rtl' : 'ltr'}
                />

                {formError && <span style={{ fontSize: 13, color: '#ff6b6b' }}>{t.hero.err}</span>}
                {formSuccess && <span style={{ fontSize: 13, color: C.greenBright }}>{t.hero.success}</span>}

                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: C.greenBright,
                    color: C.darkBg,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t.hero.formBtn}
                </button>

                <a
                  href={WA_URL}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: `1px solid ${C.darkBorder}`,
                    background: 'transparent',
                    color: C.greenBright,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  {t.hero.waBtn}
                </a>
              </form>

              {/* Trust badge */}
              <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>{t.hero.trust}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── STATS / INDUSTRY TAGS ─────────────────────────────────────────────── */}
      <section
        style={{
          background: C.darkBgSecond,
          paddingTop: 80,
          paddingBottom: 80,
          paddingLeft: 20,
          paddingRight: 20,
          borderTop: `1px solid ${C.darkBorder}`,
          borderBottom: `1px solid ${C.darkBorder}`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Big stat */}
          <Reveal>
            <h2
              style={{
                fontSize: 48,
                fontWeight: 700,
                textAlign: 'center',
                marginBottom: 80,
                margin: 0,
              }}
            >
              {t.stats.registered}
            </h2>
          </Reveal>

          {/* Business type pills - scattered */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {t.businessTypes.map((biz, i) => (
              <Reveal key={i} delay={i * 50}>
                <div
                  style={{
                    background: C.tagBg,
                    color: C.tagText,
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 500,
                    border: `1px solid rgba(115,110,100,0.2)`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{biz.emoji}</span>
                  {biz.label}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── THREE STEPS ────────────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        style={{
          paddingTop: 100,
          paddingBottom: 100,
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Heading */}
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 80 }}>
              <p style={{ margin: 0, fontSize: 14, color: C.greenBright, fontWeight: 600, marginBottom: 8 }}>
                {t.threeSteps.label}
              </p>
              <h2 style={{ margin: 0, fontSize: 48, fontWeight: 700 }}>{t.threeSteps.heading}</h2>
            </div>
          </Reveal>

          {/* 3 cards horizontal */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 32,
            }}
          >
            {t.threeSteps.steps.map((step, i) => (
              <Reveal key={i} delay={i * 100}>
                <div
                  style={{
                    background: C.darkCard,
                    border: `1px solid ${C.darkBorder}`,
                    borderRadius: 16,
                    padding: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 12,
                      background: C.greenPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      fontWeight: 700,
                      color: C.greenBright,
                    }}
                  >
                    {step.num}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{step.title}</h3>
                  <p style={{ margin: 0, fontSize: 14, color: C.textSecondary, lineHeight: 1.5 }}>
                    {step.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────────────────────────── */}
      <section
        id="features"
        style={{
          paddingTop: 100,
          paddingBottom: 100,
          paddingLeft: 20,
          paddingRight: 20,
          background: C.darkBgSecond,
          borderTop: `1px solid ${C.darkBorder}`,
          borderBottom: `1px solid ${C.darkBorder}`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Heading */}
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 80 }}>
              <h2 style={{ margin: 0, fontSize: 48, fontWeight: 700, marginBottom: 16 }}>
                {t.features.heading}
              </h2>
              <p style={{ margin: 0, fontSize: 16, color: C.textSecondary }}>
                {t.features.subheading}
              </p>
            </div>
          </Reveal>

          {/* 6 feature cards - 3 columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 32,
            }}
          >
            {t.features.items.map((feature, i) => (
              <Reveal key={i} delay={i * 50}>
                <div
                  style={{
                    background: C.darkCard,
                    border: `1px solid ${C.darkBorder}`,
                    borderRadius: 16,
                    padding: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                      {feature.title}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: C.greenBright,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      {feature.stat}
                    </p>
                    <p style={{ margin: 0, fontSize: 14, color: C.textSecondary, lineHeight: 1.5 }}>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ────────────────────────────────────────────────────────── */}
      <section
        style={{
          paddingTop: 100,
          paddingBottom: 100,
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Heading */}
          <Reveal>
            <h2 style={{ fontSize: 48, fontWeight: 700, textAlign: 'center', marginBottom: 80, margin: 0 }}>
              {t.comparison.heading}
            </h2>
          </Reveal>

          {/* Side by side comparison */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 40,
            }}
          >
            {/* With Waya */}
            <Reveal delay={100}>
              <div
                style={{
                  background: C.darkCard,
                  border: `1px solid ${C.greenBright}`,
                  borderRadius: 16,
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{t.comparison.with}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {t.comparison.benefits.map((benefit, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <CheckCircle2 size={20} color={C.greenBright} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 14, lineHeight: 1.5 }}>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Without */}
            <Reveal delay={200}>
              <div
                style={{
                  background: C.darkBgSecond,
                  border: `1px solid ${C.darkBorder}`,
                  borderRadius: 16,
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{t.comparison.without}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {t.comparison.problems.map((problem, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ fontSize: 24, lineHeight: 1 }}>✕</span>
                      <span style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.5 }}>
                        {problem}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────────────── */}
      <section
        id="pricing"
        style={{
          paddingTop: 100,
          paddingBottom: 100,
          paddingLeft: 20,
          paddingRight: 20,
          background: C.darkBgSecond,
          borderTop: `1px solid ${C.darkBorder}`,
          borderBottom: `1px solid ${C.darkBorder}`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Heading */}
          <Reveal>
            <h2 style={{ fontSize: 48, fontWeight: 700, textAlign: 'center', marginBottom: 80, margin: 0 }}>
              {t.pricing.heading}
            </h2>
          </Reveal>

          {/* Pricing card */}
          <Reveal delay={100}>
            <div
              style={{
                background: C.darkCard,
                border: `1px solid ${C.darkBorder}`,
                borderRadius: 16,
                padding: 60,
                maxWidth: 600,
                margin: '0 auto',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 40,
              }}
            >
              {/* Price display */}
              <div>
                <div
                  style={{
                    fontSize: 72,
                    fontWeight: 700,
                    color: C.greenBright,
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {t.pricing.price}
                </div>
                <div style={{ fontSize: 16, color: C.textSecondary, marginTop: 8 }}>
                  {t.pricing.period}
                </div>
              </div>

              {/* Features list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {t.pricing.lines.map((line, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CheckCircle2 size={20} color={C.greenBright} />
                    <span style={{ fontSize: 14 }}>{line}</span>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={submit}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: C.greenBright,
                    color: C.darkBg,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t.pricing.cta}
                </button>
                <a
                  href={WA_URL}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: `1px solid ${C.darkBorder}`,
                    background: 'transparent',
                    color: C.textSecondary,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  {t.pricing.waLink}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          paddingTop: 100,
          paddingBottom: 100,
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Reveal>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 32,
                textAlign: 'center',
              }}
            >
              <h2 style={{ fontSize: 48, fontWeight: 700, margin: 0 }}>
                {t.finalCta.heading}
              </h2>

              <p style={{ fontSize: 16, color: C.textSecondary, margin: 0 }}>
                {t.finalCta.sub}
              </p>

              <form
                onSubmit={submit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxWidth: 400,
                  margin: '0 auto',
                  width: '100%',
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setFormError(false);
                  }}
                  placeholder={t.finalCta.placeholder}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: `1px solid ${C.darkBorder}`,
                    background: C.darkCard,
                    color: C.textPrimary,
                    fontSize: 14,
                    width: '100%',
                    outline: 'none',
                  }}
                />

                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: C.greenBright,
                    color: C.darkBg,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t.finalCta.cta}
                </button>

                <a
                  href={WA_URL}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: `1px solid ${C.darkBorder}`,
                    background: 'transparent',
                    color: C.greenBright,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  {t.finalCta.waBtn}
                </a>
              </form>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer
        style={{
          paddingTop: 60,
          paddingBottom: 60,
          paddingLeft: 20,
          paddingRight: 20,
          borderTop: `1px solid ${C.darkBorder}`,
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 16, color: C.greenBright }}>
            {t.nav.logo}
          </h2>
          <p style={{ margin: 0, color: C.textSecondary, marginBottom: 32 }}>
            {t.footer.tagline}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
            {t.footer.copy}
          </p>
        </div>
      </footer>

      {/* Global styles */}
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
        }

        .reveal {
          opacity: 0;
          transform: translateY(30px);
          animation: revealIn 0.6s ease forwards;
        }

        .reveal.in-view {
          animation: revealIn 0.6s ease forwards;
        }

        @keyframes revealIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .waya-input:focus {
          border-color: #00ffa9 !important;
          box-shadow: 0 0 0 2px rgba(0, 255, 169, 0.1);
        }

        input {
          font-family: inherit;
        }

        button {
          font-family: inherit;
        }

        a {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
