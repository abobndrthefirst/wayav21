import React, { useState, useEffect, useRef } from 'react';
import './_group.css';
import {
  Globe,
  Check,
  ArrowRight,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';

const HandDrawnStar = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M50 10 Q55 35 85 40 Q55 50 65 85 Q45 65 15 85 Q30 55 10 45 Q40 35 50 10 Z" />
  </svg>
);

const HandDrawnArrow = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 50 Q40 10 90 40 M70 20 Q85 35 90 40 Q75 55 60 60" />
  </svg>
);

const HandDrawnCircle = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M50 10 C75 8, 95 25, 90 50 C85 75, 60 95, 30 85 C10 75, 5 45, 20 25 C30 15, 45 12, 55 15" />
  </svg>
);

const WavyUnderline = ({ className = "" }) => (
  <svg viewBox="0 0 100 20" className={className} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" preserveAspectRatio="none" aria-hidden="true">
    <path d="M5 10 Q15 0 25 10 T45 10 T65 10 T85 10 T95 10" />
  </svg>
);

const DoodleScribble = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 50 Q20 20 40 60 T60 30 T90 70" />
  </svg>
);

const AR = {
  nav: {
    logo: 'نقاطي',
    cta: 'احجز مكانك — مجاناً'
  },
  hero: {
    badge1: 'تم إضافة نقطة ✅',
    badge2: 'تم فتح المكافأة 🎉',
    subHeadline: 'عملاؤك يختفون لأن ما عندك برنامج ولاء. نقاطي يحلّها في ٧ دقائق — بطاقة ولاء رقمية بالـ QR تنضاف لمحفظة جوالهم مباشرة. بدون تطبيق، بدون جهاز، بدون عقد.',
    primaryCta: 'احجز مكاني — مجاناً',
    secondaryCta: 'كيف يعمل؟'
  },
  socialProof: {
    count: '٣٤٧+',
    text: 'صاحب محل بالفعل في القائمة',
    cities: 'من الرياض، جدة، والدمام',
    live: 'مباشر'
  },
  marquee: [
    'المقاهي', 'المطاعم', 'الصالونات', 'المتاجر', 'النوادي الرياضية', 'مغاسل السيارات', 'المخابز', 'العيادات'
  ],
  stats: [
    { value: 7, label: 'دقائق للتشغيل', prefix: '', suffix: '' },
    { value: 0, label: 'أجهزة مطلوبة', prefix: '', suffix: '' },
    { value: 347, label: 'في قائمة الانتظار', prefix: '', suffix: '+' },
    { value: 75, label: 'ريال/شهرياً', prefix: '', suffix: '' }
  ],
  howItWorks: {
    title: 'كيف يعمل النظام؟',
    steps: [
      { title: 'العميل يمسح الكود', desc: 'لا حاجة لتحميل أي تطبيق. كاميرا الجوال تكفي.' },
      { title: 'يضيف البطاقة للمحفظة', desc: 'بضغطة واحدة تنضاف لمحفظة أبل أو جوجل.' },
      { title: 'يجمع النقاط', desc: 'في كل زيارة، يمسح العميل كود خاص لإضافة نقطة.' },
      { title: 'يحصل على المكافأة', desc: 'عند اكتمال النقاط، يحصل على هديته مباشرة.' },
      { title: 'يعود مرة أخرى', desc: 'تنبيهات ذكية تذكر العميل بالعودة لمتجرك.' }
    ]
  },
  businesses: {
    title: 'مناسب لجميع الأعمال',
    items: [
      { title: 'المقاهي', emoji: '☕' },
      { title: 'المطاعم', emoji: '🍔' },
      { title: 'الصالونات', emoji: '✂️' },
      { title: 'البيع بالتجزئة', emoji: '🛍️' },
      { title: 'الأندية الرياضية', emoji: '🏋️' },
      { title: 'مغاسل السيارات', emoji: '🚗' },
      { title: 'متاجر الهدايا', emoji: '🎁' },
      { title: 'المتاجر الصغيرة', emoji: '🏪' }
    ]
  },
  features: {
    title: 'كل ما تحتاجه للولاء',
    items: [
      { title: 'بدون تطبيقات', desc: 'العميل لا يحتاج لتحميل أي شيء.', emoji: '🚫📱' },
      { title: 'إعداد سريع', desc: 'جاهز للاستخدام في 10 دقائق.', emoji: '⚡' },
      { title: 'آمن وموثوق', desc: 'حماية كاملة لبياناتك وعملائك.', emoji: '🔒' },
      { title: 'تقارير ذكية', desc: 'تعرف على سلوك عملائك.', emoji: '📊' },
      { title: 'تنبيهات فورية', desc: 'تواصل مع عملائك بسهولة.', emoji: '🔔' },
      { title: 'دعم غير محدود', desc: 'عدد غير محدود من العملاء.', emoji: '♾️' }
    ]
  },
  pricing: {
    title: 'باقة واحدة. بدون مفاجآت.',
    price: '٧٥ ريال',
    period: '/ شهرياً',
    priceNote: '(≈ $20 USD)',
    features: [
      'عملاء غير محدودين',
      'نقاط ومكافآت بلا حدود',
      'تصميم بطاقة بهويتك',
      'دعم واتساب ٢٤/٧',
      'ألغِ بأي وقت'
    ],
    cta: 'احجز مكاني الآن'
  },
  phone: {
    walletTitle: 'المحفظة',
    shopName: 'مقهى\nومحمصة',
    rewards: 'المكافآت',
    bestDeal: 'الأفضل ✨',
    badge: 'نقاطي للولاء ✦',
    whoUses: 'من يستخدم نقاطي؟'
  },
  waitlist: {
    title: 'احجز مكانك الآن — الإطلاق قريب',
    desc: '٧٥ ريال / شهرياً. بدون بطاقة ائتمان. بدون عقد. سنتواصل معك عبر الواتساب لإعداد متجرك في أقل من ٧ دقائق.',
    trustNote: 'انضم لـ ٣٤٧+ صاحب محل من الرياض وجدة والدمام بالفعل في القائمة.',
    placeholder: 'رقم الواتساب أو البريد الإلكتروني',
    button: 'احجز مكاني — مجاناً',
    whatsappCta: 'تواصل عبر واتساب',
    success: 'تم التسجيل! سنتواصل معك عبر الواتساب لإعدادك مباشرة 🎉',
    err: 'يرجى إدخال بريد إلكتروني صحيح أو رقم جوال يبدأ بـ 05'
  }
};

