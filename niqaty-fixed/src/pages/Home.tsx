import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Globe, Menu, X, LogIn, UserPlus, LogOut } from 'lucide-react';
import { navigate } from '../App';
import { useAuth } from '../lib/AuthContext';

// ─── Brand Tokens ──────────────────────────────────────────────────────────────
const C = {
  lime:    '#B9FF66',
  dark:    '#191A23',
  gray:    '#F3F3F3',
  white:   '#FFFFFF',
  green:   '#0A6C3B',
  muted:   '#4A5B4D', // FIX H4: darkened from #6B7C6E → #4A5B4D for WCAG AA (5.0:1)
  border:  '1px solid #191A23',
  shadow:  '4px 4px 0px #191A23',
};

// Replace with your real WhatsApp Business number
const WA_URL = 'https://wa.me/9665XXXXXXXX';

// Business type options for the lead form
const BUSINESS_TYPES_AR = [
  { value: '', label: 'اختر نوع نشاطك' },
  { value: 'cafe', label: 'مقهى / كافيه' },
  { value: 'restaurant', label: 'مطعم / مطبخ' },
  { value: 'barber', label: 'حلاق / صالون' },
  { value: 'salon', label: 'صالون نسائي' },
  { value: 'bakery', label: 'حلويات / مخبز' },
  { value: 'laundry', label: 'مغسلة' },
  { value: 'boutique', label: 'بوتيك / محل ملابس' },
  { value: 'gym', label: 'نادي رياضي' },
  { value: 'other', label: 'نوع آخر' },
];
const BUSINESS_TYPES_EN = [
  { value: '', label: 'Select your business type' },
  { value: 'cafe', label: 'Café / Coffee Shop' },
  { value: 'restaurant', label: 'Restaurant / Kitchen' },
  { value: 'barber', label: 'Barber Shop' },
  { value: 'salon', label: 'Beauty Salon' },
  { value: 'bakery', label: 'Bakery / Sweets' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'boutique', label: 'Boutique / Clothing' },
  { value: 'gym', label: 'Gym / Fitness' },
  { value: 'other', label: 'Other' },
];

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
  nav: { logo: 'وايا', howLink: 'كيف تشتغل', pricingLink: 'الأسعار', faqLink: 'أسئلة', dashLink: 'لوحة التحكم', cta: 'جرّب مجاناً', login: 'دخول', signup: 'سجّل', logout: 'خروج', hi: 'مرحباً' },
  hero: {
    badge: 'أسهل برنامج ولاء في السعودية',
    headline: 'خلّ عملاءك يرجعون لك كل مرة',
    sub: 'بطاقة ولاء رقمية تنزل مباشرة على جوال العميل — بدون تطبيقات، بدون أجهزة، جاهز في ٥ دقايق.',
    waBtn: 'أو تواصل على واتساب',
    divider: 'أو اترك بياناتك',
    phonePlaceholder: 'رقم جوالك (05XXXXXXXX)',
    emailPlaceholder: 'إيميلك',
    formBtn: 'ابدأ شهرك المجاني الحين',
    trust: 'شهر مجاني كامل · بدون بطاقة بنكية · إلغاء أي وقت',
    success: 'تمام! بنتواصل معك خلال ٢٤ ساعة لتفعيل حسابك المجاني.',
    errEmail: 'ادخل إيميل صحيح مثل name@example.com',
    errPhone: 'ادخل رقم جوال سعودي مثل 05XXXXXXXX أو +9665XXXXXXXX',
    errGeneric: 'ادخل إيميل صحيح أو رقم جوال سعودي',
    errBusiness: 'اختر نوع نشاطك',
    sending: 'جاري الإرسال...',
    submitAnother: 'أرسل بيانات أخرى',
    // Legacy fields kept for compat
    placeholder: 'إيميلك أو رقم واتسابك',
  },
  stats: [
    { label: 'شهر مجاني', value: 1, suffix: '' },
    { label: 'دقايق إعداد', value: 5, suffix: '' },
    { label: 'ريال/شهر بعد التجربة', value: 75, suffix: '' },
  ],
  problem: {
    label: 'التحدي',
    heading: 'المحلات الصغيرة تخسر عملاءها بدون ما تدري',
    items: [
      { icon: '👥', title: 'العميل يجي مرة وما يرجع', desc: 'ما عندك طريقة تخليه يرجع — والمنافس عنده برنامج ولاء وأنت لسا ما عندك.' },
      { icon: '📋', title: 'بطاقات الورق تضيع دايم', desc: 'العميل ينسى، الورقة تتلف، والطابع ما يوصل لمكافأة. المنظومة ما تشتغل.' },
      { icon: '😩', title: 'الحلول الثانية معقدة وغالية', desc: 'أجهزة بآلاف، تطبيقات تاخذ أشهر، وموظفين يحتاجون تدريب. مو منطق لمحل صغير.' },
    ],
  },
  howItWorks: {
    label: 'كيف تشتغل وايا؟',
    heading: '٣ خطوات — وبس',
    steps: [
      { num: '١', title: 'سجّل محلك في ٥ دقايق', desc: 'أنشئ بطاقتك، ضيف اسم المحل والمكافأة وعدد الطوابع.' },
      { num: '٢', title: 'شارك الرابط مع عملاءك', desc: 'العميل يضغط والبطاقة تنزل على محفظة جواله — بدون تحميل.' },
      { num: '٣', title: 'اطبع الطابع — العميل يكسب', desc: 'موظفك يمسح من جواله. العميل يتلقى إشعار فوري ويكسب مكافأته.' },
    ],
  },
  benefits: {
    label: 'ليش وايا؟',
    heading: 'كل شي تحتاجه — بدون أي تعقيد',
    items: [
      { icon: '📲', title: 'عميلك ما يحمّل شي', desc: 'البطاقة تنزل مباشرة على Apple Wallet و Google Wallet. ضغطة وحدة — وبس.' },
      { icon: '🚫', title: 'ما تشتري أي جهاز', desc: 'لا POS، لا أجهزة. موظفك يمسح الطابع من جواله الشخصي.' },
      { icon: '⚡', title: 'تبدأ اليوم مش الشهر الجاي', desc: 'من التسجيل لأول طابع في ٥ دقايق. أبسط إعداد جرّبته.' },
      { icon: '📊', title: 'تعرف عملاءك أكثر', desc: 'شوف مين يرجع أكثر وكيف يكبر محلك — من لوحة بسيطة.' },
    ],
  },
  passDesigns: {
    label: 'تصاميم البطاقات',
    heading: 'بطاقات Apple Wallet بتصاميم احترافية',
    sub: 'اختر التصميم المناسب لنشاطك — بوردنق باس، تذكرة فعالية، كوبون، أو بطاقة عامة. كلها تنزل مباشرة على جوال العميل.',
    scrollHint: 'اسحب لليسار لمشاهدة المزيد ←',
    types: {
      boarding: 'بوردنق باس',
      event: 'تذكرة فعالية',
      generic: 'بطاقة عامة',
      coupon: 'كوبون',
    },
  },
  demo: {
    label: 'شوف بنفسك',
    heading: 'هذي البطاقة اللي يشوفها عميلك',
    sub: 'في جيبه دايم — يفتحها بضغطة وحدة. تتحدّث تلقائي بكل طابع.',
    scrollHint: 'اسحب لليسار لمشاهدة المزيد ←',
  },
  // FIX C4: Replace fabricated testimonials with waitlist-style social proof
  testimonials: {
    label: 'كن من أوائل المحلات',
    heading: 'انضم لقائمة الانتظار',
    items: [
      { icon: '☕', title: 'مقاهي', desc: 'بطاقة ولاء رقمية تخلي عميلك يرجع لقهوته المفضلة — بدون بطاقة ورقية ولا تطبيق.' },
      { icon: '✂️', title: 'حلاقين وصالونات', desc: 'كل زيارة تتسجل تلقائي. العميل يكسب مكافأته بدون ما يتذكر يجيب البطاقة.' },
      { icon: '🍽️', title: 'مطاعم ومطابخ', desc: 'حوّل الطلبات المتكررة لبرنامج ولاء — العميل يحس بالتقدير ويرجع أكثر.' },
    ],
  },
  pricing: {
    label: 'كم السعر؟', heading: 'باقة وحدة. بدون لف ودوران.',
    price: '٧٥ ريال', period: '/ شهر', sub: 'أول شهر مجاني — بدون بطاقة بنكية',
    lines: ['شهر كامل تجربة مجانية — بدون بطاقة بنكية', 'ضمان استرداد كامل خلال ٣٠ يوم', 'عملاء بلا حدود · طوابع بلا حدود', 'دعم واتساب مباشر بالعربي'],
    cta: 'ابدأ شهرك المجاني', waLink: 'أو تواصل على واتساب',
    formPlaceholder: 'إيميلك أو رقم واتسابك',
    formBtn: 'ابدأ شهرك المجاني',
  },
  faq: {
    label: 'أسئلة شائعة', heading: 'عندك سؤال؟ عندنا الجواب',
    items: [
      { q: 'هل العميل يحتاج يحمّل تطبيق؟', a: 'لا أبداً. البطاقة تنزل على محفظة جواله مباشرة.' },
      { q: 'هل أحتاج جهاز خاص في المحل؟', a: 'لا. موظفك يمسح الطابع من جواله الشخصي.' },
      { q: 'كم ياخذ الإعداد؟', a: '٥ دقايق من التسجيل لأول طابع في نفس الجلسة.' },
      { q: 'وش يصير لو ما عجبني؟', a: 'ضمان استرداد كامل خلال ٣٠ يوم بدون أسئلة.' },
      { q: 'هل يناسب نوع محلي؟', a: 'إذا عندك عملاء يرجعون لك — وايا يناسبك.' },
      { q: 'هل فيه عقد أو التزام؟', a: 'لا. شهر بشهر، وتقدر تلغي أي وقت.' },
    ],
  },
  ctaBanner: { heading: 'جاهز تخلّ عملاءك يرجعون؟', sub: 'شهر مجاني كامل · بدون بطاقة بنكية · إلغاء أي وقت', waBtn: 'تواصل على واتساب', formLink: 'أو ابدأ مجاناً' },
  // FIX Q1: copyright 2025 → 2026
  footer: { tagline: 'أسهل برنامج ولاء للمحلات في السعودية', copy: '© 2026 وايا' },
  businessTypes: [
    { emoji: '☕', label: 'كافيهات' }, { emoji: '🍕', label: 'مطاعم' },
    { emoji: '✂️', label: 'حلاقين' }, { emoji: '💅', label: 'صالونات' },
    { emoji: '🧺', label: 'مغاسل' },  { emoji: '🍰', label: 'حلويات' },
    { emoji: '👗', label: 'بوتيكات' }, { emoji: '🥙', label: 'مطابخ' },
  ],
  stickyCta: 'ابدأ شهرك المجاني',
};

