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

export default function AffordanceBento() {
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
              className="bg-[#C05C30] text-white px-6 py-2 font-bold transition-all border-b-[6px] border-r-[4px] border-t-[2px] border-l-[2px] border-[#2B1708] active:translate-y-1 active:translate-x-1 active:border-b-[2px] active:border-r-[2px] min-h-[48px] flex items-center justify-center rounded-xl"
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
              className="w-full bg-[#C05C30] text-white py-3 font-bold border-b-[6px] border-r-[4px] border-t-[2px] border-l-[2px] border-[#2B1708] active:translate-y-1 active:translate-x-1 active:border-b-[2px] active:border-r-[2px] min-h-[56px] flex items-center justify-center rounded-xl"
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

      <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-24 space-y-3 relative z-10">
        
        {/* HERO BENTO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-7 bg-[#FFF6E8] border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] p-8 sm:p-12 lg:p-16 rounded-3xl relative flex flex-col justify-center">
            <HandDrawnStar className="absolute top-10 right-10 w-8 sm:w-12 h-8 sm:h-12 text-[#D4963B] animate-float hidden sm:block" />
            <FadeIn>
              <div className="inline-block bg-[#FCF0DC] text-[#C05C30] px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-widest mb-6 border-[3px] border-[#2B1708] shadow-[4px_4px_0px_#2B1708] transform -rotate-2">
                {t.phone.badge}
              </div>
              <h1 className={`text-4xl sm:text-6xl md:text-7xl font-black ${titleFont} leading-[1.1] uppercase relative text-[#2B1708] mb-6`}>
                {lang === 'en' ? (
                  <>
                    <span className="relative inline-block transform -rotate-1 mb-2">Your customers
                      <div className="absolute inset-0 bg-[#D4963B] -z-10 transform rotate-1 translate-y-2 translate-x-2"></div>
                    </span><br/>
                    vanish.<br/>
                    <span className="text-[#FCF0DC] relative inline-block transform rotate-1 mt-2 px-2">Niqaty brings them back.
                      <div className="absolute inset-0 bg-[#C05C30] -z-10 transform -rotate-1"></div>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="relative inline-block transform rotate-1 mb-2">عميلك يختفي
                      <div className="absolute inset-0 bg-[#D4963B] -z-10 transform -rotate-1 translate-y-2 -translate-x-2"></div>
                    </span><br/>
                    نقاطي<br/>
                    <span className="text-[#FCF0DC] relative inline-block transform -rotate-1 mt-2 px-4 py-1">يرجّعه.
                      <div className="absolute inset-0 bg-[#C05C30] -z-10 transform rotate-1"></div>
                    </span>
                  </>
                )}
              </h1>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="text-base sm:text-xl text-[#4A2E18] max-w-xl font-bold bg-[#FCF0DC] p-4 sm:p-6 border-[3px] border-[#2B1708] shadow-[4px_4px_0px_#2B1708] mb-8">
                {t.hero.subHeadline}
              </p>
            </FadeIn>
            <FadeIn delay={400} className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={scrollWaitlist}
                className="bg-[#C05C30] text-white px-6 sm:px-8 py-4 sm:py-5 text-lg font-bold transition-all border-b-[6px] border-r-[4px] border-t-[2px] border-l-[2px] border-[#2B1708] active:translate-y-1 active:translate-x-1 active:border-b-[2px] active:border-r-[2px] min-h-[56px] flex items-center justify-center gap-3 rounded-xl"
              >
                {t.hero.primaryCta}
                <ArrowIcon className="w-5 sm:w-6 h-5 sm:h-6" />
              </button>
              <button
                onClick={scrollHowItWorks}
                className="bg-[#FCF0DC] text-[#2B1708] border-[3px] border-[#2B1708] px-6 sm:px-8 py-4 sm:py-5 text-lg font-bold hover:bg-[#FFF6E8] transition-all flex items-center justify-center relative min-h-[56px] shadow-[4px_4px_0px_#2B1708] active:translate-y-1 active:translate-x-1 active:shadow-none rounded-xl"
              >
                {t.hero.secondaryCta}
              </button>
            </FadeIn>
          </div>

          <div className="lg:col-span-5 bg-[#C05C30] border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] p-6 sm:p-10 rounded-3xl relative flex items-center justify-center min-h-[500px] overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMyQjE3MDgiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50"></div>
            
            <FadeIn delay={300} className="relative z-10 w-[240px] sm:w-[280px] h-full max-h-[560px] bg-[#FFF6E8] rounded-[2.5rem] p-2 sm:p-3 shadow-2xl border-[3px] border-[#2B1708] transform -rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="w-full h-full bg-[#FCF0DC] rounded-[2rem] overflow-hidden relative border-[3px] border-[#2B1708]/10 flex flex-col">
                <div className="absolute top-0 inset-x-0 h-6 bg-[#2B1708] rounded-b-2xl w-32 mx-auto z-20"></div>

                <div className="flex-1 p-3 sm:p-4 pt-10 sm:pt-12 relative flex flex-col">
                  <div className="text-center mb-4 relative">
                    <h3 className="font-bold text-sm sm:text-base text-[#2B1708]">{t.phone.walletTitle}</h3>
                    <HandDrawnStar className="absolute top-0 right-4 w-4 h-4 text-[#D4963B]" />
                  </div>

                  <div className="bg-[#D4963B] rounded-2xl p-4 sm:p-5 text-[#2B1708] shadow-[0_6px_0_#A8742A] border-[3px] border-[#2B1708] relative overflow-hidden flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <div className="font-bold opacity-90 text-xs uppercase tracking-wider bg-[#FFF6E8]/40 inline-block px-2 py-1 rounded border border-[#2B1708] mb-1">Niqaty</div>
                        <div className="font-black text-xl sm:text-2xl mt-1 leading-none" style={{whiteSpace: 'pre-line'}}>{t.phone.shopName}</div>
                      </div>
                      <div className="w-10 h-10 bg-[#FFF6E8] rounded-full flex items-center justify-center text-xl shadow-inner border-[3px] border-[#2B1708]">☕</div>
                    </div>

                    <div className="bg-[#FFF6E8] rounded-xl p-3 mb-4 border-[3px] border-[#2B1708] shadow-[4px_4px_0px_#2B1708] text-[#2B1708] relative z-10">
                      <div className="flex justify-between text-xs sm:text-sm mb-2 font-black uppercase">
                        <span>{t.phone.rewards}</span>
                        <span className="bg-[#FCF0DC] px-2 py-0.5 rounded border-[2px] border-[#2B1708]">{isRtl ? `${toArabicNumerals(stamps)}/${toArabicNumerals(10)}` : `${stamps}/10`}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={`aspect-square rounded-full flex items-center justify-center border-[2px] sm:border-[3px] transition-all duration-300
                              ${i < stamps
                                ? 'bg-[#C05C30] border-[#2B1708] scale-100'
                                : 'bg-gray-100 border-gray-300 scale-90'}`}
                          >
                            {i < stamps && <Check className="w-3 h-3 text-[#FFF6E8]" strokeWidth={4} />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto bg-[#FFF6E8] p-3 rounded-xl flex justify-center border-[3px] border-[#2B1708] relative z-10">
                      <div className="w-20 sm:w-24 h-20 sm:h-24 bg-[#FCF0DC] flex items-center justify-center p-2 relative rounded-xl border-[3px] border-dashed border-[#2B1708]">
                        <div className="w-14 sm:w-16 h-14 sm:h-16 bg-[#2B1708] rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
            
            <div className="absolute top-10 left-10 bg-[#FFF6E8] text-[#2B1708] font-black px-4 py-2 border-[3px] border-[#2B1708] shadow-[4px_4px_0px_#2B1708] transform -rotate-12 rounded-xl text-sm hidden sm:block">
              {t.hero.badge1}
            </div>
            <div className="absolute bottom-10 right-10 bg-[#FFF6E8] text-[#C05C30] font-black px-4 py-2 border-[3px] border-[#2B1708] shadow-[4px_4px_0px_#2B1708] transform rotate-6 rounded-xl text-sm hidden sm:block">
              {t.hero.badge2}
            </div>
          </div>
        </div>

        {/* STATS + SOCIAL PROOF BENTO ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="col-span-2 lg:col-span-12 bg-[#2B1708] border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] rounded-2xl overflow-hidden flex items-center h-16 sm:h-20 whitespace-nowrap">
            <div className="animate-marquee flex gap-6 sm:gap-8 text-[#D4963B] text-xl sm:text-2xl font-black uppercase tracking-widest items-center w-full">
              {[...Array(6)].map((_, i) => (
                <React.Fragment key={i}>
                  {t.marquee.map((item, j) => (
                    <div key={`${i}-${j}`} className="flex items-center gap-6 sm:gap-8">
                      <span>{item}</span>
                      <HandDrawnStar className="w-5 sm:w-6 h-5 sm:h-6 text-[#FCF0DC]/30" />
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {t.stats.map((stat, i) => (
            <FadeIn key={i} delay={i * 100} className="col-span-1 lg:col-span-3">
              <div className="h-full bg-[#FFF6E8] border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] py-6 px-4 rounded-2xl flex flex-col items-center justify-center text-center transform hover:-translate-y-1 transition-transform cursor-default">
                <div className={`text-4xl sm:text-5xl lg:text-6xl font-black ${titleFont} text-[#C05C30] mb-2`}>
                  <CountUp end={stat.value} prefix={stat.prefix} suffix={stat.suffix} isArabic={isRtl} />
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#2B1708] uppercase tracking-widest bg-[#FCF0DC] px-3 py-1 rounded-lg border-[2px] border-[#2B1708]">
                  {stat.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* HOW IT WORKS BENTO */}
        <div ref={howItWorksRef} className="grid grid-cols-1 md:grid-cols-12 gap-3" id="how-it-works">
          <div className="md:col-span-12 bg-[#D4963B] border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] py-6 px-6 rounded-2xl flex items-center justify-center relative overflow-hidden">
            <HandDrawnCircle className="absolute -right-10 top-1/2 transform -translate-y-1/2 w-32 h-32 text-[#2B1708] opacity-20" />
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black ${titleFont} text-[#2B1708] uppercase tracking-tighter m-0 relative z-10`}>
              {t.howItWorks.title}
            </h2>
          </div>
          
          {t.howItWorks.steps.slice(0,3).map((step, i) => {
            const spans = ['md:col-span-5', 'md:col-span-3', 'md:col-span-4'];
            const bgs = ['bg-[#FFF6E8]', 'bg-[#FCF0DC]', 'bg-[#2B1708]'];
            const texts = ['text-[#2B1708]', 'text-[#2B1708]', 'text-[#FCF0DC]'];
            const numberColors = ['text-[#C05C30]', 'text-[#D4963B]', 'text-[#D4963B]'];
            
            return (
              <FadeIn key={i} delay={i * 100} className={spans[i]}>
                <div className={`${bgs[i]} ${texts[i]} border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] p-6 sm:p-8 rounded-2xl h-[250px] sm:h-[280px] flex flex-col relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
                  <div className={`text-4xl sm:text-5xl font-black ${numberColors[i]} mb-4`}>{isRtl ? toArabicNumerals(i + 1) : i + 1}</div>
                  <h3 className="text-xl sm:text-2xl font-black mb-2 uppercase">{step.title}</h3>
                  <p className="font-bold opacity-80 text-sm sm:text-base mt-auto border-t-[3px] border-dashed border-current pt-4">
                    {step.desc}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* BUSINESSES / FEATURES BENTO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4 bg-[#FFF6E8] border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] p-8 lg:p-12 rounded-2xl flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[200px]">
            <DoodleScribble className="absolute -left-10 -bottom-10 w-40 h-40 text-[#D4963B] opacity-30" />
            <span className="bg-[#FCF0DC] text-[#C05C30] font-black px-4 py-2 rounded-full border-[3px] border-[#2B1708] mb-6 transform -rotate-3 inline-block text-xs sm:text-sm relative z-10 shadow-[2px_2px_0px_#2B1708]">
              {t.phone.whoUses}
            </span>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black ${titleFont} uppercase text-[#2B1708] tracking-tighter relative z-10 leading-tight`}>
              {t.businesses.title}
            </h2>
          </div>
          
          <div className="lg:col-span-8 bg-[#FCF0DC] border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] p-4 sm:p-6 rounded-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 h-full">
              {t.businesses.items.map((item, i) => (
                <div key={i} className="bg-[#FFF6E8] border-[3px] border-[#2B1708] rounded-xl flex flex-col items-center justify-center p-4 sm:p-6 shadow-[2px_2px_0px_#2B1708] hover:bg-[#D4963B] hover:text-[#2B1708] transition-colors group cursor-default">
                  <span className="text-3xl sm:text-4xl mb-3 transform group-hover:scale-125 transition-transform">{item.emoji}</span>
                  <span className="font-black text-xs sm:text-sm uppercase text-center">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PRICING BENTO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 bg-[#FCF0DC] border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] p-8 lg:p-12 rounded-2xl flex flex-col justify-center opacity-90 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#2B1708] opacity-5"></div>
            <h3 className="text-2xl sm:text-3xl font-black mb-2 text-[#2B1708] relative z-10">{lang === 'ar' ? 'الباقة الأساسية' : 'Basic Plan'}</h3>
            <div className="text-4xl sm:text-5xl font-black mb-6 text-[#2B1708] relative z-10">{lang === 'ar' ? 'مجاناً' : 'Free'}</div>
            <ul className="space-y-4 mb-8 font-bold text-[#4A2E18] relative z-10">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-[2px] border-[#2B1708] flex items-center justify-center bg-[#FFF6E8]"><Check className="w-3 h-3 text-[#2B1708]" /></div>
                {lang === 'ar' ? 'حد أقصى ١٠٠ عميل' : 'Up to 100 customers'}
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-[2px] border-[#2B1708] flex items-center justify-center bg-[#FFF6E8]"><Check className="w-3 h-3 text-[#2B1708]" /></div>
                {lang === 'ar' ? 'تصميم بطاقة قياسي' : 'Standard card design'}
              </li>
              <li className="flex items-center gap-3 opacity-50">
                <div className="w-5 h-5 rounded-full border-[2px] border-[#2B1708] flex items-center justify-center bg-transparent"></div>
                {lang === 'ar' ? 'دعم واتساب' : 'WhatsApp Support'}
              </li>
            </ul>
            <button className="w-full py-4 bg-[#FFF6E8] border-[3px] border-[#2B1708] text-[#2B1708] font-black text-lg rounded-xl shadow-[4px_4px_0px_#2B1708] relative z-10">
              {lang === 'ar' ? 'ابدأ مجاناً' : 'Start Free'}
            </button>
          </div>
          
          <div className="lg:col-span-7 bg-[#C05C30] text-[#FCF0DC] border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] p-8 lg:p-12 rounded-2xl relative flex flex-col justify-center">
            <HandDrawnCircle className="absolute -top-20 -right-20 w-64 h-64 text-[#2B1708] opacity-20 pointer-events-none" />
            <div className="absolute top-6 right-6 bg-[#D4963B] text-[#2B1708] px-4 py-2 text-sm font-black uppercase rounded-full border-[3px] border-[#2B1708] transform rotate-3 shadow-[4px_4px_0px_#2B1708]">
              {t.phone.bestDeal}
            </div>
            
            <h3 className="text-3xl sm:text-4xl font-black mb-4 uppercase">{t.pricing.title}</h3>
            <div className="flex items-end gap-3 mb-8 bg-[#2B1708] self-start px-6 py-4 rounded-2xl border-[3px] border-[#FCF0DC] transform -rotate-1">
              <span className="text-5xl sm:text-6xl font-black">{t.pricing.price}</span>
              <span className="text-xl sm:text-2xl font-bold opacity-90 mb-2">{t.pricing.period}</span>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-10">
              {t.pricing.features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 font-bold text-base sm:text-lg">
                  <div className="w-6 h-6 rounded-full border-[3px] border-[#2B1708] bg-[#D4963B] flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-[#2B1708] stroke-[4]" />
                  </div>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            
            <button onClick={scrollWaitlist} className="w-full bg-[#FFF6E8] text-[#2B1708] py-4 sm:py-5 text-xl sm:text-2xl font-black border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] hover:translate-y-1 hover:translate-x-1 hover:shadow-[0px_0px_0px_#2B1708] transition-all rounded-xl uppercase flex items-center justify-center gap-3">
              {t.pricing.cta}
              <ArrowIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* WAITLIST BENTO */}
        <div ref={waitlistRef} className="grid grid-cols-1 lg:grid-cols-12 gap-3" id="waitlist">
          <div className="lg:col-span-5 bg-[#2B1708] text-[#FCF0DC] border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] p-8 lg:p-12 rounded-2xl flex flex-col justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[#D4963B] opacity-10 mix-blend-overlay"></div>
            <div className="text-6xl sm:text-7xl lg:text-8xl font-black text-[#C05C30] mb-4 font-['DM_Sans'] tracking-tighter relative z-10">
              <SocialProofCounter target={347} isArabic={isRtl} />+
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-6 relative z-10">{t.socialProof.text}</p>
            <div className="h-[3px] w-16 bg-[#D4963B] mb-6 relative z-10"></div>
            <p className="text-sm sm:text-base font-bold opacity-70 mb-8 relative z-10 leading-relaxed">{(t.waitlist as any).trustNote}</p>
            <div className="flex items-center gap-3 mt-auto bg-[#FCF0DC]/10 self-start px-4 py-2 rounded-full border border-[#FCF0DC]/20 relative z-10">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C05C30] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C05C30] border-[2px] border-[#2B1708]"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-[#FCF0DC]">{t.socialProof.live}</span>
            </div>
          </div>
          
          <div className="lg:col-span-7 bg-[#FFF6E8] border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] p-8 lg:p-12 rounded-2xl flex flex-col justify-center">
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black ${titleFont} mb-4 text-[#2B1708] uppercase tracking-tighter`}>
              {t.waitlist.title}
            </h2>
            <p className="text-base sm:text-lg font-bold text-[#4A2E18] mb-8 max-w-lg">
              {t.waitlist.desc}
            </p>
            
            {!formSuccess ? (
              <form onSubmit={submit} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={input}
                  onChange={e => { setInput(e.target.value); setFormError(false); }}
                  placeholder={t.waitlist.placeholder}
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className="w-full bg-[#FCF0DC] px-6 h-16 text-lg outline-none border-[3px] border-[#2B1708] focus:ring-4 focus:ring-[#C05C30]/30 transition-all font-bold placeholder:text-[#4A2E18]/50 text-[#2B1708] rounded-xl shadow-[4px_4px_0px_#2B1708]"
                />
                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                  <button type="submit" className="flex-1 bg-[#C05C30] text-white px-6 h-16 text-lg sm:text-xl font-bold border-[3px] border-[#2B1708] shadow-[4px_4px_0px_#2B1708] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex items-center justify-center gap-3 uppercase rounded-xl">
                    {t.waitlist.button}
                  </button>
                  <a href="https://wa.me/966500000000" target="_blank" rel="noopener noreferrer" className="sm:w-auto bg-[#25D366] text-white px-8 h-16 text-lg font-bold border-[3px] border-[#2B1708] shadow-[4px_4px_0px_#2B1708] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex items-center justify-center gap-3 rounded-xl">
                    <svg viewBox="0 0 24 24" className="w-6 sm:w-7 h-6 sm:h-7 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                </div>
                {formError && <p className="text-red-600 text-sm font-bold bg-red-100 p-3 rounded-lg border-[2px] border-red-300 mt-2">{t.waitlist.err}</p>}
              </form>
            ) : (
              <div className="bg-[#D4963B] text-[#2B1708] p-6 sm:p-8 border-[3px] border-[#2B1708] rounded-xl font-black text-lg sm:text-xl flex items-center justify-center gap-4 text-center transform rotate-1 shadow-[4px_4px_0px_#2B1708]">
                <span className="text-3xl sm:text-4xl">🎉</span>
                {t.waitlist.success}
              </div>
            )}
          </div>
        </div>

      </main>

      <footer className="bg-[#2B1708] text-[#FCF0DC] py-8 sm:py-12 px-4 sm:px-6 mt-12 border-t-[3px] border-[#D4963B] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className={`text-3xl sm:text-4xl font-black ${titleFont} tracking-tighter flex items-center gap-2`}>
            {t.nav.logo}
            <div className="w-3 sm:w-4 h-3 sm:h-4 bg-[#C05C30] rounded-full border-[2px] border-[#FCF0DC]"></div>
          </div>
          <div className="text-[#FCF0DC]/60 font-bold font-mono text-sm sm:text-base bg-[#FCF0DC]/10 px-4 py-2 rounded-xl border border-[#FCF0DC]/20">
            &copy; {new Date().getFullYear()} Niqaty. {lang === 'ar' ? 'صُنع في السعودية 🇸🇦' : 'Made in Saudi Arabia 🇸🇦'}
          </div>
        </div>
      </footer>

      <div style={{ position: 'fixed', bottom: '16px', left: '16px', background: '#2B1708', color: '#FCF0DC', padding: '8px 12px', fontSize: '11px', borderRadius: '4px', zIndex: 999, opacity: 0.85 }}>
        Layout: Asymmetric Bento Grid
      </div>
    </div>
  );
}