const EN = {
  nav: {
    logo: 'Niqaty',
    cta: 'Reserve My Spot — Free'
  },
  hero: {
    badge1: 'Point Added ✅',
    badge2: 'Reward Unlocked 🎉',
    subHeadline: 'Your customers leave and never come back — because you have nothing keeping them loyal. Niqaty fixes that in 7 minutes: a branded QR loyalty card that lives in their Apple or Google Wallet. No app. No hardware. No contract.',
    primaryCta: 'Reserve My Spot — It\'s Free',
    secondaryCta: 'See How It Works'
  },
  socialProof: {
    count: '347+',
    text: 'shop owners already on the list',
    cities: 'From Riyadh, Jeddah & Dammam',
    live: 'Live'
  },
  marquee: [
    'Cafes', 'Restaurants', 'Salons', 'Retail', 'Gyms', 'Car Washes', 'Bakeries', 'Clinics'
  ],
  stats: [
    { value: 7, label: 'Minutes To Go Live', prefix: '', suffix: '' },
    { value: 0, label: 'Hardware Needed', prefix: '', suffix: '' },
    { value: 347, label: 'On The Waitlist', prefix: '', suffix: '+' },
    { value: 75, label: 'SAR / Month', prefix: '', suffix: '' }
  ],
  howItWorks: {
    title: 'How It Works',
    steps: [
      { title: 'Customer Scans QR', desc: 'No app download required. Just the native camera.' },
      { title: 'Adds to Wallet', desc: 'One tap to add to Apple Wallet or Google Pay.' },
      { title: 'Collects Points', desc: 'Customer scans a unique code to add points.' },
      { title: 'Gets Rewarded', desc: 'Automatically unlocks rewards when points are met.' },
      { title: 'Returns Again', desc: 'Smart push notifications keep them coming back.' }
    ]
  },
  businesses: {
    title: 'Perfect For Your Business',
    items: [
      { title: 'Cafes', emoji: '☕' },
      { title: 'Restaurants', emoji: '🍔' },
      { title: 'Salons', emoji: '✂️' },
      { title: 'Retail', emoji: '🛍️' },
      { title: 'Gyms', emoji: '🏋️' },
      { title: 'Car Washes', emoji: '🚗' },
      { title: 'Gift Shops', emoji: '🎁' },
      { title: 'Convenience Stores', emoji: '🏪' }
    ]
  },
  features: {
    title: 'Everything You Need',
    items: [
      { title: 'App-less Experience', desc: 'Customers don\'t need to download anything.', emoji: '🚫📱' },
      { title: 'Lightning Fast Setup', desc: 'Ready to use in under 10 minutes.', emoji: '⚡' },
      { title: 'Secure & Reliable', desc: 'Bank-grade security for your data.', emoji: '🔒' },
      { title: 'Smart Analytics', desc: 'Understand your customers\' behavior.', emoji: '📊' },
      { title: 'Push Notifications', desc: 'Engage customers effortlessly.', emoji: '🔔' },
      { title: 'Unlimited Growth', desc: 'No caps on your customer base.', emoji: '♾️' }
    ]
  },
  pricing: {
    title: 'One Plan. No Surprises.',
    price: '75 SAR',
    period: '/ month',
    priceNote: '(≈ $20 USD)',
    features: [
      'Unlimited Customers',
      'Unlimited Points & Rewards',
      'Custom Branded Cards',
      '24/7 WhatsApp Support',
      'Cancel Anytime'
    ],
    cta: 'Reserve My Spot Now'
  },
  phone: {
    walletTitle: 'Wallet',
    shopName: 'Coffee\nShop',
    rewards: 'Rewards',
    bestDeal: 'BEST DEAL ✨',
    badge: 'Niqaty Loyalty ✦',
    whoUses: 'WHO USES NIQATY?'
  },
  waitlist: {
    title: 'Reserve your spot. Launch in 7 minutes.',
    desc: '75 SAR / month. No credit card required. No contract. We\'ll onboard you over WhatsApp the moment we launch.',
    trustNote: 'Join 347+ shop owners from Riyadh, Jeddah & Dammam already on the list.',
    placeholder: 'Your WhatsApp number or email',
    button: 'Reserve My Spot — It\'s Free',
    whatsappCta: 'Chat on WhatsApp',
    success: 'You\'re on the list! We\'ll message you on WhatsApp to get you set up 🎉',
    err: 'Please enter a valid email or Saudi mobile number starting with 05'
  }
};