const EN = {
  nav: { logo: 'Waya', howLink: 'How It Works', pricingLink: 'Pricing', faqLink: 'FAQ', dashLink: 'Dashboard Demo', cta: 'Try Free', login: 'Log In', signup: 'Sign Up', logout: 'Log Out', hi: 'Hi' },
  hero: {
    badge: 'The Simplest Loyalty Program in Saudi Arabia',
    headline: 'Turn first-time visitors into loyal regulars',
    sub: 'A digital stamp card that lands in your customer\'s phone wallet — no app, no hardware, live in 5 minutes.',
    waBtn: 'or chat on WhatsApp',
    divider: 'or leave your details',
    phonePlaceholder: 'Your phone number (05XXXXXXXX)',
    emailPlaceholder: 'Your email',
    formBtn: 'Start My Free Month',
    trust: '1 full month free · No credit card needed · Cancel anytime',
    success: 'You\'re in! We\'ll contact you within 24 hours to activate your free account.',
    errEmail: 'Enter a valid email like name@example.com',
    errPhone: 'Enter a Saudi mobile number like 05XXXXXXXX or +9665XXXXXXXX',
    errGeneric: 'Please enter a valid email or Saudi mobile number',
    errBusiness: 'Please select your business type',
    sending: 'Sending...',
    submitAnother: 'Submit another',
    placeholder: 'Your email or WhatsApp number',
  },
  stats: [
    { label: 'month free', value: 1, suffix: '' },
    { label: 'minute setup', value: 5, suffix: '' },
    { label: 'SAR/month after trial', value: 75, suffix: '' },
  ],
  problem: {
    label: 'The Problem',
    heading: 'Small businesses lose customers without realising it',
    items: [
      { icon: '👥', title: 'Customers come once and disappear', desc: 'No way to bring them back — while your competitor already has a loyalty program running.' },
      { icon: '📋', title: 'Paper punch cards always get lost', desc: 'Customers forget them. Cards get damaged. Stamps never reach rewards.' },
      { icon: '😩', title: 'Other solutions are complex and expensive', desc: 'Hardware costs thousands, apps take months — not realistic for a small shop.' },
    ],
  },
  howItWorks: {
    label: 'How Waya Works',
    heading: '3 steps — that\'s it',
    steps: [
      { num: '1', title: 'Set up your card in 5 minutes', desc: 'Create your loyalty card, add your shop name, reward, and stamp count.' },
      { num: '2', title: 'Share the link with customers', desc: 'Customers tap the link and the card drops into Apple or Google Wallet. No downloads.' },
      { num: '3', title: 'Stamp and earn rewards', desc: 'Staff stamp from their own phone. Customer gets an instant notification.' },
    ],
  },
  benefits: {
    label: 'Why Waya?',
    heading: 'Everything you need — nothing extra',
    items: [
      { icon: '📲', title: 'No app for your customers', desc: 'Card drops straight into Apple or Google Wallet. One tap — done. No install, no sign-up.' },
      { icon: '🚫', title: 'No hardware to buy', desc: 'No POS, no devices. Staff stamps from their own phone. That\'s it.' },
      { icon: '⚡', title: 'Start today, not next month', desc: 'From signup to first stamp in 5 minutes. Simplest setup you\'ve ever seen.' },
      { icon: '📊', title: 'Know your customers', desc: 'See who returns most and how your business grows — from one simple dashboard.' },
    ],
  },
  passDesigns: {
    label: 'Pass Designs',
    heading: 'Professional Apple Wallet Pass Designs',
    sub: 'Choose the right design for your business — boarding pass, event ticket, coupon, or generic pass. All delivered straight to your customer\'s phone.',
    scrollHint: 'Swipe to see more →',
    types: {
      boarding: 'Boarding Pass',
      event: 'Event Ticket',
      generic: 'Generic Pass',
      coupon: 'Coupon',
    },
  },
  demo: {
    label: 'See It Live',
    heading: 'This is exactly what your customer sees',
    sub: 'Always in their pocket — one tap away. Updates automatically with every stamp.',
    scrollHint: 'Swipe to see more →',
  },
  // FIX C4: Replace fabricated testimonials with use-case cards
  testimonials: {
    label: 'Be One of the First',
    heading: 'Join the Waitlist',
    items: [
      { icon: '☕', title: 'Cafés', desc: 'A digital loyalty card that keeps customers coming back for their favourite brew — no paper, no app.' },
      { icon: '✂️', title: 'Barbers & Salons', desc: 'Every visit counts automatically. Customers earn rewards without remembering to bring a card.' },
      { icon: '🍽️', title: 'Restaurants & Kitchens', desc: 'Turn repeat orders into a loyalty program — customers feel valued and return more often.' },
    ],
  },
  pricing: {
    label: 'Pricing', heading: 'One plan. No surprises.',
    price: '75 SAR', period: '/ month', sub: 'First month free — no credit card needed',
    lines: ['1 full month free trial — no credit card required', 'Full 30-day money-back guarantee', 'Unlimited customers · stamps · rewards', 'Direct WhatsApp support'],
    cta: 'Start My Free Month', waLink: 'or chat on WhatsApp',
    formPlaceholder: 'Your email or WhatsApp number',
    formBtn: 'Start My Free Month',
  },
  faq: {
    label: 'FAQ', heading: 'Got questions? We\'ve got answers.',
    items: [
      { q: 'Do my customers need to download an app?', a: 'No. The card goes straight into their phone wallet. They tap a link — zero downloads.' },
      { q: 'Do I need any special hardware?', a: 'Not a thing. Your staff stamps from their own phone.' },
      { q: 'How long does setup take?', a: '5 minutes from signup to first stamp — in one sitting.' },
      { q: 'What if I don\'t like it?', a: 'Full money-back guarantee within 30 days. No questions.' },
      { q: 'Will it work for my type of business?', a: 'If customers come back to you — Waya works for you.' },
      { q: 'Is there a contract or commitment?', a: 'No. Month-to-month, cancel anytime with zero penalties.' },
    ],
  },
  ctaBanner: { heading: 'Ready to bring customers back?', sub: '1 full month free · No credit card · Cancel anytime', waBtn: 'Chat on WhatsApp', formLink: 'or start free' },
  footer: { tagline: 'The simplest loyalty program for businesses in Saudi Arabia', copy: '© 2026 Waya' },
  businessTypes: [
    { emoji: '☕', label: 'Cafes' }, { emoji: '🍕', label: 'Restaurants' },
    { emoji: '✂️', label: 'Barbers' }, { emoji: '💅', label: 'Salons' },
    { emoji: '🧺', label: 'Laundry' }, { emoji: '🍰', label: 'Bakeries' },
    { emoji: '👗', label: 'Boutiques' }, { emoji: '🥙', label: 'Kitchens' },
  ],
  stickyCta: 'Start My Free Month',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
// FIX H2: Accept +966, 00966, spaces, dashes — normalize before validation
function normalizePhone(v: string): string {
  let s = v.replace(/[\s\-()]/g, '');
  if (s.startsWith('+966')) s = '0' + s.slice(4);
  if (s.startsWith('00966')) s = '0' + s.slice(5);
  if (s.startsWith('966') && s.length === 12) s = '0' + s.slice(3);
  return s;
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isPhone(v: string): boolean {
  return /^05\d{8}$/.test(normalizePhone(v));
}

function validate(v: string): 'email' | 'phone' | false {
  const s = v.trim();
  if (isEmail(s)) return 'email';
  if (isPhone(s)) return 'phone';
  return false;
}

// FIX H5: Determine specific error message
function getFieldError(v: string, t: typeof AR['hero']): string {
  const s = v.trim();
  if (!s) return t.errGeneric;
  if (s.includes('@')) return t.errEmail;
  if (/\d/.test(s)) return t.errPhone;
  return t.errGeneric;
}

function WaIcon({ size = 20, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" focusable="false">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.855L.053 23.294a1 1 0 001.207 1.249l5.652-1.483A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.04-1.394l-.36-.214-3.732.979.996-3.638-.234-.374A9.818 9.818 0 112 12 9.818 9.818 0 0021.818 12z" />
    </svg>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-block', background: C.lime, border: C.border, borderRadius: 7, padding: '4px 12px', fontSize: 14, fontWeight: 500, color: C.dark, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

function Star({ color = C.dark, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2L12 22M2 12L22 12M4.93 4.93L19.07 19.07M19.07 4.93L4.93 19.07" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── QR Code SVG ──────────────────────────────────────────────────────────────
function QrCode({ size = 100, fg = '#000' }: { size?: number; fg?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-label="QR code">
      <rect x="1" y="1" width="9" height="9" rx="1.5" fill={fg} />
      <rect x="2.5" y="2.5" width="6" height="6" rx="0.5" fill="#fff" />
      <rect x="4" y="4" width="3" height="3" fill={fg} />
      <rect x="20" y="1" width="9" height="9" rx="1.5" fill={fg} />
      <rect x="21.5" y="2.5" width="6" height="6" rx="0.5" fill="#fff" />
      <rect x="23" y="4" width="3" height="3" fill={fg} />
      <rect x="1" y="20" width="9" height="9" rx="1.5" fill={fg} />
      <rect x="2.5" y="21.5" width="6" height="6" rx="0.5" fill="#fff" />
      <rect x="4" y="23" width="3" height="3" fill={fg} />
      <rect x="12" y="1" width="2" height="2" fill={fg} /><rect x="15" y="1" width="2" height="2" fill={fg} />
      <rect x="12" y="4" width="3" height="2" fill={fg} /><rect x="16" y="6" width="2" height="3" fill={fg} />
      <rect x="12" y="8" width="2" height="2" fill={fg} />
      <rect x="1" y="12" width="2" height="2" fill={fg} /><rect x="4" y="12" width="3" height="2" fill={fg} />
      <rect x="8" y="11" width="2" height="3" fill={fg} />
      <rect x="11" y="12" width="3" height="2" fill={fg} /><rect x="15" y="11" width="2" height="3" fill={fg} />
      <rect x="18" y="12" width="3" height="2" fill={fg} /><rect x="22" y="12" width="2" height="2" fill={fg} />
      <rect x="25" y="11" width="4" height="3" fill={fg} />
      <rect x="11" y="15" width="3" height="2" fill={fg} /><rect x="15" y="15" width="2" height="2" fill={fg} />
      <rect x="18" y="15" width="2" height="2" fill={fg} /><rect x="22" y="15" width="3" height="2" fill={fg} />
      <rect x="1" y="16" width="2" height="2" fill={fg} /><rect x="4" y="15" width="2" height="3" fill={fg} />
      <rect x="20" y="18" width="3" height="2" fill={fg} /><rect x="25" y="19" width="2" height="2" fill={fg} />
      <rect x="20" y="21" width="2" height="2" fill={fg} /><rect x="23" y="22" width="4" height="5" fill={fg} />
      <rect x="11" y="20" width="3" height="2" fill={fg} /><rect x="15" y="19" width="2" height="3" fill={fg} />
      <rect x="11" y="23" width="2" height="4" fill={fg} /><rect x="14" y="25" width="4" height="2" fill={fg} />
    </svg>
  );
}

// ─── Apple Wallet Pass Designs (from Figma CSS export) ────────────────────────
// These components render the 4 Apple Wallet pass types: Boarding, Event, Generic, Coupon

const PASS_W = 295;
const PASS_RADIUS = 11;
const PASS_FONT = '-apple-system, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif';

function PassField({ label, value, align = 'left', light = true, small = false }: {
  label: string; value: string; align?: 'left' | 'right' | 'center'; light?: boolean; small?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start', gap: 2, minWidth: 0 }}>
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: light ? 'rgba(255,255,255,0.68)' : 'rgba(0,0,0,0.45)', lineHeight: '10px', whiteSpace: 'nowrap', fontFamily: PASS_FONT }}>{label}</span>
      <span style={{ fontSize: small ? 15 : 17, fontWeight: small ? 400 : 400, color: light ? '#fff' : '#000', lineHeight: '20px', fontFamily: PASS_FONT }}>{value}</span>
    </div>
  );
}

function PassQrBlock({ bg = '#fff' }: { bg?: string }) {
  return (
    <div style={{ background: bg, padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <QrCode size={80} fg="#000" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#000" aria-hidden="true">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.17 1.28-2.15 3.8.03 3.02 2.65 4.03 2.68 4.04l-.08.28zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
        <span style={{ fontSize: 10, color: '#8E8E93', fontWeight: 500, fontFamily: PASS_FONT }}>Apple Wallet</span>
      </div>
    </div>
  );
}

// ── Boarding Pass (Blue theme #3295C9) ──
function BoardingPassCard() {
  const theme = '#3295C9';
  return (
    <div style={{ width: PASS_W, borderRadius: PASS_RADIUS, overflow: 'visible', fontFamily: PASS_FONT, position: 'relative', flexShrink: 0 }}>
      {/* Background */}
      <div style={{ background: theme, borderRadius: PASS_RADIUS, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.16)' }}>
        {/* Header Area */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Waya Airlines</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <PassField label="FLIGHT" value="WY 42" align="right" />
            <PassField label="GATE" value="B7" align="right" />
          </div>
        </div>

        {/* Primary Fields — departure / arrival */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.68)', fontFamily: PASS_FONT }}>DEPART FROM</span>
            <div style={{ fontSize: 36, fontWeight: 300, color: '#fff', lineHeight: 1.2 }}>RUH</div>
          </div>
          {/* Airplane icon */}
          <div style={{ padding: '8px 8px 0' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff" style={{ transform: 'rotate(90deg)' }}><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.68)', fontFamily: PASS_FONT }}>ARRIVE AT</span>
            <div style={{ fontSize: 36, fontWeight: 300, color: '#fff', lineHeight: 1.2 }}>DXB</div>
          </div>
        </div>

        {/* Auxiliary + Secondary Fields */}
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <PassField label="PASSENGER" value="Sultan H." />
            <PassField label="DATE" value="15 Apr" align="center" />
            <PassField label="SEAT" value="12A" align="right" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <PassField label="BOARDING" value="10:30 AM" />
            <PassField label="CLASS" value="Business" align="center" />
            <PassField label="ZONE" value="1" align="right" />
          </div>
        </div>
      </div>

      {/* Side cuts */}
      <div style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: '#F3F3F3', right: -5, top: 122 }} />
      <div style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: '#F3F3F3', left: -5, top: 122 }} />

      {/* QR Code area (white bottom) */}
      <div style={{ background: '#fff', borderRadius: `0 0 ${PASS_RADIUS}px ${PASS_RADIUS}px`, border: '1px solid rgba(0,0,0,0.16)', borderTop: 'none', marginTop: -1 }}>
        <PassQrBlock />
      </div>
    </div>
  );
}

// ── Event Ticket (Red theme #F26D5F) ──
function EventTicketCard() {
  const theme = '#F26D5F';
  return (
    <div style={{ width: PASS_W, borderRadius: PASS_RADIUS, overflow: 'visible', fontFamily: PASS_FONT, position: 'relative', flexShrink: 0 }}>
      <div style={{ background: theme, borderRadius: PASS_RADIUS, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.16)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎵</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Waya Events</span>
          </div>
          <PassField label="ROW" value="A" align="right" />
        </div>

        {/* Strip / banner area */}
        <div style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.15) 0%, transparent 100%)', padding: '20px 16px', position: 'relative' }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.68)', marginBottom: 4, fontFamily: PASS_FONT }}>EVENT</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>Riyadh Music Fest</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>Season 2026</div>
        </div>

        {/* Fields */}
        <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <PassField label="DATE" value="25 Apr 2026" />
            <PassField label="TIME" value="8:00 PM" align="center" />
            <PassField label="SEAT" value="A12" align="right" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <PassField label="VENUE" value="Boulevard" />
            <PassField label="TICKET" value="VIP" align="right" />
          </div>
        </div>
      </div>

      {/* Top cut */}
      <div style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: '#F3F3F3', left: '50%', top: -5, transform: 'translateX(-50%)' }} />

      {/* QR */}
      <div style={{ background: '#fff', borderRadius: `0 0 ${PASS_RADIUS}px ${PASS_RADIUS}px`, border: '1px solid rgba(0,0,0,0.16)', borderTop: 'none', marginTop: -1 }}>
        <PassQrBlock />
      </div>
    </div>
  );
}

// ── Generic Pass (Green theme #50BE3D) ──
function GenericPassCard() {
  const theme = '#50BE3D';
  return (
    <div style={{ width: PASS_W, borderRadius: PASS_RADIUS, overflow: 'hidden', fontFamily: PASS_FONT, border: '1px solid rgba(0,0,0,0.16)', flexShrink: 0 }}>
      <div style={{ background: theme }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>☕</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Waya Loyalty</span>
          </div>
          <PassField label="POINTS" value="750" align="right" />
        </div>

        {/* Primary with thumbnail */}
        <div style={{ padding: '12px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.68)', fontFamily: PASS_FONT }}>MEMBER</span>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>Sultan Haidar</div>
          </div>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>👤</div>
        </div>

        {/* Secondary + Auxiliary */}
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <PassField label="TIER" value="Gold" />
            <PassField label="SINCE" value="Jan 2024" align="center" />
            <PassField label="VISITS" value="42" align="right" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <PassField label="REWARD" value="Free Coffee" />
            <PassField label="NEXT AT" value="1,000 pts" align="right" />
          </div>
        </div>
      </div>

      {/* QR */}
      <div style={{ background: '#fff', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <PassQrBlock />
      </div>
    </div>
  );
}

// ── Coupon (Amber theme #FCAD00) ──
function CouponPassCard() {
  const theme = '#FCAD00';
  return (
    <div style={{ width: PASS_W, borderRadius: PASS_RADIUS, overflow: 'visible', fontFamily: PASS_FONT, position: 'relative', flexShrink: 0 }}>
      <div style={{ background: theme, borderRadius: PASS_RADIUS, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.16)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎫</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Waya Rewards</span>
          </div>
          <PassField label="CODE" value="WAYA25" align="right" />
        </div>

        {/* Strip / main area */}
        <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 6, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>25% OFF</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Your next purchase</div>
        </div>

        {/* Fields */}
        <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <PassField label="VALID FROM" value="1 Apr 2026" />
            <PassField label="EXPIRES" value="30 Apr 2026" align="right" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <PassField label="LOCATION" value="All Branches" />
            <PassField label="MIN. SPEND" value="50 SAR" align="right" />
          </div>
        </div>
      </div>

      {/* Dotted top cut */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={`t${i}`} style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: '#F3F3F3', top: -2, left: 12 + i * ((PASS_W - 24) / 14) }} />
      ))}
      {/* Dotted bottom cut */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={`b${i}`} style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: '#F3F3F3', bottom: -2, left: 12 + i * ((PASS_W - 24) / 14) }} />
      ))}

      {/* QR */}
      <div style={{ background: '#fff', borderRadius: `0 0 ${PASS_RADIUS}px ${PASS_RADIUS}px`, border: '1px solid rgba(0,0,0,0.16)', borderTop: 'none', marginTop: -1 }}>
        <PassQrBlock />
      </div>
    </div>
  );
}

