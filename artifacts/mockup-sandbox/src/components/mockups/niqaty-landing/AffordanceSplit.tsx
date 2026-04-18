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
    desc: 'سواء كنت تدير مقهى صغير أو سلسلة متاجر، نقاطي مصمم ليتناسب مع احتياجات عملك وينمو معك.',
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
    bestDeal: 'الأنسب ✨',
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
    desc: 'Whether you run a small cafe or a retail chain, Niqaty is designed to fit your business needs and scale with you.',
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
    bestDeal: 'BEST VALUE ✨',
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

export default function AffordanceSplit() {
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
          <div className={`text-2xl sm:text-3xl font-black ${titleFont} tracking-tighter relative cursor-default`}>
            <span className="relative z-10">{t.nav.logo}</span>
            <div className="absolute -bottom-1 left-0 w-full h-3 bg-[#D4963B] -z-10 transform -rotate-2"></div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="relative inline-flex items-center bg-[#FFF6E8] border-[3px] border-[#2B1708] rounded-full p-1 w-20 transition-colors"
              aria-label="Toggle language"
            >
              <div 
                className={`absolute w-[34px] h-[26px] bg-[#C05C30] rounded-full transition-transform duration-300 ${lang === 'ar' ? (isRtl ? 'translate-x-0' : 'translate-x-0') : (isRtl ? '-translate-x-[36px]' : 'translate-x-[36px]')}`} 
              />
              <span className={`relative z-10 flex-1 text-center text-xs font-bold ${lang === 'ar' ? 'text-white' : 'text-[#2B1708]'}`}>ع</span>
              <span className={`relative z-10 flex-1 text-center text-xs font-bold ${lang === 'en' ? 'text-white' : 'text-[#2B1708]'}`}>EN</span>
            </button>
            <button
              onClick={scrollWaitlist}
              className="bg-[#C05C30] text-white px-6 py-2 font-bold transition-all border-b-[6px] border-r-[4px] border-t-[2px] border-l-[2px] border-[#2B1708] active:translate-y-1 active:translate-x-1 active:border-b-[2px] active:border-r-[2px] min-h-[48px] flex items-center justify-center"
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
              className="w-full bg-[#C05C30] text-white py-3 font-bold border-b-[6px] border-r-[4px] border-t-[2px] border-l-[2px] border-[#2B1708] active:translate-y-1 active:translate-x-1 active:border-b-[2px] active:border-r-[2px] min-h-[56px] flex items-center justify-center"
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

      {/* HERO: Split 50/50 Layout */}
      <section className="pt-24 sm:pt-28 pb-12 sm:pb-16 px-4 sm:px-6 min-h-[85vh] flex items-center relative overflow-hidden bg-[#FCF0DC]">
        <HandDrawnStar className="absolute top-40 left-10 w-8 sm:w-12 h-8 sm:h-12 text-[#D4963B] animate-float hidden sm:block" />
        <HandDrawnStar className="absolute bottom-20 right-20 w-12 sm:w-16 h-12 sm:h-16 text-[#C05C30] animate-float-delayed hidden sm:block" />
        <DoodleScribble className="absolute top-20 right-1/4 w-24 h-24 text-[#2B1708] opacity-20 transform rotate-45 hidden lg:block" />

        <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8 lg:gap-12 items-center relative z-10 min-h-[85vh]">
          {/* Left Column: Headline and CTAs */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center min-h-[85vh] relative py-12 lg:py-0">
            <HandDrawnArrow className={`absolute -top-16 ${isRtl ? 'left-0 transform scale-x-[-1]' : 'right-0'} w-24 h-24 text-[#D4963B] hidden lg:block`} />

            <FadeIn>
              <div className="inline-block bg-[#FFF6E8] text-[#C05C30] px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-widest mb-4 border-[3px] border-[#C05C30] shadow-[4px_4px_0px_#2B1708] transform -rotate-2">
                {t.phone.badge}
              </div>
              <h1 className={`text-4xl sm:text-6xl md:text-7xl font-black ${titleFont} leading-[1.1] uppercase relative text-[#2B1708]`}>
                {lang === 'en' ? (
                  <>
                    <span className="relative inline-block transform -rotate-2 mb-2">Your customers
                      <div className="absolute inset-0 bg-[#D4963B] -z-10 transform rotate-2 translate-y-2 translate-x-2"></div>
                    </span><br/>
                    vanish.<br/>
                    <span className="text-[#FCF0DC] relative inline-block transform rotate-1 mt-2 px-2">Niqaty brings them back.
                      <div className="absolute inset-0 bg-[#C05C30] -z-10 transform -rotate-1"></div>
                      <HandDrawnCircle className="absolute -inset-4 w-auto h-auto text-[#2B1708] opacity-50 z-20 pointer-events-none hidden sm:block" />
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
                      <HandDrawnCircle className="absolute -inset-4 w-auto h-auto text-[#2B1708] opacity-50 z-20 pointer-events-none hidden sm:block" />
                    </span>
                  </>
                )}
              </h1>
            </FadeIn>

            <FadeIn delay={200} className="mt-6 sm:mt-8">
              <div className="relative inline-block">
                <p className="text-base sm:text-xl md:text-2xl text-[#4A2E18] max-w-xl font-medium relative z-10 bg-[#FFF6E8] p-4 sm:p-6 border-[3px] border-[#2B1708] shadow-[8px_8px_0px_#2B1708]">
                  {t.hero.subHeadline}
                </p>
                <div className="absolute -bottom-4 -right-4 text-4xl transform rotate-12 hidden sm:block">✨</div>
              </div>
            </FadeIn>

            <FadeIn delay={400} className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-6 sm:pt-10">
              <button
                onClick={scrollWaitlist}
                className="bg-[#C05C30] text-white px-6 sm:px-8 py-4 sm:py-5 text-lg sm:text-xl font-bold transition-all border-b-[6px] border-r-[4px] border-t-[2px] border-l-[2px] border-[#2B1708] active:translate-y-1 active:translate-x-1 active:border-b-[2px] active:border-r-[2px] min-h-[56px] flex items-center justify-center gap-3"
              >
                {t.hero.primaryCta}
                <ArrowIcon className="w-5 sm:w-6 h-5 sm:h-6" />
              </button>
              <button
                onClick={scrollHowItWorks}
                className="bg-transparent text-[#C05C30] border-2 border-[#C05C30] px-6 sm:px-8 py-4 sm:py-5 text-lg sm:text-xl font-bold hover:bg-[#C05C30]/10 transition-all flex items-center justify-center relative min-h-[56px]"
              >
                {t.hero.secondaryCta}
              </button>
            </FadeIn>
          </div>

          {/* Right Column: Phone Mockup */}
          <div className="w-full lg:w-1/2 flex justify-center items-center min-h-[85vh] relative py-12 lg:py-0">
            <div className="absolute inset-4 sm:inset-0 bg-[#D4963B] rounded-[2rem] sm:rounded-[3rem] transform rotate-6 scale-95 border-[3px] border-[#2B1708]"></div>
            <div className="absolute inset-4 sm:inset-0 bg-[#C05C30] rounded-[2rem] sm:rounded-[3rem] transform -rotate-3 scale-100 border-[3px] border-[#2B1708]"></div>

            <FadeIn delay={300} className="relative z-10 w-[240px] sm:w-[280px] lg:w-[320px] h-[480px] sm:h-[560px] lg:h-[640px] bg-[#FFF6E8] rounded-[2.5rem] sm:rounded-[3rem] p-2 sm:p-3 shadow-2xl border-[3px] border-[#2B1708] transform hover:-translate-y-4 transition-transform duration-500">
              <div className="w-full h-full bg-[#FCF0DC] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden relative border-[3px] border-[#2B1708]/10">
                <div className="absolute top-0 inset-x-0 h-6 sm:h-7 bg-[#2B1708] rounded-b-2xl sm:rounded-b-3xl w-32 sm:w-40 mx-auto z-20"></div>

                <div className="h-full p-3 sm:p-4 pt-10 sm:pt-12 relative flex flex-col">
                  <div className="text-center mb-4 sm:mb-6 relative shrink-0">
                    <h3 className="font-bold text-sm sm:text-base text-[#2B1708]">{t.phone.walletTitle}</h3>
                    <HandDrawnStar className="absolute top-0 right-8 sm:right-10 w-5 sm:w-6 h-5 sm:h-6 text-[#D4963B]" />
                  </div>

                  <div className="bg-[#C05C30] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-[#FCF0DC] shadow-[0_8px_0_#A04A26] border-[3px] border-[#2B1708] relative overflow-hidden transform -rotate-1 flex-1 flex flex-col justify-center">
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

            <div className="absolute -right-4 sm:-right-16 top-24 sm:top-32 bg-[#FFF6E8] text-[#2B1708] font-black px-3 sm:px-4 py-2 sm:py-3 border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] animate-float z-30 transform rotate-6 rounded-lg text-sm sm:text-lg">
              {t.hero.badge1}
            </div>
            <div className="absolute -left-4 sm:-left-20 bottom-32 sm:bottom-40 bg-[#FFF6E8] text-[#C05C30] font-black px-3 sm:px-4 py-2 sm:py-3 border-[3px] border-[#2B1708] shadow-[-6px_6px_0px_#2B1708] animate-float-delayed z-30 transform -rotate-6 rounded-lg text-sm sm:text-lg">
              {t.hero.badge2}
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF STRIP: Badge left, Marquee right */}
      <section className="bg-[#FFF6E8] border-y-[3px] border-[#2B1708] relative z-20 flex flex-col md:flex-row items-center overflow-hidden">
        <div className={`flex items-center gap-3 px-6 py-4 md:py-6 whitespace-nowrap bg-[#FFF6E8] z-10 ${isRtl ? 'md:border-l-[3px]' : 'md:border-r-[3px]'} border-[#2B1708]`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C05C30] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C05C30] border-[2px] border-[#2B1708]"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-[#C05C30]">{t.socialProof.live}</span>
          </div>
          <div className="flex items-center gap-2 text-[#2B1708]">
            <span className={`text-xl sm:text-2xl font-black text-[#C05C30] ${titleFont}`}>
              <SocialProofCounter target={347} isArabic={isRtl} />+
            </span>
            <span className="text-sm sm:text-base font-bold">{t.socialProof.text}</span>
          </div>
          <span className="hidden sm:inline-block bg-[#FFF6E8] px-3 py-1 border-[2px] border-[#2B1708] shadow-[2px_2px_0px_#2B1708] text-xs font-bold transform -rotate-1 ml-2">{t.socialProof.cities}</span>
        </div>
        
        <div className="flex-1 overflow-hidden flex items-center bg-[#2B1708] py-4 md:py-6 w-full">
          <div className="animate-marquee flex gap-6 sm:gap-8 text-[#D4963B] text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-widest items-center">
            {[...Array(4)].map((_, i) => (
              <React.Fragment key={i}>
                {t.marquee.map((item, j) => (
                  <div key={`${i}-${j}`} className="flex items-center gap-6 sm:gap-8">
                    <span className="bg-[#FFF6E8] text-[#2B1708] px-3 py-1 border-[2px] border-[#2B1708] rounded-full shadow-[3px_3px_0px_#2B1708] transform hover:rotate-3 transition-transform">{item}</span>
                    <HandDrawnStar className="w-5 sm:w-6 h-5 sm:h-6 text-[#D4963B]" />
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* STATS SECTION: Horizontal Strip */}
      <section className="py-8 bg-[#FCF0DC] px-4 sm:px-6 border-b-[3px] border-[#2B1708]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">
          {t.stats.map((stat, i) => (
            <div key={i} className={`flex flex-col items-center flex-1 w-full md:w-auto ${i !== t.stats.length - 1 ? (isRtl ? 'md:border-l-[3px] md:border-[#2B1708]/20' : 'md:border-r-[3px] md:border-[#2B1708]/20') : ''} py-4 md:py-0`}>
              <div className={`text-4xl sm:text-5xl lg:text-6xl font-black ${titleFont} text-[#2B1708] mb-1 sm:mb-2 flex items-baseline`}>
                <CountUp end={stat.value} prefix={stat.prefix} suffix={stat.suffix} isArabic={isRtl} />
              </div>
              <div className="text-sm sm:text-base font-bold text-[#C05C30] uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS: Horizontal Timeline */}
      <section ref={howItWorksRef} id="how-it-works" className="py-20 sm:py-32 bg-[#FFF6E8] text-[#2B1708] px-4 sm:px-6 border-b-[3px] border-[#2B1708] relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-24 relative inline-block mx-auto w-full">
              <h2 className={`text-3xl sm:text-5xl md:text-7xl font-black ${titleFont} uppercase tracking-tighter inline-block relative bg-[#FFF6E8] text-[#2B1708] px-4 sm:px-8 py-2 sm:py-4 border-[3px] border-[#2B1708] shadow-[12px_12px_0px_#C05C30] transform -rotate-1`}>
                {t.howItWorks.title}
                <HandDrawnStar className="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 w-8 sm:w-12 h-8 sm:h-12 text-[#D4963B]" />
              </h2>
            </div>
          </FadeIn>

          <div className="relative flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-4 w-full pt-8">
            <div className="absolute top-[48px] left-[10%] right-[10%] h-[3px] border-t-[3px] border-dashed border-[#2B1708]/30 hidden lg:block z-0"></div>
            
            {t.howItWorks.steps.map((step, i) => (
              <FadeIn key={i} delay={i * 100} className="flex-1 w-full">
                <div className="flex flex-col items-center text-center relative z-10 group cursor-default">
                  <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full border-[3px] border-[#2B1708] bg-[#C05C30] text-[#FCF0DC] flex items-center justify-center text-2xl sm:text-3xl font-black mb-6 shadow-[4px_4px_0px_#2B1708] group-hover:scale-110 group-hover:bg-[#D4963B] group-hover:text-[#2B1708] transition-all duration-300">
                    {isRtl ? toArabicNumerals(i + 1) : i + 1}
                  </div>
                  <h3 className={`text-lg sm:text-xl font-black mb-2 uppercase text-[#2B1708]`}>{step.title}</h3>
                  <p className="text-sm sm:text-base font-bold text-[#4A2E18]/70 max-w-[200px]">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* BUSINESSES SECTION: 2-Column Layout */}
      <section className="py-20 sm:py-32 bg-[#FCF0DC] px-4 sm:px-6 relative border-b-[3px] border-[#2B1708]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          <FadeIn className="w-full lg:w-1/3">
            <div className="flex flex-col items-start text-start mb-8 lg:mb-0">
              <span className="bg-[#FFF6E8] text-[#C05C30] font-black px-4 py-2 rounded-full border-[3px] border-[#2B1708] mb-6 transform -rotate-2 inline-block text-sm">
                {t.phone.whoUses}
              </span>
              <h2 className={`text-3xl sm:text-5xl md:text-6xl font-black ${titleFont} uppercase tracking-tighter text-[#2B1708] relative inline-block mb-6`}>
                {t.businesses.title}
                <WavyUnderline className="absolute -bottom-4 left-0 w-32 h-4 text-[#D4963B]" />
              </h2>
              <p className="text-lg font-bold text-[#4A2E18]/80 leading-relaxed mt-4">
                {(t.businesses as any).desc || 'Designed to perfectly match your unique business needs and customer base. No matter the industry, Niqaty brings them back.'}
              </p>
            </div>
          </FadeIn>

          <div className="w-full lg:w-2/3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {t.businesses.items.map((item, i) => {
              const colors = ['bg-[#C05C30] text-[#FCF0DC]', 'bg-[#FFF6E8] text-[#2B1708]', 'bg-[#D4963B] text-[#2B1708]', 'bg-[#2B1708] text-[#FCF0DC]'];
              const color = colors[i % colors.length];
              
              return (
                <FadeIn key={i} delay={i * 50}>
                  <div className={`p-4 border-[3px] border-[#2B1708] shadow-[4px_4px_0px_#2B1708] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#2B1708] transition-all duration-300 relative group ${color} cursor-pointer flex flex-col items-center justify-center text-center h-32 sm:h-40 rounded-2xl`}>
                    <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 transform group-hover:scale-110 transition-transform">
                      {item.emoji}
                    </div>
                    <h3 className="text-sm sm:text-base font-black uppercase leading-tight">{item.title}</h3>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-20 sm:py-32 bg-[#2B1708] px-4 sm:px-6 border-b-[3px] border-[#C05C30] relative overflow-hidden">
        <DoodleScribble className="absolute top-0 right-0 w-full h-full text-[#C05C30] opacity-10 pointer-events-none" />
        <HandDrawnStar className="absolute top-20 left-20 w-24 h-24 text-[#D4963B] animate-float hidden lg:block" />
        <HandDrawnStar className="absolute bottom-20 right-20 w-16 h-16 text-[#FCF0DC] animate-float-delayed hidden lg:block" />

        <div className="max-w-2xl mx-auto relative z-10">
          <FadeIn>
            <div className="bg-[#FCF0DC] border-[3px] border-[#D4963B] p-6 sm:p-10 md:p-16 shadow-[16px_16px_0px_#2B1708] relative transform rotate-1 cursor-default">
              <div className="absolute -top-4 right-1/2 transform translate-x-1/2 sm:translate-x-0 sm:-right-8 bg-[#C05C30] text-[#FCF0DC] font-black px-6 sm:px-8 py-2 sm:py-3 border-[3px] border-[#2B1708] -rotate-3 shadow-[4px_4px_0px_#2B1708] z-20 text-base sm:text-xl uppercase tracking-wider">
                {t.phone.bestDeal}
              </div>

              <div className="text-center mb-6 sm:mb-10 border-b-[3px] border-dashed border-[#2B1708] pb-6 sm:pb-10 pt-4">
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
                className="w-full bg-[#D4963B] text-[#2B1708] px-6 py-4 sm:py-5 text-xl sm:text-2xl font-black transition-all border-b-[6px] border-r-[4px] border-t-[2px] border-l-[2px] border-[#2B1708] active:translate-y-1 active:translate-x-1 active:border-b-[2px] active:border-r-[2px] uppercase flex items-center justify-center min-h-[64px]"
              >
                {t.pricing.cta}
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* WAITLIST SECTION: 2-Column */}
      <section ref={waitlistRef} id="waitlist" className="py-20 sm:py-32 bg-[#FFF6E8] px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          
          <div className="w-full lg:w-1/2">
            <FadeIn>
              <h2 className={`text-3xl sm:text-5xl md:text-6xl font-black ${titleFont} mb-6 text-[#2B1708] uppercase tracking-tighter`}>
                {t.waitlist.title}
              </h2>
              <div className="relative">
                <HandDrawnArrow className={`absolute ${isRtl ? '-right-16 transform scale-x-[-1]' : '-left-16'} top-4 w-16 h-16 text-[#D4963B] hidden md:block rotate-45`} />
                {!formSuccess ? (
                  <div className="space-y-4 sm:space-y-6">
                    <form
                      onSubmit={submit}
                      className="flex flex-col gap-4 items-start"
                    >
                      <input
                        type="text"
                        value={input}
                        onChange={e => { setInput(e.target.value); setFormError(false); }}
                        placeholder={t.waitlist.placeholder}
                        dir={isRtl ? 'rtl' : 'ltr'}
                        className="w-full bg-[#FCF0DC] px-5 sm:px-8 h-[64px] text-lg sm:text-xl outline-none border-[3px] border-[#2B1708] focus:ring-4 focus:ring-[#C05C30]/30 transition-all font-bold placeholder:text-[#4A2E18]/50 text-[#2B1708] rounded-xl shadow-[4px_4px_0px_#2B1708]"
                      />
                      {formError && (
                        <p className="text-[#C05C30] font-bold text-sm w-full">{t.waitlist.err}</p>
                      )}
                      <button
                        type="submit"
                        className="w-full bg-[#2B1708] text-[#FCF0DC] px-8 h-[64px] text-lg sm:text-xl font-black transition-all border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#C05C30] active:translate-y-1 active:translate-x-1 active:shadow-[2px_2px_0px_#C05C30] rounded-xl flex items-center justify-center gap-3"
                      >
                        {t.waitlist.button}
                        <ArrowIcon className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-[#D4963B] text-[#2B1708] p-8 border-[3px] border-[#2B1708] shadow-[8px_8px_0px_#2B1708] transform rotate-1 rounded-2xl">
                    <div className="text-5xl mb-4">🎉</div>
                    <p className="text-xl sm:text-2xl font-black">{t.waitlist.success}</p>
                  </div>
                )}
              </div>
            </FadeIn>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col justify-center items-start text-start">
            <FadeIn delay={200} className="w-full">
              <div className="bg-[#FCF0DC] p-8 sm:p-10 border-[3px] border-[#2B1708] shadow-[8px_8px_0px_#2B1708] rounded-3xl transform -rotate-1 relative">
                <HandDrawnStar className={`absolute -top-6 ${isRtl ? '-left-6' : '-right-6'} w-12 h-12 text-[#C05C30]`} />
                <p className="text-lg sm:text-xl text-[#4A2E18] mb-6 font-bold leading-relaxed">
                  {t.waitlist.desc}
                </p>
                <div className="flex items-center gap-4 border-t-[3px] border-dashed border-[#2B1708] pt-6 mb-6">
                  <div className="flex -space-x-4 space-x-reverse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full bg-[#C05C30] border-[2px] border-[#2B1708] flex items-center justify-center text-white text-xs font-bold z-10">
                        {['أ', 'م', 'س'][i-1]}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-[#4A2E18] font-bold flex-1">
                    {(t.waitlist as any).trustNote}
                  </p>
                </div>
                
                <a
                  href="https://wa.me/1234567890"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#25D366] text-white px-6 py-4 text-lg font-black transition-all border-[3px] border-[#2B1708] shadow-[4px_4px_0px_#2B1708] hover:translate-y-1 hover:translate-x-1 hover:shadow-none rounded-xl flex items-center justify-center gap-3"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"></path><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"></path></svg>
                  {t.waitlist.whatsappCta}
                </a>
              </div>
            </FadeIn>
          </div>
          
        </div>
      </section>

      <footer className="bg-[#2B1708] text-[#FCF0DC] py-8 text-center border-t-[3px] border-[#2B1708]">
        <p className="font-bold opacity-80 text-sm sm:text-base">
          © {new Date().getFullYear()} {t.nav.logo}. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
        </p>
      </footer>
    </div>
  );
}