function validate(v: string) {
  const s = v.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || /^05\d{8}$/.test(s);
}

const toArabicNumerals = (n: number) => n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);

const CountUp = ({ end, duration = 2000, prefix = '', suffix = '', isArabic = false }: { end: number, duration?: number, prefix?: string, suffix?: string, isArabic?: boolean }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [end, duration, isVisible]);

  const displayCount = isArabic ? toArabicNumerals(count) : count;

  return <span ref={countRef}>{prefix}{displayCount}{suffix}</span>;
};

const FadeIn = ({ children, delay = 0, className = '' }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const SocialProofCounter = ({ target, isArabic }: { target: number; isArabic: boolean }) => {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    let start: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 2000, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, target]);
  return <span ref={ref}>{isArabic ? toArabicNumerals(count) : count}</span>;
};

export default function WarmSouqHierarchy() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [stamps, setStamps] = useState<number>(0);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState(false);
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const t = lang === 'ar' ? AR : EN;
  const isRtl = lang === 'ar';
  const waitlistRef = useRef<HTMLElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const interval = setInterval(() => {
      setStamps((prev) => (prev >= 10 ? 0 : prev + 1));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const scrollWaitlist = () => {
    setMenuOpen(false);
    waitlistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const scrollHowItWorks = () => {
    setMenuOpen(false);
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const titleFont = isRtl ? 'font-["Tajawal"]' : 'font-["DM_Sans"] tracking-tight';
  const bodyFont = isRtl ? 'font-["Cairo"]' : 'font-["DM_Sans"]';

  return (
    <div
      className={`min-h-screen ${bodyFont} bg-[#FCF0DC] text-[#2B1708] overflow-x-hidden transition-all duration-300 relative`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <nav className="fixed top-0 w-full z-50 bg-[#FCF0DC]/90 backdrop-blur-md border-b-[3px] border-[#2B1708]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className={`text-2xl sm:text-3xl font-black ${titleFont} tracking-tighter relative`}>
            <span className="relative z-10">{t.nav.logo}</span>
            <div className="absolute -bottom-1 left-0 w-full h-3 bg-[#D4963B] -z-10 transform -rotate-2"></div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-2 font-bold hover:text-[#C05C30] transition-colors uppercase tracking-widest text-sm bg-[#FFF6E8] px-3 py-1 rounded-full border-[3px] border-[#2B1708] transform hover:-rotate-3"
            >
              <Globe className="w-4 h-4" />
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            <button
              onClick={scrollWaitlist}
              className="bg-[#C05C30] text-[#FCF0DC] px-6 py-3 font-bold hover:bg-[#A04A26] transition-all transform hover:-translate-y-1 hover:rotate-2 shadow-[4px_4px_0px_#2B1708] border-[3px] border-[#2B1708]"
            >
              {t.nav.cta}
            </button>
          </div>
          <button
            className="md:hidden p-2 text-[#2B1708]"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#FCF0DC] border-t-[3px] border-[#2B1708] px-4 py-4 flex flex-col gap-3">
            <button
              onClick={scrollWaitlist}
              className="w-full bg-[#C05C30] text-[#FCF0DC] py-3 font-bold border-[3px] border-[#2B1708] shadow-[4px_4px_0px_#2B1708]"
            >
              {t.nav.cta}
            </button>
            <button
              onClick={() => { setLang(lang === 'ar' ? 'en' : 'ar'); setMenuOpen(false); }}
              className="flex items-center justify-center gap-2 font-bold text-sm bg-[#FFF6E8] px-3 py-2 rounded-full border-[3px] border-[#2B1708]"
            >
              <Globe className="w-4 h-4" />
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        )}
      </nav>

      <section className="pt-24 sm:pt-28 pb-12 sm:pb-16 px-4 sm:px-6 min-h-[80vh] flex items-center relative overflow-hidden bg-[#FCF0DC]">
        {/* Suppressed decoratives */}
        <HandDrawnStar className="absolute top-40 left-10 w-8 sm:w-12 h-8 sm:h-12 text-[#D4963B] animate-float hidden sm:block opacity-20" />
        <HandDrawnStar className="absolute bottom-20 right-20 w-12 sm:w-16 h-12 sm:h-16 text-[#C05C30] animate-float-delayed hidden sm:block opacity-20" />
        <DoodleScribble className="absolute top-20 right-1/4 w-24 h-24 text-[#2B1708] opacity-20 transform rotate-45 hidden lg:block" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 relative order-1 lg:order-1">
            <HandDrawnArrow className={`absolute -top-16 ${isRtl ? 'left-0 transform scale-x-[-1]' : 'right-0'} w-24 h-24 text-[#D4963B] hidden lg:block opacity-20`} />

            <FadeIn>
              {/* Removed the small badge to let headline dominate */}
              <h1 className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black ${titleFont} leading-[1.1] uppercase relative text-[#2B1708]`}>
                {lang === 'en' ? (
                  <>
                    <span className="relative inline-block transform -rotate-2 mb-2">Your customers
                      <div className="absolute inset-0 bg-[#D4963B] -z-10 transform rotate-2 translate-y-2 translate-x-2"></div>
                    </span><br/>
                    vanish.<br/>
                    <span className="text-[#FCF0DC] relative inline-block transform rotate-1 mt-2 px-2">Niqaty brings them back.
                      <div className="absolute inset-0 bg-[#C05C30] -z-10 transform -rotate-1"></div>
                      <HandDrawnCircle className="absolute -inset-4 w-auto h-auto text-[#2B1708] opacity-20 z-20 pointer-events-none hidden sm:block" />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="relative inline-block transform rotate-2 mb-2">عميلك يختفي
                      <div className="absolute inset-0 bg-[#D4963B] -z-10 transform -rotate-2 translate-y-2 -translate-x-2"></div>
                    </span><br/>
                    نقاطي<br/>
                    <span className="text-[#FCF0DC] relative inline-block transform -rotate-1 mt-2 px-4">يرجّعه.
                      <div className="absolute inset-0 bg-[#C05C30] -z-10 transform rotate-1"></div>
                      <HandDrawnCircle className="absolute -inset-4 w-auto h-auto text-[#2B1708] opacity-20 z-20 pointer-events-none hidden sm:block" />
                    </span>
                  </>
                )}
              </h1>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="relative inline-block">
                <p className="text-base sm:text-xl md:text-2xl text-[#4A2E18] max-w-xl font-medium relative z-10 bg-[#FFF6E8] p-4 sm:p-6 border-[3px] border-[#2B1708] shadow-[8px_8px_0px_#2B1708] opacity-70">
                  {t.hero.subHeadline}
                </p>
                {/* Removed floating stars overlapping text */}
              </div>
            </FadeIn>

            <FadeIn delay={400} className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 sm:pt-8 items-center">
              <button
                onClick={scrollWaitlist}
                className="bg-[#C05C30] text-[#FCF0DC] px-6 sm:px-8 py-4 sm:py-5 text-lg sm:text-xl font-bold hover:bg-[#D4963B] transition-all transform hover:-translate-y-2 hover:rotate-2 shadow-[8px_8px_0px_#2B1708] border-[3px] border-[#2B1708] flex items-center justify-center gap-3"
              >
                {t.hero.primaryCta}
                <ArrowIcon className="w-5 sm:w-6 h-5 sm:h-6" />
              </button>
              <button
                onClick={scrollHowItWorks}
                className="bg-transparent text-[#C05C30] underline underline-offset-4 px-2 py-4 text-base sm:text-lg font-medium hover:text-[#A04A26] transition-colors border-0 shadow-none rotate-0 relative"
              >
                {t.hero.secondaryCta}
              </button>
            </FadeIn>
          </div>

          <div className="lg:col-span-5 relative h-[400px] sm:h-[500px] lg:h-[600px] flex justify-center items-center mt-8 lg:mt-0 order-2 lg:order-2 w-[35vw] max-w-full mx-auto">
            <div className="absolute inset-4 sm:inset-0 bg-[#D4963B] rounded-[2rem] sm:rounded-[3rem] transform rotate-6 scale-95 border-[3px] border-[#2B1708]"></div>
            <div className="absolute inset-4 sm:inset-0 bg-[#C05C30] rounded-[2rem] sm:rounded-[3rem] transform -rotate-3 scale-100 border-[3px] border-[#2B1708]"></div>

            <FadeIn delay={300} className="relative z-10 w-[240px] sm:w-[280px] lg:w-full h-[480px] sm:h-[560px] lg:h-[600px] bg-[#FFF6E8] rounded-[2.5rem] sm:rounded-[3rem] p-2 sm:p-3 shadow-2xl border-[3px] border-[#2B1708] transform hover:-translate-y-4 transition-transform duration-500 max-w-[320px]">
              <div className="w-full h-full bg-[#FCF0DC] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden relative border-[3px] border-[#2B1708]/10">
                <div className="absolute top-0 inset-x-0 h-6 sm:h-7 bg-[#2B1708] rounded-b-2xl sm:rounded-b-3xl w-32 sm:w-40 mx-auto z-20"></div>

                <div className="h-full p-3 sm:p-4 pt-10 sm:pt-12 relative">
                  <div className="text-center mb-4 sm:mb-6 relative">
                    <h3 className="font-bold text-sm sm:text-base text-[#2B1708]">{t.phone.walletTitle}</h3>
                  </div>

                  <div className="bg-[#C05C30] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-[#FCF0DC] shadow-[0_8px_0_#A04A26] border-[3px] border-[#2B1708] relative overflow-hidden transform -rotate-1">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D4963B] rounded-full opacity-50 mix-blend-multiply"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#2B1708] rounded-full opacity-20"></div>

                    <div className="flex justify-between items-start mb-6 sm:mb-8 relative z-10">
                      <div>
                        <div className="font-bold opacity-90 text-xs sm:text-sm uppercase tracking-wider bg-[#FFF6E8]/20 inline-block px-2 py-1 rounded">Niqaty</div>
                        <div className="font-black text-xl sm:text-2xl mt-2 leading-none" style={{whiteSpace: 'pre-line'}}>{t.phone.shopName}</div>
                      </div>
                      <div className="w-10 sm:w-12 h-10 sm:h-12 bg-[#FFF6E8] rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-inner border-[3px] border-[#2B1708]">☕</div>
                    </div>

                    <div className="bg-[#FFF6E8] rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border-[3px] border-[#2B1708] shadow-[4px_4px_0px_#2B1708] text-[#2B1708] relative z-10">
                      <div className="flex justify-between text-xs sm:text-sm mb-2 sm:mb-3 font-black uppercase">
                        <span>{t.phone.rewards}</span>
                        <span className="bg-[#FFF6E8] px-2 py-0.5 rounded border border-[#C05C30]">{isRtl ? `${toArabicNumerals(stamps)}/${toArabicNumerals(10)}` : `${stamps}/10`}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={`aspect-square rounded-full flex items-center justify-center border-[3px] transition-all duration-300
                              ${i < stamps
                                ? 'bg-[#D4963B] border-[#2B1708] scale-100 shadow-[2px_2px_0px_#2B1708]'
                                : 'bg-gray-100 border-gray-300 scale-90'}`}
                          >
                            {i < stamps && <Check className="w-3 sm:w-4 h-3 sm:h-4 text-[#FCF0DC]" strokeWidth={4} />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#FFF6E8] p-3 sm:p-4 rounded-xl sm:rounded-2xl flex justify-center border-[3px] border-[#2B1708] relative z-10 transform rotate-1">
                      <div className="w-24 sm:w-32 h-24 sm:h-32 bg-[#FCF0DC] flex items-center justify-center p-2 relative rounded-xl border-[3px] border-dashed border-[#2B1708]">
                        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-[#2B1708] rounded-lg"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl sm:text-4xl bg-[#FFF6E8] rounded-md p-1 border-[3px] border-[#2B1708] transform rotate-12">📱</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
            {/* Removed absolute hero badges */}
          </div>
        </div>
      </section>

      <section className="py-4 sm:py-6 px-4 sm:px-6 bg-[#FFF6E8] border-y-[3px] border-[#2B1708] relative z-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C05C30] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#C05C30] border-[3px] border-[#2B1708]"></span>
            </span>
            <span className="text-sm font-black uppercase tracking-widest text-[#C05C30]">{t.socialProof.live}</span>
          </div>
          <div className="flex items-center gap-3 text-[#2B1708]">
            <span className={`text-2xl sm:text-3xl font-black text-[#C05C30] ${titleFont}`}>
              <SocialProofCounter target={347} isArabic={isRtl} />+
            </span>
            <span className="text-base sm:text-lg font-bold">{t.socialProof.text}</span>
          </div>
          <span className="bg-[#FFF6E8] px-4 py-1 border-[3px] border-[#2B1708] shadow-[3px_3px_0px_#2B1708] text-sm font-bold transform -rotate-1">{t.socialProof.cities}</span>
        </div>
      </section>

      <section className="bg-[#2B1708] py-4 sm:py-6 border-y-[3px] border-[#2B1708] overflow-hidden whitespace-nowrap flex relative z-20 transform -rotate-1 origin-left w-[105vw] -ml-[2vw]">
        <div className="animate-marquee flex gap-6 sm:gap-8 text-[#D4963B] text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-widest items-center">
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={i}>
              {t.marquee.map((item, j) => (
                <div key={`${i}-${j}`} className="flex items-center gap-6 sm:gap-8">
                  <span className="bg-[#FFF6E8] text-[#2B1708] px-3 sm:px-4 py-1 border-[3px] border-[#2B1708] rounded-full shadow-[4px_4px_0px_#2B1708] transform hover:rotate-3 transition-transform">{item}</span>
                  <HandDrawnStar className="w-6 sm:w-8 h-6 sm:h-8 text-[#D4963B] opacity-20" />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-[#FCF0DC] px-4 sm:px-6 relative mt-8 sm:mt-12">
        <DoodleScribble className="absolute top-10 left-10 w-32 h-32 text-[#FFF6E8] hidden lg:block opacity-20" />

        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {t.stats.map((stat, i) => {
            const bgColors = ['bg-[#FFF6E8]', 'bg-[#FFF6E8]', 'bg-[#2B1708]', 'bg-[#C05C30]'];
            const textColors = ['text-[#C05C30]', 'text-[#D4963B]', 'text-[#FCF0DC]', 'text-[#FCF0DC]'];
            const numberColors = ['text-[#2B1708]', 'text-[#2B1708]', 'text-[#D4963B]', 'text-[#FFF6E8]'];
            const rotations = ['rotate-1', '-rotate-2', 'rotate-2', '-rotate-1'];

            return (
              <div key={i} className="relative">
                <FadeIn delay={i * 100}>
                  <div className={`${bgColors[i]} border-[3px] border-[#2B1708] p-4 sm:p-8 rounded-2xl shadow-[8px_8px_0px_#2B1708] transform ${rotations[i]} hover:rotate-0 hover:-translate-y-2 transition-all duration-300 text-center relative overflow-hidden group flex flex-col items-center justify-center`}>
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#FFF6E8] opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className={`text-6xl sm:text-7xl font-black ${titleFont} ${numberColors[i]} mb-1 relative z-10`}>
                      <CountUp end={stat.value} prefix={stat.prefix} suffix={stat.suffix} isArabic={isRtl} />
                    </div>
                    <div className={`text-sm opacity-60 font-medium ${textColors[i]} uppercase tracking-widest relative z-10 px-2 sm:px-4`}>
                      {stat.label}
                    </div>
                  </div>
                </FadeIn>
              </div>
            );
          })}
        </div>
      </section>

      <section ref={howItWorksRef} id="how-it-works" className="py-20 sm:py-32 bg-[#2B1708] text-[#FCF0DC] px-4 sm:px-6 border-y-[3px] border-[#2B1708] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4963B] rounded-full mix-blend-multiply opacity-20 transform translate-x-1/2 -translate-y-1/2" aria-hidden="true"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2B1708] rounded-full mix-blend-multiply opacity-10 transform -translate-x-1/2 translate-y-1/2" aria-hidden="true"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeIn>
            <div className="text-center mb-12 sm:mb-20 relative mx-auto w-full">
              <div className="w-full h-[2px] bg-[#C05C30] mt-12 mb-8 max-w-lg mx-auto"></div>
              <h2 className={`text-3xl sm:text-5xl md:text-7xl font-black ${titleFont} uppercase tracking-tighter text-[#FCF0DC] mb-4`}>
                {t.howItWorks.title}
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {t.howItWorks.steps.map((step, i) => {
              const styles = [
                "bg-[#FFF6E8] text-[#2B1708] md:col-span-2 lg:col-span-2 shadow-[8px_8px_0px_#2B1708] rotate-1",
                "bg-[#2B1708] text-[#FCF0DC] shadow-[8px_8px_0px_#2B1708] -rotate-1",
                "bg-[#FFF6E8] text-[#2B1708] shadow-[8px_8px_0px_#2B1708] -rotate-2",
                "bg-[#FFF6E8] text-[#C05C30] md:col-span-2 lg:col-span-1 shadow-[8px_8px_0px_#2B1708] rotate-2",
                "bg-[#D4963B] text-[#2B1708] md:col-span-2 lg:col-span-1 shadow-[8px_8px_0px_#2B1708] rotate-1"
              ];

              return (
                <FadeIn key={i} delay={i * 100} className="h-full">
                  <div className={`p-6 sm:p-8 rounded-3xl border-[3px] border-[#2B1708] h-full flex flex-col justify-center relative transition-transform duration-300 ${styles[i]}`}>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-black text-8xl opacity-10 pointer-events-none">
                      {i + 1}
                    </div>
                    <h3 className={`text-lg sm:text-xl font-bold mb-2 uppercase truncate z-10 relative`}>{step.title}</h3>
                    <p className="text-sm sm:text-base font-normal opacity-70 z-10 relative">{step.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32 bg-[#FFF6E8] px-4 sm:px-6 relative border-b-[3px] border-[#2B1708]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMyQjE3MDgiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-20"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <FadeIn>
            <div className="flex flex-col items-center mb-12 sm:mb-24">
              <div className="w-full h-[2px] bg-[#C05C30] mt-12 mb-8 max-w-lg mx-auto"></div>
              <h2 className={`text-3xl sm:text-5xl md:text-7xl font-black ${titleFont} text-center uppercase tracking-tighter text-[#2B1708] mb-4`}>
                {t.businesses.title}
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 md:gap-12">
            {t.businesses.items.map((item, i) => {
              const colors = ['bg-[#C05C30] text-[#FCF0DC]', 'bg-[#FFF6E8] text-[#2B1708]', 'bg-[#D4963B] text-[#2B1708]', 'bg-[#2B1708] text-[#FCF0DC]', 'bg-[#FFF6E8] text-[#C05C30]', 'bg-[#FFF6E8] text-[#2B1708]'];
              const color = colors[i % colors.length];
              const rotations = ['rotate-2', '-rotate-3', 'rotate-3', '-rotate-2', 'rotate-1', '-rotate-3', 'rotate-2', '-rotate-1'];
              const rotate = rotations[i % rotations.length];

              return (
                <FadeIn key={i} delay={i * 50}>
                  <div className={`p-4 sm:p-6 border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] transform ${rotate} hover:scale-110 hover:z-20 transition-all duration-300 relative group ${color}`}>
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-5 sm:w-6 h-5 sm:h-6 bg-red-500 rounded-full border-[3px] border-[#2B1708] shadow-sm z-10">
                      <div className="absolute inset-1 bg-[#FFF6E8] rounded-full opacity-30"></div>
                    </div>

                    <div className="flex flex-col items-center text-center mt-2">
                      <div className="text-4xl sm:text-6xl mb-2 sm:mb-4 bg-[#FFF6E8]/20 w-16 sm:w-24 h-16 sm:h-24 rounded-2xl flex items-center justify-center border-[3px] border-current transform group-hover:rotate-12 transition-transform shadow-inner">
                        {item.emoji}
                      </div>
                      <h3 className="text-sm sm:text-xl font-black uppercase">{item.title}</h3>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32 bg-[#FCF0DC] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="mb-12 sm:mb-20 text-center">
              <div className="w-full h-[2px] bg-[#C05C30] mt-12 mb-8 max-w-lg mx-auto"></div>
              <h2 className={`text-3xl sm:text-5xl md:text-7xl font-black ${titleFont} uppercase tracking-tighter text-[#2B1708] mb-4`}>
                {t.features.title}
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-[200px] sm:auto-rows-[250px]">
            {t.features.items.map((item, i) => {
              const isLarge = i === 0 || i === 3;
              const isTall = i === 1;
              const bgClass = i % 3 === 0 ? 'bg-[#FFF6E8]' : i % 3 === 1 ? 'bg-[#FFF6E8]' : 'bg-[#FFF6E8]';

              return (
                <FadeIn
                  key={i}
                  delay={i * 100}
                  className={`h-full ${isLarge ? 'md:col-span-2' : ''} ${isTall ? 'row-span-2' : ''}`}
                >
                  <div className={`${bgClass} p-5 sm:p-8 border-[3px] border-[#2B1708] shadow-[8px_8px_0px_#2B1708] h-full flex flex-col hover:-translate-y-2 hover:shadow-[12px_12px_0px_#2B1708] transition-all duration-300 relative overflow-hidden group`}>
                    <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full opacity-10 transform group-hover:scale-150 transition-transform duration-700 ${i % 2 === 0 ? 'bg-[#C05C30]' : 'bg-[#D4963B]'}`}></div>

                    <div className="w-12 sm:w-16 h-12 sm:h-16 bg-[#FFF6E8] border-[3px] border-[#2B1708] shadow-[4px_4px_0px_#2B1708] rounded-xl flex items-center justify-center text-2xl sm:text-3xl mb-4 sm:mb-6 transform -rotate-6 group-hover:rotate-0 transition-transform z-10">
                      {item.emoji}
                    </div>

                    <div className="relative z-10 mt-auto">
                      <h3 className="text-lg sm:text-2xl font-black mb-1 sm:mb-2 uppercase text-[#2B1708]">{item.title}</h3>
                      <p className="text-sm sm:text-lg font-bold text-[#4A2E18]/80">{item.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32 bg-[#2B1708] px-4 sm:px-6 border-y-[3px] border-[#C05C30] relative overflow-hidden">
        <div className="max-w-2xl mx-auto relative z-10">
          <FadeIn>
            <div className="text-center">
              <div className="w-full h-[2px] bg-[#C05C30] mt-12 mb-8 max-w-lg mx-auto"></div>
            </div>
            <div className="bg-[#FCF0DC] border-[3px] border-[#D4963B] p-6 sm:p-10 md:p-16 shadow-[16px_16px_0px_#2B1708] relative transform rotate-1 mt-4">
              <div className="absolute -top-6 sm:-top-8 -right-4 sm:-right-8 bg-[#D4963B] text-[#2B1708] font-black px-4 sm:px-6 py-2 sm:py-4 border-[3px] border-[#2B1708] transform rotate-12 shadow-[4px_4px_0px_#2B1708] z-20 text-base sm:text-xl">
                {t.phone.bestDeal}
              </div>

              <div className="text-center mb-6 sm:mb-10 border-b-[3px] border-dashed border-[#2B1708] pb-6 sm:pb-10">
                <h2 className={`text-2xl sm:text-4xl font-black ${titleFont} mb-4 sm:mb-6 uppercase text-[#2B1708]`}>
                  {t.pricing.title}
                </h2>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-end justify-center gap-2">
                    <div className="bg-[#C05C30] text-[#FCF0DC] px-4 sm:px-6 py-2 transform -rotate-3 border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] text-4xl sm:text-6xl font-black">
                      {t.pricing.price}
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-[#2B1708] mb-2">{t.pricing.period}</span>
                  </div>
                  <span className="text-sm font-bold text-[#2B1708]/50 mt-2">{t.pricing.priceNote}</span>
                </div>
              </div>

              <ul className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
                {t.pricing.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 sm:gap-4 text-base sm:text-xl font-bold text-[#2B1708]">
                    <div className="flex-shrink-0 w-7 sm:w-8 h-7 sm:h-8 bg-[#FFF6E8] border-[3px] border-[#2B1708] rounded-full flex items-center justify-center transform -rotate-6">
                      <Check className="w-4 sm:w-5 h-4 sm:h-5 text-[#C05C30]" strokeWidth={4} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={scrollWaitlist}
                className="w-full bg-[#D4963B] text-[#2B1708] py-4 sm:py-6 text-xl sm:text-2xl font-black hover:bg-[#b07d20] transition-all transform hover:-translate-y-2 border-[3px] border-[#2B1708] shadow-[8px_8px_0px_#2B1708] uppercase"
              >
                {t.pricing.cta}
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      <section ref={waitlistRef} id="waitlist" className="py-20 sm:py-32 bg-[#FFF6E8] px-4 sm:px-6 relative overflow-hidden text-center">
        <HandDrawnCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] text-[#C05C30] opacity-5 pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <FadeIn>
            <div className="w-full h-[2px] bg-[#C05C30] mt-12 mb-8 max-w-lg mx-auto"></div>
            <h2 className={`text-3xl sm:text-6xl md:text-8xl font-black ${titleFont} mb-4 sm:mb-6 text-[#2B1708] uppercase tracking-tighter`}>
              {t.waitlist.title}
            </h2>
            <p className="text-base sm:text-xl text-[#4A2E18] mb-3 font-bold bg-[#FFF6E8] inline-block px-4 sm:px-6 py-2 border-[3px] border-[#2B1708] transform -rotate-1 shadow-[4px_4px_0px_#2B1708]">
              {t.waitlist.desc}
            </p>
            <p className="text-sm sm:text-base text-[#4A2E18]/70 font-bold mb-8 sm:mb-12">
              {(t.waitlist as any).trustNote}
            </p>

            <div className="relative max-w-xl mx-auto mt-4">
              {!formSuccess ? (
                <div className="space-y-4 sm:space-y-6">
                  <form
                    onSubmit={submit}
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={e => { setInput(e.target.value); setFormError(false); }}
                      placeholder={t.waitlist.placeholder}
                      dir={isRtl ? 'rtl' : 'ltr'}
                      className="flex-1 bg-[#FFF6E8] px-5 sm:px-8 py-4 sm:py-5 text-base sm:text-xl outline-none border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] focus:shadow-[2px_2px_0px_#2B1708] focus:translate-y-1 focus:translate-x-1 transition-all font-bold placeholder:text-[#4A2E18]/50 text-[#2B1708]"
                    />
                    <button
                      type="submit"
                      className="bg-[#C05C30] text-[#FCF0DC] px-6 sm:px-10 py-4 sm:py-5 text-base sm:text-xl font-black border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] hover:bg-[#2B1708] transition-all transform hover:-translate-y-2 uppercase whitespace-nowrap"
                    >
                      {t.waitlist.button}
                    </button>
                  </form>
                  {formError && (
                    <p className="text-red-600 text-sm font-bold">{t.waitlist.err}</p>
                  )}
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-1 bg-[#2B1708]/10 flex-1"></div>
                    <span className="text-[#2B1708]/40 font-black uppercase text-sm">{lang === 'ar' ? 'أو' : 'or'}</span>
                    <div className="h-1 bg-[#2B1708]/10 flex-1"></div>
                  </div>
                  <a
                    href="https://wa.me/966500000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-[#FCF0DC] px-6 sm:px-10 py-4 sm:py-5 text-base sm:text-xl font-black border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] hover:bg-[#20bd5a] transition-all transform hover:-translate-y-2 w-full sm:w-auto"
                  >
                    <svg viewBox="0 0 24 24" className="w-6 sm:w-7 h-6 sm:h-7 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    {t.waitlist.whatsappCta}
                  </a>
                </div>
              ) : (
                <div className="bg-[#FFF6E8] text-[#C05C30] p-6 sm:p-8 border-[3px] border-[#2B1708] shadow-[8px_8px_0px_#2B1708] font-black text-xl sm:text-2xl flex items-center justify-center gap-4 transform rotate-1">
                  <span className="text-3xl sm:text-4xl">🎉</span>
                  {t.waitlist.success}
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="bg-[#2B1708] text-[#FCF0DC] py-8 sm:py-12 px-4 sm:px-6 border-t-[3px] border-[#D4963B]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className={`text-3xl sm:text-4xl font-black ${titleFont} tracking-tighter flex items-center gap-2`}>
            {t.nav.logo}
            <div className="w-3 sm:w-4 h-3 sm:h-4 bg-[#C05C30] rounded-full"></div>
          </div>
          <div className="text-[#FCF0DC]/60 font-bold font-mono text-sm sm:text-base">
            &copy; {new Date().getFullYear()} Niqaty. {lang === 'ar' ? 'صُنع في السعودية 🇸🇦' : 'Made in Saudi Arabia 🇸🇦'}
          </div>
        </div>
      </footer>

      {/* TRADEOFF ANNOTATION */}
      <div style={{ position: 'fixed', bottom: '16px', left: '16px', background: '#2B1708', color: '#FCF0DC', padding: '8px 12px', fontSize: '11px', borderRadius: '4px', zIndex: 999, opacity: 0.85 }}>
        Tradeoff: hierarchy clarity — decoratives suppressed, single entry point per section
      </div>
    </div>
  );
}