// ─── Apple Wallet Store Card ───────────────────────────────────────────────────
interface PassData {
  shopName: string;
  orgName: string;
  emoji: string;
  stripColor: string;
  accent: string;
  stamps: number;
  total: number;
  reward: string;
  stampLabel: string;
  rewardLabel: string;
  memberLabel: string;
  memberValue: string;
  scanLabel: string;
  animate?: boolean;
}

function WalletPass({ pass, width = 295 }: { pass: PassData; width?: number }) {
  const [live, setLive] = useState(pass.stamps);
  useEffect(() => {
    if (!pass.animate) return;
    const id = setInterval(() => setLive(p => (p >= pass.total ? 1 : p + 1)), 950);
    return () => clearInterval(id);
  }, [pass.animate, pass.total]);
  const count = pass.animate ? live : pass.stamps;

  return (
    <div style={{
      width,
      borderRadius: 16,
      overflow: 'hidden',
      background: '#fff',
      boxShadow: '0 8px 28px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)',
      fontFamily: '-apple-system, "SF Pro Text", "Space Grotesk", sans-serif',
      userSelect: 'none',
      flexShrink: 0,
    }}>

      {/* ── Section 1: Logo Header ── */}
      <div style={{ background: '#fff', padding: '12px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid #E5E5EA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: pass.stripColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
            {pass.emoji}
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#000', letterSpacing: -0.2 }}>{pass.shopName}</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: pass.accent, letterSpacing: 0.6, textTransform: 'uppercase', background: `${pass.accent}18`, borderRadius: 20, padding: '2px 8px' }}>
          Loyalty
        </div>
      </div>

      {/* ── Section 2: Strip ── */}
      <div style={{ background: pass.stripColor, padding: '18px 16px 16px', position: 'relative', overflow: 'hidden', minHeight: 110 }}>
        <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: pass.accent, opacity: 0.07, top: -30, right: -30, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 70, height: 70, borderRadius: '50%', background: pass.accent, opacity: 0.1, bottom: -20, left: 40, pointerEvents: 'none' }} />
        <div style={{ fontSize: 9, color: `${pass.accent}99`, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>{pass.orgName} · Loyalty</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: -0.5, marginBottom: 16 }}>{pass.shopName}</div>
        <div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>{pass.stampLabel}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: pass.total }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < count ? pass.accent : 'rgba(255,255,255,0.12)', transition: 'background 0.3s ease', boxShadow: i === count - 1 ? `0 0 6px ${pass.accent}` : 'none' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>0</span>
            <span style={{ fontSize: 10, color: pass.accent, fontWeight: 700 }}>{count}/{pass.total}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{pass.total}</span>
          </div>
        </div>
      </div>

      {/* ── Section 3: Secondary Fields ── */}
      <div style={{ background: '#fff', padding: '12px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
        <div>
          <div style={{ fontSize: 9, color: '#8E8E93', fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>{pass.memberLabel}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#000' }}>{pass.memberValue}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#8E8E93', fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>{pass.rewardLabel}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#000', lineHeight: 1.3 }}>{pass.reward}</div>
        </div>
      </div>

      {/* ── Section 4: Primary Field (stamp dots) ── */}
      <div style={{ padding: '14px 16px 12px', background: '#fff' }}>
        <div style={{ fontSize: 9, color: '#8E8E93', fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>{pass.stampLabel}</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {Array.from({ length: pass.total }).map((_, i) => (
            <div key={i} style={{
              width: Math.floor((width - 32 - (pass.total - 1) * 5) / pass.total),
              height: Math.floor((width - 32 - (pass.total - 1) * 5) / pass.total),
              borderRadius: '50%',
              background: i < count ? pass.stripColor : '#E5E5EA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.3s ease, transform 0.2s ease',
              transform: i === count - 1 ? 'scale(1.15)' : 'scale(1)',
              flexShrink: 0,
            }}>
              {i < count && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l1.8 1.8L6.5 2" stroke={pass.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 5: Barcode ── */}
      <div style={{ borderTop: '0.5px solid #E5E5EA', background: '#fff', padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ fontSize: 9, color: '#8E8E93', fontWeight: 500, letterSpacing: 0.3, marginBottom: 2 }}>{pass.scanLabel}</div>
        <QrCode size={80} fg="#000" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#000" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.17 1.28-2.15 3.8.03 3.02 2.65 4.03 2.68 4.04l-.08.28zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <span style={{ fontSize: 10, color: '#8E8E93', fontWeight: 500 }}>Apple Wallet</span>
        </div>
      </div>
    </div>
  );
}

// ─── iPhone 15 Frame ──────────────────────────────────────────────────────────
function IPhoneFrame({ children, width = 280, float = false }: { children: React.ReactNode; width?: number; float?: boolean }) {
  const scale = width / 393;
  const height = Math.round(852 * scale);
  const radius = Math.round(50 * scale);
  const screenRadius = Math.round(44 * scale);
  const diWidth = Math.round(120 * scale);
  const diHeight = Math.round(34 * scale);
  const [time, setTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setTime(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={float ? 'animate-float' : ''} style={{ flexShrink: 0 }}>
      <div style={{ width, height, background: '#1A1A1A', borderRadius: radius, boxShadow: '0 40px 80px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -2, top: Math.round(130 * scale), width: 3, height: Math.round(60 * scale), background: '#2C2C2C', borderRadius: '0 2px 2px 0' }} />
        <div style={{ position: 'absolute', left: -2, top: Math.round(100 * scale), width: 3, height: Math.round(36 * scale), background: '#2C2C2C', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: -2, top: Math.round(150 * scale), width: 3, height: Math.round(60 * scale), background: '#2C2C2C', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: -2, top: Math.round(224 * scale), width: 3, height: Math.round(60 * scale), background: '#2C2C2C', borderRadius: '2px 0 0 2px' }} />

        <div style={{ position: 'absolute', inset: 2, borderRadius: screenRadius, background: '#F2F2F7', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flexShrink: 0, height: Math.round(54 * scale), background: '#F2F2F7', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: `0 ${Math.round(20 * scale)}px ${Math.round(8 * scale)}px` }}>
            <span style={{ fontSize: Math.round(13 * scale), fontWeight: 700, color: '#000', fontFamily: '-apple-system, sans-serif', letterSpacing: -0.3 }}>{time}</span>
            <div style={{ position: 'absolute', top: Math.round(10 * scale), left: '50%', transform: 'translateX(-50%)', width: diWidth, height: diHeight, background: '#1A1A1A', borderRadius: 999 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(4 * scale) }}>
              <svg width={Math.round(16 * scale)} height={Math.round(10 * scale)} viewBox="0 0 16 10">
                <rect x="0.5" y="0.5" width="13" height="9" rx="2" stroke="#000" strokeWidth="1" fill="none"/>
                <rect x="13.5" y="3" width="2" height="4" rx="1" fill="#000"/>
                <rect x="1.5" y="1.5" width="9" height="7" rx="1" fill="#000"/>
              </svg>
            </div>
          </div>

          <div style={{ flexShrink: 0, padding: `${Math.round(2 * scale)}px ${Math.round(20 * scale)}px ${Math.round(10 * scale)}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F2F2F7' }}>
            <span style={{ fontSize: Math.round(13 * scale), color: '#007AFF', fontFamily: '-apple-system, sans-serif' }}>Wallet</span>
            <span style={{ fontSize: Math.round(17 * scale), fontWeight: 700, color: '#000', fontFamily: '-apple-system, sans-serif' }}>My Cards</span>
            <span style={{ fontSize: Math.round(13 * scale), color: '#007AFF', fontFamily: '-apple-system, sans-serif' }}>Done</span>
          </div>

          <div style={{ flex: 1, overflow: 'hidden', padding: `${Math.round(4 * scale)}px ${Math.round(16 * scale)}px`, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: 295, flexShrink: 0 }}>
              {children}
            </div>
          </div>

          <div style={{ flexShrink: 0, height: Math.round(30 * scale), background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: Math.round(130 * scale), height: Math.round(5 * scale), borderRadius: 99, background: '#C7C7CC' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// FIX Q6: Added aria-controls to FAQ buttons
function FaqItem({ q, a, ff, index }: { q: string; a: string; ff: string; index: number }) {
  const [open, setOpen] = useState(false);
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-btn-${index}`;
  return (
    <div style={{ border: C.border, borderRadius: 14, overflow: 'hidden', boxShadow: open ? C.shadow : 'none', transition: 'box-shadow 0.2s ease' }}>
      <button
        id={buttonId}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="waya-faq-btn"
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: open ? C.lime : C.gray, border: 'none', cursor: 'pointer', fontFamily: ff, fontSize: 16, fontWeight: 600, color: C.dark, textAlign: 'inherit', gap: 16 }}
      >
        <span>{q}</span>
        <span style={{ fontSize: 22, fontWeight: 300, lineHeight: 1, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', display: 'inline-block' }}>+</span>
      </button>
      {open && (
        <div id={panelId} role="region" aria-labelledby={buttonId} style={{ padding: '16px 22px 20px', background: C.white, fontSize: 15, lineHeight: 1.75, color: C.muted, borderTop: C.border }}>
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Reusable Lead Form (multi-field: phone/email + business type) ────────────
function LeadForm({
  id,
  t,
  isRtl,
  ff,
  compact = false,
}: {
  id: string;
  t: typeof AR;
  isRtl: boolean;
  ff: string;
  compact?: boolean;
}) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bizType, setBizType] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);

  const bizOptions = isRtl ? BUSINESS_TYPES_AR : BUSINESS_TYPES_EN;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;

    // Validate: need at least phone OR email, and business type
    const hasPhone = phone.trim() && isPhone(phone);
    const hasEmail = email.trim() && isEmail(email);
    const phoneAttempted = phone.trim().length > 0;
    const emailAttempted = email.trim().length > 0;

    if (!hasPhone && !hasEmail) {
      if (phoneAttempted && !hasPhone) {
        setFormError(t.hero.errPhone);
      } else if (emailAttempted && !hasEmail) {
        setFormError(t.hero.errEmail);
      } else {
        setFormError(t.hero.errGeneric);
      }
      return;
    }

    if (!bizType) {
      setFormError((t.hero as any).errBusiness || 'Please select your business type');
      return;
    }

    setSending(true);
    setFormError('');

    try {
      const lead = {
        phone: hasPhone ? phone.trim() : '',
        email: hasEmail ? email.trim() : '',
        businessType: bizType,
        timestamp: new Date().toISOString(),
        lang: isRtl ? 'ar' : 'en',
      };

      try {
        await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        });
      } catch {
        console.log('[Waya Lead Captured]', lead);
      }

      setFormSuccess(true);
      setFormError('');
    } catch {
      setFormError(t.hero.errGeneric);
    } finally {
      setSending(false);
    }
  }

  if (formSuccess) {
    return (
      <div style={{ background: C.lime, border: C.border, borderRadius: 14, padding: '20px 24px', fontWeight: 600, color: C.dark, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 16 }}>{t.hero.success}</span>
        <button
          onClick={() => { setFormSuccess(false); setPhone(''); setEmail(''); setBizType(''); setTouchedPhone(false); setTouchedEmail(false); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff, fontSize: 13, color: C.dark, textDecoration: 'underline', textAlign: isRtl ? 'right' : 'left', padding: 0 }}
        >
          {t.hero.submitAnother}
        </button>
      </div>
    );
  }

  const inputStyle = (hasError: boolean, isValid: boolean): React.CSSProperties => ({
    border: hasError ? '1px solid #ef4444' : isValid ? '1px solid #22c55e' : C.border,
    borderRadius: 14,
    padding: '14px 18px',
    fontSize: compact ? 14 : 16,
    outline: 'none',
    fontFamily: ff,
    background: C.white,
    color: C.dark,
    width: '100%',
  });

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Phone field */}
      <div>
        <label htmlFor={`${id}-phone`} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 4 }}>
          {isRtl ? 'رقم الجوال' : 'Phone number'} <span style={{ color: C.muted, fontWeight: 400 }}>({isRtl ? 'أو الإيميل بالأسفل' : 'or email below'})</span>
        </label>
        <input
          id={`${id}-phone`}
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={e => { setPhone(e.target.value); setFormError(''); }}
          onBlur={() => setTouchedPhone(true)}
          placeholder={(t.hero as any).phonePlaceholder || '05XXXXXXXX'}
          dir="ltr"
          className="waya-input"
          style={inputStyle(
            touchedPhone && phone.trim().length > 0 && !isPhone(phone),
            touchedPhone && isPhone(phone)
          )}
        />
      </div>

      {/* Email field */}
      <div>
        <label htmlFor={`${id}-email`} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 4 }}>
          {isRtl ? 'الإيميل' : 'Email'}
        </label>
        <input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setFormError(''); }}
          onBlur={() => setTouchedEmail(true)}
          placeholder={(t.hero as any).emailPlaceholder || 'name@example.com'}
          dir="ltr"
          className="waya-input"
          style={inputStyle(
            touchedEmail && email.trim().length > 0 && !isEmail(email),
            touchedEmail && isEmail(email)
          )}
        />
      </div>

      {/* Business type dropdown */}
      <div>
        <label htmlFor={`${id}-biz`} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 4 }}>
          {isRtl ? 'نوع النشاط' : 'Business type'}
        </label>
        <select
          id={`${id}-biz`}
          value={bizType}
          onChange={e => { setBizType(e.target.value); setFormError(''); }}
          className="waya-input"
          style={{
            ...inputStyle(false, !!bizType),
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23191A23' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: isRtl ? '16px center' : 'calc(100% - 16px) center',
            paddingRight: isRtl ? undefined : 40,
            paddingLeft: isRtl ? 40 : undefined,
            cursor: 'pointer',
            color: bizType ? C.dark : C.muted,
          }}
        >
          {bizOptions.map(opt => (
            <option key={opt.value} value={opt.value} disabled={!opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Submit button — big, lime, prominent */}
      <button
        type="submit"
        disabled={sending}
        className="waya-btn"
        style={{
          background: C.lime,
          color: C.dark,
          border: C.border,
          borderRadius: 14,
          padding: '16px 24px',
          fontSize: 17,
          fontWeight: 700,
          cursor: sending ? 'wait' : 'pointer',
          boxShadow: C.shadow,
          fontFamily: ff,
          opacity: sending ? 0.7 : 1,
          transition: 'opacity 0.2s ease',
          whiteSpace: 'nowrap',
          marginTop: 4,
        }}
      >
        {sending ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="rgba(0,0,0,0.2)" strokeWidth="2" fill="none" />
              <path d="M8 2a6 6 0 014.5 2" stroke={C.dark} strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
            {t.hero.sending}
          </span>
        ) : (compact ? t.pricing.formBtn : t.hero.formBtn)}
      </button>

      {/* Trust line below button */}
      {!compact && (
        <p style={{ fontSize: 12, color: C.muted, margin: 0, textAlign: 'center', lineHeight: 1.6 }}>{t.hero.trust}</p>
      )}

      {formError && <p id={`${id}-error`} role="alert" style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{formError}</p>}
    </form>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const { user, signOut } = useAuth();

  const t = lang === 'ar' ? AR : EN;
  const isRtl = lang === 'ar';
  const heroRef = useRef<HTMLElement>(null);
  const ff = isRtl ? '"Cairo", sans-serif' : '"Space Grotesk", "DM Sans", sans-serif';
  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const scrollToForm = () => { setMenuOpen(false); heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };

  const inner = { maxWidth: 1240, margin: '0 auto' };
  const pad = '80px 20px';

  return (
    <div style={{ fontFamily: ff, background: C.white, color: C.dark, overflowX: 'hidden' }} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* FIX Q4: Skip to content link */}
      <a href="#hero" className="sr-only" style={{
        position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap',
      }}>
        {isRtl ? 'انتقل للمحتوى' : 'Skip to content'}
      </a>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav style={{ background: C.white, borderBottom: C.border, position: 'fixed', top: 0, width: '100%', zIndex: 50, boxSizing: 'border-box' }}>
        <div style={{ ...inner, padding: '0 20px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" className="waya-logo" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <span style={{ background: C.dark, color: C.lime, padding: '4px 12px', borderRadius: 7, fontSize: 20, fontWeight: 700, letterSpacing: isRtl ? 0 : 1, display: 'block' }}>{t.nav.logo}</span>
          </a>
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 24 }}>
            {[{ label: t.nav.howLink, id: 'how-it-works' }, { label: t.nav.pricingLink, id: 'pricing' }, { label: t.nav.faqLink, id: 'faq' }].map(link => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className="waya-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: C.muted, fontFamily: ff, padding: '4px 0' }}>{link.label}</button>
            ))}
            <button onClick={() => navigate('/dashboard')} style={{ background: C.lime, border: C.border, borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff, color: C.dark }}>
              {t.nav.dashLink}
            </button>
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff }}>
              <Globe size={14} />{lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            {user ? (
              <>
                <span style={{ fontSize: 13, color: C.dark, fontWeight: 600 }}>{t.nav.hi}, {displayName}</span>
                <button onClick={() => signOut()} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: C.border, borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: ff, color: C.muted }}>
                  <LogOut size={14} />{t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C.dark, fontFamily: ff, padding: '4px 0' }}>
                  <LogIn size={14} />{t.nav.login}
                </button>
                <button onClick={() => navigate('/signup')} className="waya-btn" style={{ background: C.dark, color: C.white, border: C.border, borderRadius: 12, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: C.shadow, fontFamily: ff }}>
                  {t.nav.signup}
                </button>
              </>
            )}
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(o => !o)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <div style={{ background: C.white, borderTop: C.border, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[{ label: t.nav.howLink, id: 'how-it-works' }, { label: t.nav.pricingLink, id: 'pricing' }, { label: t.nav.faqLink, id: 'faq' }].map(link => (
              <button key={link.id} onClick={() => scrollTo(link.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 500, color: C.dark, fontFamily: ff, textAlign: isRtl ? 'right' : 'left', padding: '6px 0' }}>{link.label}</button>
            ))}
            <button onClick={() => { setMenuOpen(false); navigate('/dashboard'); }} style={{ background: C.lime, border: C.border, borderRadius: 12, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: ff, color: C.dark }}>{t.nav.dashLink}</button>
            {user ? (
              <>
                <div style={{ fontSize: 14, color: C.dark, fontWeight: 600, textAlign: 'center', padding: '6px 0' }}>{t.nav.hi}, {displayName}</div>
                <button onClick={() => { setMenuOpen(false); signOut(); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: C.gray, border: C.border, borderRadius: 12, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: ff, color: C.dark }}>
                  <LogOut size={16} />{t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setMenuOpen(false); navigate('/login'); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: C.gray, border: C.border, borderRadius: 12, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: ff, color: C.dark }}>
                  <LogIn size={16} />{t.nav.login}
                </button>
                <button onClick={() => { setMenuOpen(false); navigate('/signup'); }} className="waya-btn" style={{ background: C.dark, color: C.white, border: 'none', borderRadius: 12, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: ff, boxShadow: C.shadow }}>
                  <UserPlus size={16} style={{ display: 'inline', verticalAlign: 'middle', marginInlineEnd: 6 }} />{t.nav.signup}
                </button>
              </>
            )}
            <button onClick={() => { setLang(lang === 'ar' ? 'en' : 'ar'); setMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff }}>
              <Globe size={14} />{lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section ref={heroRef} id="hero" style={{ paddingTop: 68 }}>
        <div style={{ ...inner, padding: '60px 20px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="fade-up"><Label>{t.hero.badge}</Label></div>
              <h1 className="fade-up delay-100" style={{ fontSize: 'clamp(34px, 5.5vw, 62px)', fontWeight: 700, lineHeight: 1.12, margin: 0 }}>{t.hero.headline}</h1>
              <p className="fade-up delay-200" style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, margin: 0, maxWidth: 480 }}>{t.hero.sub}</p>

              <div className="fade-up delay-300" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Lead capture form is the PRIMARY CTA */}
                <LeadForm id="hero" t={t} isRtl={isRtl} ff={ff} />

                {/* WhatsApp as secondary option — low-key text link */}
                <a href={WA_URL} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, color: C.muted, textDecoration: 'none', fontFamily: ff, padding: '4px 0' }}>
                  <WaIcon size={16} color={C.muted} />
                  <span style={{ borderBottom: '1px solid #e0e0e0' }}>{t.hero.waBtn}</span>
                </a>
              </div>
            </div>

            {/* FIX Q2: Added role="img" and aria-label to hero phone mockup */}
            <div className="fade-up delay-400" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
              role="img"
              aria-label={isRtl
                ? 'آيفون يعرض بطاقة ولاء وايا في محفظة Apple مع ٧ من ١٠ طوابع محصّلة'
                : 'iPhone showing a Waya loyalty stamp card in Apple Wallet with 7 out of 10 stamps collected'
              }
            >
              {/* Removed glowing breathe animation — static subtle background instead */}
              <div style={{ position: 'absolute', width: 260, height: 260, background: C.lime, borderRadius: '50%', zIndex: 0, opacity: 0.15 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <IPhoneFrame width={270} float>
                  <WalletPass pass={{
                    shopName: isRtl ? 'مقهى العلا' : 'Al-Ula Café',
                    orgName: 'Waya',
                    emoji: '☕',
                    stripColor: '#1C1C2E',
                    accent: C.lime,
                    stamps: 7, total: 10,
                    reward: isRtl ? 'قهوة مجانية' : 'Free Coffee',
                    stampLabel: isRtl ? 'الطوابع' : 'Stamps',
                    rewardLabel: isRtl ? 'المكافأة' : 'Reward',
                    memberLabel: isRtl ? 'عضو منذ' : 'Member Since',
                    memberValue: '2024',
                    scanLabel: isRtl ? 'امسح للحصول على طوابعك' : 'Scan to earn stamps',
                    animate: true,
                  }} />
                </IPhoneFrame>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP (animated counters) ─────────────────────────────────── */}
      <div style={{ background: C.dark, borderTop: C.border, borderBottom: C.border }}>
        <div style={{ ...inner }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {t.stats.map((stat, i) => (
              <div key={i} className="waya-stat" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, borderInlineEnd: i < t.stats.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                <span style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: C.lime, lineHeight: 1 }}>
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.4 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BUSINESS TYPES MARQUEE ──────────────────────────────────────────── */}
      <div style={{ background: C.gray, borderBottom: C.border, padding: '36px 0', overflow: 'hidden' }}
        role="region" aria-label={isRtl ? 'أنواع المحلات المدعومة' : 'Supported business types'}
      >
        <div className="marquee-track" aria-hidden="true">
          {[...t.businessTypes, ...t.businessTypes].map((shop, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '0 28px', flexShrink: 0 }}>
              <div className="waya-biz-circle" style={{ width: 72, height: 72, borderRadius: '50%', background: C.white, border: `2px solid ${C.dark}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '3px 3px 0 #191A23' }}>
                {shop.emoji}
              </div>
              <span style={{ fontSize: 12, color: C.dark, fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>{shop.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROBLEM ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: pad }}>
        <div style={inner}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
              <Label>{t.problem.label}</Label>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 700, margin: 0 }}>{t.problem.heading}</h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {t.problem.items.map((item, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="waya-card" style={{ background: C.gray, border: C.border, borderRadius: 16, padding: '32px 28px', boxShadow: C.shadow, display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
                  <span style={{ fontSize: 36, lineHeight: 1 }}>{item.icon}</span>
                  <h3 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{item.title}</h3>
                  <p style={{ fontSize: 15, color: C.muted, margin: 0, lineHeight: 1.65 }}>{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: C.dark, borderTop: C.border, borderBottom: C.border, padding: pad }}>
        <div style={inner}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, flexWrap: 'wrap' }}>
              <Label>{t.howItWorks.label}</Label>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 700, color: C.white, margin: 0 }}>{t.howItWorks.heading}</h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
            {t.howItWorks.steps.map((step, i) => (
              <Reveal key={i} delay={i * 150}>
                <div className="waya-step" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ width: 52, height: 52, background: i === 0 ? C.lime : 'rgba(255,255,255,0.08)', border: i === 0 ? C.border : '1px solid rgba(255,255,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: i === 0 ? C.dark : C.white }}>
                    {step.num}
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: C.white, lineHeight: 1.3 }}>{step.title}</h3>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ────────────────────────────────────────────────────────── */}
      <section style={{ padding: pad }}>
        <div style={inner}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
              <Label>{t.benefits.label}</Label>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 700, margin: 0 }}>{t.benefits.heading}</h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {t.benefits.items.map((item, i) => {
              const bgPalette = [C.gray, C.dark, C.lime, C.gray];
              const light = i === 1;
              return (
                <Reveal key={i} delay={i * 100}>
                  <div className="waya-card" style={{ background: bgPalette[i], border: C.border, borderRadius: 16, padding: '32px 28px', boxShadow: C.shadow, display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 36, lineHeight: 1 }}>{item.icon}</span>
                      <Star color={light ? C.lime : C.dark} size={22} />
                    </div>
                    <h3 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: light ? C.white : C.dark }}>{item.title}</h3>
                    <p style={{ fontSize: 15, color: light ? 'rgba(255,255,255,0.65)' : C.muted, margin: 0, lineHeight: 1.65 }}>{item.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PASS DESIGNS SHOWCASE ────────────────────────────────────────── */}
      <section style={{ background: C.gray, borderTop: C.border, borderBottom: C.border, padding: '72px 0 80px' }}>
        <div style={{ ...inner, padding: '0 20px 48px' }}>
          <Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640, margin: isRtl ? '0 0 0 auto' : '0 auto 0 0', textAlign: isRtl ? 'right' : 'left' }}>
              <Label>{t.passDesigns.label}</Label>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 700, color: C.dark, margin: 0 }}>{t.passDesigns.heading}</h2>
              <p style={{ fontSize: 17, color: C.muted, margin: 0, lineHeight: 1.7 }}>{t.passDesigns.sub}</p>
            </div>
          </Reveal>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ overflowX: 'auto', padding: '0 20px 12px', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: 'flex', gap: 28, justifyContent: 'center', minWidth: 1300, padding: '8px 4px' }}>

              {/* Boarding Pass */}
              <Reveal delay={0}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{ background: '#fff', borderRadius: 20, padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                    <BoardingPassCard />
                  </div>
                  <span style={{ fontSize: 13, color: C.muted, fontWeight: 600, fontFamily: ff }}>{t.passDesigns.types.boarding}</span>
                </div>
              </Reveal>

              {/* Event Ticket */}
              <Reveal delay={120}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{ background: '#fff', borderRadius: 20, padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                    <EventTicketCard />
                  </div>
                  <span style={{ fontSize: 13, color: C.muted, fontWeight: 600, fontFamily: ff }}>{t.passDesigns.types.event}</span>
                </div>
              </Reveal>

              {/* Generic Pass */}
              <Reveal delay={240}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{ background: '#fff', borderRadius: 20, padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                    <GenericPassCard />
                  </div>
                  <span style={{ fontSize: 13, color: C.muted, fontWeight: 600, fontFamily: ff }}>{t.passDesigns.types.generic}</span>
                </div>
              </Reveal>

              {/* Coupon */}
              <Reveal delay={360}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{ background: '#fff', borderRadius: 20, padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                    <CouponPassCard />
                  </div>
                  <span style={{ fontSize: 13, color: C.muted, fontWeight: 600, fontFamily: ff }}>{t.passDesigns.types.coupon}</span>
                </div>
              </Reveal>

            </div>
          </div>
          {/* Scroll hint for mobile */}
          <div className="demo-scroll-hint" style={{
            textAlign: 'center', padding: '12px 20px 0', fontSize: 13,
            color: C.muted, fontFamily: ff,
          }}>
            {t.passDesigns.scrollHint}
          </div>
          {/* Fade gradient on edges for mobile */}
          <div className="demo-fade-left" style={{
            position: 'absolute', top: 0, left: 0, width: 40, height: '100%',
            background: `linear-gradient(to ${isRtl ? 'left' : 'right'}, ${C.gray}, transparent)`,
            pointerEvents: 'none', zIndex: 2,
          }} />
          <div className="demo-fade-right" style={{
            position: 'absolute', top: 0, right: 0, width: 40, height: '100%',
            background: `linear-gradient(to ${isRtl ? 'right' : 'left'}, ${C.gray}, transparent)`,
            pointerEvents: 'none', zIndex: 2,
          }} />
        </div>
      </section>

      {/* ── APP DEMO ────────────────────────────────────────────────────────── */}
      <section style={{ background: C.dark, borderTop: C.border, borderBottom: C.border, padding: '72px 0 80px' }}>
        <div style={{ ...inner, padding: '0 20px 56px' }}>
          <Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640, margin: isRtl ? '0 0 0 auto' : '0 auto 0 0', textAlign: isRtl ? 'right' : 'left' }}>
              <Label>{t.demo.label}</Label>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 700, color: C.white, margin: 0 }}>{t.demo.heading}</h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.7 }}>{t.demo.sub}</p>
            </div>
          </Reveal>
        </div>

        {/* FIX H7: Mobile scroll hint + fade gradient */}
        <div style={{ position: 'relative' }}>
          <div className="demo-scroll-container" style={{ overflowX: 'auto', padding: '0 20px 12px', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', minWidth: 760, padding: '8px 4px' }}>

              {/* Coffee */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <IPhoneFrame width={236}>
                  <WalletPass pass={{
                    shopName: isRtl ? 'مقهى العلا' : 'Al-Ula Café',
                    orgName: 'Waya',
                    emoji: '☕',
                    stripColor: '#1C1C2E',
                    accent: '#B9FF66',
                    stamps: 7, total: 10,
                    reward: isRtl ? 'قهوة مجانية' : 'Free Coffee',
                    stampLabel: isRtl ? 'الطوابع' : 'Stamps',
                    rewardLabel: isRtl ? 'المكافأة' : 'Reward',
                    memberLabel: isRtl ? 'عضو منذ' : 'Member Since',
                    memberValue: '2024',
                    scanLabel: isRtl ? 'امسح لكسب الطوابع' : 'Scan to earn stamps',
                    animate: true,
                  }} />
                </IPhoneFrame>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500, fontFamily: ff }}>{isRtl ? 'مقاهي ☕' : 'Cafés ☕'}</span>
              </div>

              {/* Barber */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <IPhoneFrame width={236}>
                  <WalletPass pass={{
                    shopName: isRtl ? 'حلاقة الأمير' : 'Crown Barber',
                    orgName: 'Waya',
                    emoji: '✂️',
                    stripColor: '#0D1B2A',
                    accent: '#F59E0B',
                    stamps: 5, total: 8,
                    reward: isRtl ? 'حلاقة مجانية' : 'Free Haircut',
                    stampLabel: isRtl ? 'الزيارات' : 'Visits',
                    rewardLabel: isRtl ? 'المكافأة' : 'Reward',
                    memberLabel: isRtl ? 'عضو منذ' : 'Member Since',
                    memberValue: '2024',
                    scanLabel: isRtl ? 'امسح لكسب الزيارات' : 'Scan to earn visits',
                  }} />
                </IPhoneFrame>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500, fontFamily: ff }}>{isRtl ? 'حلاقين ✂️' : 'Barbers ✂️'}</span>
              </div>

              {/* Restaurant */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <IPhoneFrame width={236}>
                  <WalletPass pass={{
                    shopName: isRtl ? 'مطعم المندي' : 'Al-Mandi',
                    orgName: 'Waya',
                    emoji: '🍽️',
                    stripColor: '#2D1506',
                    accent: '#FB923C',
                    stamps: 8, total: 10,
                    reward: isRtl ? 'وجبة مجانية' : 'Free Meal',
                    stampLabel: isRtl ? 'الوجبات' : 'Meals',
                    rewardLabel: isRtl ? 'المكافأة' : 'Reward',
                    memberLabel: isRtl ? 'عضو منذ' : 'Member Since',
                    memberValue: '2024',
                    scanLabel: isRtl ? 'امسح لكسب النقاط' : 'Scan to earn points',
                  }} />
                </IPhoneFrame>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500, fontFamily: ff }}>{isRtl ? 'مطاعم 🍽️' : 'Restaurants 🍽️'}</span>
              </div>

            </div>
          </div>
          {/* Scroll hint for mobile */}
          <div className="demo-scroll-hint" style={{
            textAlign: 'center', padding: '12px 20px 0', fontSize: 13,
            color: 'rgba(255,255,255,0.35)', fontFamily: ff,
          }}>
            {t.demo.scrollHint}
          </div>
          {/* Fade gradient on edges for mobile */}
          <div className="demo-fade-left" style={{
            position: 'absolute', top: 0, left: 0, width: 40, height: '100%',
            background: `linear-gradient(to ${isRtl ? 'left' : 'right'}, ${C.dark}, transparent)`,
            pointerEvents: 'none', zIndex: 2,
          }} />
          <div className="demo-fade-right" style={{
            position: 'absolute', top: 0, right: 0, width: 40, height: '100%',
            background: `linear-gradient(to ${isRtl ? 'right' : 'left'}, ${C.dark}, transparent)`,
            pointerEvents: 'none', zIndex: 2,
          }} />
        </div>
      </section>

      {/* ── USE CASES (replaced fabricated testimonials) ────────────────────── */}
      <section style={{ padding: pad }}>
        <div style={inner}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
              <Label>{t.testimonials.label}</Label>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 700, margin: 0 }}>{t.testimonials.heading}</h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {t.testimonials.items.map((item, i) => (
              <Reveal key={i} delay={i * 130}>
                <div className="waya-card" style={{ background: i === 1 ? C.dark : C.gray, border: C.border, borderRadius: 16, padding: '32px 28px', boxShadow: C.shadow, margin: 0, display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
                  <span style={{ fontSize: 48, lineHeight: 1 }}>{item.icon}</span>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: i === 1 ? C.white : C.dark }}>{item.title}</h3>
                  <p style={{ fontSize: 15, color: i === 1 ? 'rgba(255,255,255,0.65)' : C.muted, margin: 0, lineHeight: 1.75 }}>{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: C.gray, borderTop: C.border, borderBottom: C.border, padding: pad }}>
        <div style={inner}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, flexWrap: 'wrap' }}>
              <Label>{t.pricing.label}</Label>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 700, margin: 0 }}>{t.pricing.heading}</h2>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 560px))', justifyContent: 'center' }}>
              <div className="waya-pricing" style={{ background: C.white, border: C.border, borderRadius: 24, padding: '44px 40px', boxShadow: C.shadow, display: 'flex', flexDirection: 'column', gap: 28 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, color: C.dark }}>{t.pricing.price}</span>
                    <span style={{ fontSize: 18, color: C.muted, paddingBottom: 10 }}>{t.pricing.period}</span>
                  </div>
                  <p style={{ fontSize: 14, color: C.muted, margin: '8px 0 0' }}>{t.pricing.sub}</p>
                </div>
                <div style={{ borderTop: C.border }} />
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {t.pricing.lines.map((line, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 15, color: C.dark, lineHeight: 1.5 }}>
                      <div style={{ width: 22, height: 22, background: C.lime, border: C.border, borderRadius: '50%', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>✓</div>
                      {line}
                    </li>
                  ))}
                </ul>
                {/* FIX H3: Inline CTA form in pricing section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <LeadForm id="pricing" t={t} isRtl={isRtl} ff={ff} compact />
                  <a href={WA_URL} target="_blank" rel="noopener noreferrer" style={{ textAlign: 'center', fontSize: 14, color: C.muted, textDecoration: 'underline', fontFamily: ff }}>{t.pricing.waLink}</a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: pad }}>
        <div style={inner}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
              <Label>{t.faq.label}</Label>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 700, margin: 0 }}>{t.faq.heading}</h2>
            </div>
          </Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 820 }}>
            {t.faq.items.map((item, i) => (
              <Reveal key={i} delay={i * 60}>
                <FaqItem q={item.q} a={item.a} ff={ff} index={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 20px 80px' }}>
        <div style={{ ...inner }}>
          <Reveal>
            <div style={{ background: C.dark, border: C.border, borderRadius: 24, padding: 'clamp(40px, 6vw, 72px) clamp(24px, 5vw, 64px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 50px)', fontWeight: 700, color: C.white, margin: 0, position: 'relative', zIndex: 1, maxWidth: 620, lineHeight: 1.2 }}>{t.ctaBanner.heading}</h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: 0, position: 'relative', zIndex: 1 }}>{t.ctaBanner.sub}</p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
                <button onClick={scrollToForm} className="waya-btn"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', background: C.lime, color: C.dark, border: C.border, borderRadius: 14, padding: '16px 24px', fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: C.shadow, fontFamily: ff }}>
                  {t.pricing.cta}
                </button>
                <a href={WA_URL} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontFamily: ff }}>
                  <WaIcon size={14} color="rgba(255,255,255,0.5)" />
                  <span style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>{t.ctaBanner.waBtn}</span>
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: C.dark, borderTop: C.border, padding: '40px 20px' }}>
        <div style={{ ...inner, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <a href="/" className="waya-logo" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <span style={{ background: C.lime, color: C.dark, padding: '4px 12px', borderRadius: 7, fontSize: 16, fontWeight: 700 }}>{t.nav.logo}</span>
          </a>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{t.footer.copy}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{t.footer.tagline}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="waya-footer-link"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, padding: '6px 12px' }}>
              <WaIcon size={13} color="rgba(255,255,255,0.55)" /> WhatsApp
            </a>
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="waya-footer-link"
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(255,255,255,0.55)', background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontFamily: ff }}>
              <Globe size={13} />{lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      </footer>

      {/* ── STICKY MOBILE CTA — scrolls to lead form ──────────────────────── */}
      {showSticky && (
        <div className="md:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.white, borderTop: C.border, padding: '12px 20px 20px', zIndex: 40, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
          <button onClick={scrollToForm} className="waya-btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', background: C.lime, color: C.dark, border: C.border, borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: ff, boxShadow: C.shadow }}>
            {t.stickyCta}
          </button>
        </div>
      )}
    </div>
  );
}
