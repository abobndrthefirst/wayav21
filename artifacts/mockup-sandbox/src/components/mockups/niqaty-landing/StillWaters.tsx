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
  <svg viewBox="0 0 100 100" className={className} fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M50 10 Q55 35 85 40 Q55 50 65 85 Q45 65 15 85 Q30 55 10 45 Q40 35 50 10 Z" />
  </svg>
);

const HandDrawnArrow = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 50 Q40 10 90 40 M70 20 Q85 35 90 40 Q75 55 60 60" />
  </svg>
);

const HandDrawnCircle = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M50 10 C75 8, 95 25, 90 50 C85 75, 60 95, 30 85 C10 75, 5 45, 20 25 C30 15, 45 12, 55 15" />
  </svg>
);

const WavyUnderline = ({ className = "" }) => (
  <svg viewBox="0 0 100 20" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" preserveAspectRatio="none" aria-hidden="true">
    <path d="M5 10 Q15 0 25 10 T45 10 T65 10 T85 10 T95 10" />
  </svg>
);

const DoodleScribble = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

export default function StillWaters() {
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
      className={`min-h-screen ${bodyFont} bg-[#F5F2EC] text-[#3D4A3F] overflow-x-hidden transition-all duration-300`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <nav className="fixed top-0 w-full z-50 bg-[#F5F2EC]/90 backdrop-blur-md border-b-2 border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className={`text-2xl sm:text-3xl font-black ${titleFont} tracking-tighter relative text-[#1A1A1A]`}>
            <span className="relative z-10">{t.nav.logo}</span>
            <div className="absolute -bottom-1 left-0 w-full h-2 bg-[#A07C33] -z-10"></div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-2 font-bold hover:text-[#2E5F40] transition-colors uppercase tracking-widest text-sm bg-white px-4 py-1.5 border-2 border-[#1A1A1A]"
            >
              <Globe className="w-4 h-4" />
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            <button
              onClick={scrollWaitlist}
              className="bg-[#2E5F40] text-white px-6 py-3 font-bold hover:bg-[#1f422c] transition-all shadow-[4px_4px_0px_#1A1A1A] border-2 border-[#1A1A1A] rounded-none"
            >
              {t.nav.cta}
            </button>
          </div>
          <button
            className="md:hidden p-2 text-[#1A1A1A]"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#F5F2EC] border-t-2 border-[#1A1A1A] px-4 py-4 flex flex-col gap-3">
            <button
              onClick={scrollWaitlist}
              className="w-full bg-[#2E5F40] text-white py-3 font-bold border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-none"
            >
              {t.nav.cta}
            </button>
            <button
              onClick={() => { setLang(lang === 'ar' ? 'en' : 'ar'); setMenuOpen(false); }}
              className="flex items-center justify-center gap-2 font-bold text-sm bg-white px-3 py-2 border-2 border-[#1A1A1A]"
            >
              <Globe className="w-4 h-4" />
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        )}
      </nav>

      <section className="pt-32 sm:pt-36 pb-16 sm:pb-20 px-4 sm:px-6 min-h-[80vh] flex items-center relative overflow-hidden bg-[#F5F2EC]">
        <HandDrawnStar className="absolute top-40 left-10 w-8 sm:w-12 h-8 sm:h-12 text-[#A07C33] animate-float hidden sm:block" />
        <HandDrawnStar className="absolute bottom-20 right-20 w-12 sm:w-16 h-12 sm:h-16 text-[#2E5F40] animate-float-delayed hidden sm:block" />
        <DoodleScribble className="absolute top-20 right-1/4 w-24 h-24 text-[#1A1A1A] opacity-10 hidden lg:block" />

        <div className="hidden lg:block absolute top-1/4 right-10 text-5xl animate-float bg-white rounded-none p-4 shadow-[4px_4px_0px_#1A1A1A] border-2 border-[#1A1A1A]" aria-hidden="true">☕</div>
        <div className="hidden lg:block absolute bottom-1/4 left-10 text-4xl animate-float-delayed bg-[#FFFFFF] rounded-none p-4 shadow-[4px_4px_0px_#1A1A1A] border-2 border-[#1A1A1A]" aria-hidden="true">🎯</div>

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 relative">
            <HandDrawnArrow className={`absolute -top-16 ${isRtl ? 'left-0 transform scale-x-[-1]' : 'right-0'} w-24 h-24 text-[#A07C33] hidden lg:block`} />

            <FadeIn>
              <div className="inline-block bg-white text-[#2E5F40] px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-widest mb-4 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]">
                {t.phone.badge}
              </div>
              <h1 className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black ${titleFont} leading-[1.1] uppercase relative text-[#1A1A1A]`}>
                {lang === 'en' ? (
                  <>
                    <span className="relative inline-block mb-2">Your customers
                      <div className="absolute inset-0 bg-[#A07C33] -z-10 translate-y-2 translate-x-2"></div>
                    </span><br/>
                    vanish.<br/>
                    <span className="text-[#F5F2EC] relative inline-block mt-2 px-2">Niqaty brings them back.
                      <div className="absolute inset-0 bg-[#2E5F40] -z-10"></div>
                      <HandDrawnCircle className="absolute -inset-4 w-auto h-auto text-[#1A1A1A] opacity-30 z-20 pointer-events-none hidden sm:block" />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="relative inline-block mb-2">عميلك يختفي
                      <div className="absolute inset-0 bg-[#A07C33] -z-10 translate-y-2 -translate-x-2"></div>
                    </span><br/>
                    نقاطي<br/>
                    <span className="text-[#F5F2EC] relative inline-block mt-2 px-4">يرجّعه.
                      <div className="absolute inset-0 bg-[#2E5F40] -z-10"></div>
                      <HandDrawnCircle className="absolute -inset-4 w-auto h-auto text-[#1A1A1A] opacity-30 z-20 pointer-events-none hidden sm:block" />
                    </span>
                  </>
                )}
              </h1>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="relative inline-block">
                <p className="text-base sm:text-xl md:text-2xl text-[#3D4A3F] max-w-xl font-medium relative z-10 bg-white p-4 sm:p-6 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]">
                  {t.hero.subHeadline}
                </p>
                <div className="absolute -bottom-4 -right-4 text-3xl hidden sm:block">✨</div>
              </div>
            </FadeIn>

            <FadeIn delay={400} className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 sm:pt-8">
              <button
                onClick={scrollWaitlist}
                className="bg-[#2E5F40] text-white px-6 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-bold hover:bg-[#1f422c] transition-all shadow-[4px_4px_0px_#1A1A1A] border-2 border-[#1A1A1A] flex items-center justify-center gap-3 rounded-none"
              >
                {t.hero.primaryCta}
                <ArrowIcon className="w-5 sm:w-6 h-5 sm:h-6" />
              </button>
              <button
                onClick={scrollHowItWorks}
                className="bg-transparent text-[#2E5F40] border-[1.5px] border-[#2E5F40] px-6 sm:px-8 py-4 sm:py-5 text-lg sm:text-xl font-bold hover:bg-[#2E5F40]/5 transition-all rounded-none"
              >
                {t.hero.secondaryCta}
              </button>
            </FadeIn>
          </div>

          <div className="lg:col-span-5 relative h-[400px] sm:h-[500px] lg:h-[600px] flex justify-center items-center mt-8 lg:mt-0">
            <div className="absolute inset-4 sm:inset-0 bg-[#A07C33] rounded-none scale-95 border-2 border-[#1A1A1A] transform rotate-1"></div>
            <div className="absolute inset-4 sm:inset-0 bg-[#2E5F40] rounded-none scale-100 border-2 border-[#1A1A1A] transform -rotate-1"></div>

            <FadeIn delay={300} className="relative z-10 w-[240px] sm:w-[280px] lg:w-[300px] h-[480px] sm:h-[560px] lg:h-[600px] bg-white rounded-[2rem] p-2 sm:p-3 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] transform hover:-translate-y-2 transition-transform duration-500">
              <div className="w-full h-full bg-[#F5F2EC] rounded-[1.5rem] overflow-hidden relative border border-[#1A1A1A]/10">
                <div className="absolute top-0 inset-x-0 h-6 sm:h-7 bg-[#1A1A1A] rounded-b-xl w-32 sm:w-40 mx-auto z-20"></div>

                <div className="h-full p-3 sm:p-4 pt-10 sm:pt-12 relative">
                  <div className="text-center mb-4 sm:mb-6 relative">
                    <h3 className="font-bold text-sm sm:text-base text-[#1A1A1A]">{t.phone.walletTitle}</h3>
                    <HandDrawnStar className="absolute top-0 right-8 sm:right-10 w-5 sm:w-6 h-5 sm:h-6 text-[#A07C33]" />
                  </div>

                  <div className="bg-[#2E5F40] rounded-xl p-4 sm:p-6 text-[#F5F2EC] shadow-sm border-2 border-[#1A1A1A] relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#A07C33] rounded-full opacity-40 mix-blend-multiply"></div>
                    
                    <div className="flex justify-between items-start mb-6 sm:mb-8 relative z-10">
                      <div>
                        <div className="font-bold opacity-90 text-xs sm:text-sm uppercase tracking-wider bg-white/20 inline-block px-2 py-1 rounded-sm text-white">Niqaty</div>
                        <div className="font-black text-xl sm:text-2xl mt-2 leading-none text-white" style={{whiteSpace: 'pre-line'}}>{t.phone.shopName}</div>
                      </div>
                      <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white rounded-full flex items-center justify-center text-xl sm:text-2xl border-2 border-[#1A1A1A]">☕</div>
                    </div>

                    <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border-2 border-[#1A1A1A] text-[#1A1A1A] relative z-10">
                      <div className="flex justify-between text-xs sm:text-sm mb-2 sm:mb-3 font-black uppercase">
                        <span>{t.phone.rewards}</span>
                        <span className="bg-[#F5F2EC] px-2 py-0.5 rounded-sm border border-[#2E5F40]">{isRtl ? `${toArabicNumerals(stamps)}/${toArabicNumerals(10)}` : `${stamps}/10`}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={`aspect-square rounded-full flex items-center justify-center border-2 transition-all duration-300
                              ${i < stamps
                                ? 'bg-[#A07C33] border-[#1A1A1A]'
                                : 'bg-gray-100 border-gray-300'}`}
                          >
                            {i < stamps && <Check className="w-3 sm:w-4 h-3 sm:h-4 text-white" strokeWidth={3} />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-3 sm:p-4 rounded-lg flex justify-center border-2 border-[#1A1A1A] relative z-10">
                      <div className="w-24 sm:w-32 h-24 sm:h-32 bg-[#F5F2EC] flex items-center justify-center p-2 relative rounded-lg border-2 border-dashed border-[#1A1A1A]">
                        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-[#1A1A1A] rounded-sm"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl sm:text-4xl bg-white rounded-sm p-1 border-2 border-[#1A1A1A] transform rotate-2">📱</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            <div className="absolute -right-4 sm:-right-16 top-24 sm:top-32 bg-white text-[#1A1A1A] font-black px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#A07C33] z-30 rounded-none text-sm sm:text-lg">
              {t.hero.badge1}
            </div>
            <div className="absolute -left-4 sm:-left-20 bottom-32 sm:bottom-40 bg-white text-[#2E5F40] font-black px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] z-30 rounded-none text-sm sm:text-lg">
              {t.hero.badge2}
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-8 px-4 sm:px-6 bg-white border-y-2 border-[#1A1A1A] relative z-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E5F40] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#2E5F40] border-2 border-[#1A1A1A]"></span>
            </span>
            <span className="text-sm font-black uppercase tracking-widest text-[#2E5F40]">{t.socialProof.live}</span>
          </div>
          <div className="flex items-center gap-3 text-[#1A1A1A]">
            <span className={`text-2xl sm:text-3xl font-black text-[#2E5F40] ${titleFont}`}>
              <SocialProofCounter target={347} isArabic={isRtl} />+
            </span>
            <span className="text-base sm:text-lg font-bold">{t.socialProof.text}</span>
          </div>
          <span className="bg-[#F5F2EC] px-4 py-1 border-2 border-[#1A1A1A] text-sm font-bold text-[#1A1A1A]">{t.socialProof.cities}</span>
        </div>
      </section>

      <section className="bg-[#2E5F40] py-6 sm:py-8 border-b-2 border-[#1A1A1A] overflow-hidden whitespace-nowrap flex relative z-20 w-full">
        <div className="animate-marquee flex gap-6 sm:gap-8 text-[#A07C33] text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-widest items-center">
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={i}>
              {t.marquee.map((item, j) => (
                <div key={`${i}-${j}`} className="flex items-center gap-6 sm:gap-8">
                  <span className="bg-white px-3 sm:px-4 py-1 border-2 border-[#1A1A1A] text-[#1A1A1A] rounded-none">{item}</span>
                  <HandDrawnStar className="w-6 sm:w-8 h-6 sm:h-8 text-[#A07C33]" />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="py-20 sm:py-32 bg-[#F5F2EC] px-4 sm:px-6 relative mt-8 sm:mt-12">
        <DoodleScribble className="absolute top-10 left-10 w-32 h-32 text-[#1A1A1A] opacity-5 hidden lg:block" />

        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {t.stats.map((stat, i) => {
            const bgColors = ['bg-white', 'bg-white', 'bg-[#1A1A1A]', 'bg-[#2E5F40]'];
            const textColors = ['text-[#2E5F40]', 'text-[#A07C33]', 'text-white', 'text-white'];
            const numberColors = ['text-[#1A1A1A]', 'text-[#1A1A1A]', 'text-[#A07C33]', 'text-[#F5F2EC]'];

            return (
              <div key={i} className="relative">
                {i < 3 && <HandDrawnArrow className={`hidden lg:block absolute -right-8 top-1/2 w-16 h-16 text-[#1A1A1A] z-10 opacity-20 ${isRtl ? 'transform scale-x-[-1]' : ''}`} />}

                <FadeIn delay={i * 100}>
                  <div className={`${bgColors[i]} border-2 border-[#1A1A1A] p-4 sm:p-8 rounded-none shadow-[4px_4px_0px_#1A1A1A] hover:-translate-y-1 transition-all duration-300 text-center relative overflow-hidden group`}>
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className={`text-4xl sm:text-6xl md:text-7xl font-black ${titleFont} ${numberColors[i]} mb-2 sm:mb-4 relative z-10`}>
                      <CountUp end={stat.value} prefix={stat.prefix} suffix={stat.suffix} isArabic={isRtl} />
                    </div>
                    <div className={`text-xs sm:text-lg md:text-xl font-bold ${textColors[i]} uppercase tracking-widest relative z-10 bg-black/5 py-1 sm:py-2 rounded-sm inline-block px-2 sm:px-4`}>
                      {stat.label}
                    </div>
                  </div>
                </FadeIn>
              </div>
            );
          })}
        </div>
      </section>

      <section ref={howItWorksRef} id="how-it-works" className="py-24 sm:py-40 bg-[#2E5F40] text-[#F5F2EC] px-4 sm:px-6 border-y-2 border-[#1A1A1A] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#A07C33] rounded-full mix-blend-multiply opacity-30 transform translate-x-1/2 -translate-y-1/2" aria-hidden="true"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1A1A1A] rounded-full mix-blend-multiply opacity-10 transform -translate-x-1/2 translate-y-1/2" aria-hidden="true"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeIn>
            <div className="text-center mb-12 sm:mb-20 relative inline-block mx-auto w-full">
              <h2 className={`text-3xl sm:text-5xl md:text-7xl font-black ${titleFont} uppercase tracking-tighter inline-block relative bg-[#1A1A1A] text-white px-4 sm:px-8 py-2 sm:py-4 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#A07C33]`}>
                {t.howItWorks.title}
                <HandDrawnStar className="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 w-8 sm:w-12 h-8 sm:h-12 text-[#F5F2EC]" />
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {t.howItWorks.steps.map((step, i) => {
              const styles = [
                "bg-white text-[#1A1A1A] md:col-span-2 lg:col-span-2 shadow-[4px_4px_0px_#1A1A1A]",
                "bg-[#1A1A1A] text-white shadow-[4px_4px_0px_#A07C33]",
                "bg-[#F5F2EC] text-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]",
                "bg-white text-[#2E5F40] md:col-span-2 lg:col-span-1 shadow-[4px_4px_0px_#1A1A1A]",
                "bg-[#A07C33] text-[#1A1A1A] md:col-span-2 lg:col-span-1 shadow-[4px_4px_0px_#1A1A1A]"
              ];

              return (
                <FadeIn key={i} delay={i * 100} className="h-full">
                  <div className={`p-6 sm:p-8 rounded-none border-2 border-[#1A1A1A] h-full flex flex-col justify-center relative hover:scale-[1.02] transition-transform duration-300 ${styles[i]}`}>
                    <div className="absolute top-4 right-4 w-10 sm:w-12 h-10 sm:h-12 rounded-sm border-2 border-current flex items-center justify-center font-black text-lg sm:text-xl opacity-50 bg-transparent text-current">
                      {i + 1}
                    </div>
                    <h3 className={`text-xl sm:text-3xl font-black mb-2 sm:mb-4 ${titleFont} pr-12`}>{step.title}</h3>
                    <p className="text-sm sm:text-lg font-bold opacity-80">{step.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-40 bg-white px-4 sm:px-6 border-b-2 border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12 sm:mb-20">
              <h2 className={`text-3xl sm:text-5xl md:text-7xl font-black ${titleFont} uppercase tracking-tighter text-[#1A1A1A]`}>
                {t.businesses.title}
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {t.businesses.items.map((item, i) => (
              <FadeIn key={i} delay={i * 50}>
                <div className="group bg-[#F5F2EC] p-4 sm:p-6 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] hover:-translate-y-1 transition-all duration-300 relative rounded-none flex flex-col items-center">
                  <div className="text-4xl sm:text-6xl mb-2 sm:mb-4 bg-white w-16 sm:w-24 h-16 sm:h-24 rounded-sm flex items-center justify-center border-2 border-[#1A1A1A] shadow-sm">
                    {item.emoji}
                  </div>
                  <h3 className="text-sm sm:text-xl font-black uppercase text-[#1A1A1A]">{item.title}</h3>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-40 bg-[#F5F2EC] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="mb-12 sm:mb-20">
              <h2 className={`text-3xl sm:text-5xl md:text-7xl font-black ${titleFont} uppercase tracking-tighter text-[#1A1A1A]`}>
                {t.features.title}
                <span className="text-[#2E5F40] inline-block ml-2 sm:ml-4">.</span>
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-[200px] sm:auto-rows-[250px]">
            {t.features.items.map((item, i) => {
              const isLarge = i === 0 || i === 3;
              const isTall = i === 1;
              const bgClass = i % 3 === 0 ? 'bg-white' : i % 3 === 1 ? 'bg-white' : 'bg-white';

              return (
                <FadeIn
                  key={i}
                  delay={i * 100}
                  className={`h-full ${isLarge ? 'md:col-span-2' : ''} ${isTall ? 'row-span-2' : ''}`}
                >
                  <div className={`${bgClass} p-5 sm:p-8 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] h-full flex flex-col hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group rounded-none`}>
                    <div className="w-12 sm:w-16 h-12 sm:h-16 bg-[#F5F2EC] border-2 border-[#1A1A1A] rounded-sm flex items-center justify-center text-2xl sm:text-3xl mb-4 sm:mb-6 z-10">
                      {item.emoji}
                    </div>

                    <div className="relative z-10 mt-auto">
                      <h3 className="text-lg sm:text-2xl font-black mb-1 sm:mb-2 uppercase text-[#1A1A1A]">{item.title}</h3>
                      <p className="text-sm sm:text-lg font-bold text-[#3D4A3F]/80">{item.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-40 bg-[#1A1A1A] px-4 sm:px-6 border-y-2 border-[#2E5F40] relative overflow-hidden">
        <DoodleScribble className="absolute top-0 right-0 w-full h-full text-[#2E5F40] opacity-5 pointer-events-none" />
        <HandDrawnStar className="absolute top-20 left-20 w-24 h-24 text-[#A07C33] animate-float hidden lg:block" />

        <div className="max-w-2xl mx-auto relative z-10">
          <FadeIn>
            <div className="bg-[#F5F2EC] border-2 border-[#1A1A1A] p-6 sm:p-10 md:p-16 shadow-[8px_8px_0px_#A07C33] relative rounded-none">
              <div className="absolute -top-6 sm:-top-8 -right-4 sm:-right-8 bg-[#A07C33] text-[#1A1A1A] font-black px-4 sm:px-6 py-2 sm:py-4 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] z-20 text-base sm:text-xl rounded-none">
                {t.phone.bestDeal}
              </div>

              <div className="text-center mb-6 sm:mb-10 border-b-2 border-dashed border-[#1A1A1A] pb-6 sm:pb-10">
                <h2 className={`text-2xl sm:text-4xl font-black ${titleFont} mb-4 sm:mb-6 uppercase text-[#1A1A1A]`}>
                  {t.pricing.title}
                </h2>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-end justify-center gap-2">
                    <div className="bg-[#2E5F40] text-white px-4 sm:px-6 py-2 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] text-4xl sm:text-6xl font-black rounded-none">
                      {t.pricing.price}
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-2">{t.pricing.period}</span>
                  </div>
                  <span className="text-sm font-bold text-[#3D4A3F]/70 mt-2">{t.pricing.priceNote}</span>
                </div>
              </div>

              <ul className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
                {t.pricing.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 sm:gap-4 text-base sm:text-xl font-bold text-[#1A1A1A]">
                    <div className="flex-shrink-0 w-6 sm:w-8 h-6 sm:h-8 bg-white border-2 border-[#1A1A1A] rounded-sm flex items-center justify-center">
                      <Check className="w-4 sm:w-5 h-4 sm:h-5 text-[#2E5F40]" strokeWidth={3} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={scrollWaitlist}
                className="w-full bg-[#A07C33] text-[#1A1A1A] py-4 sm:py-6 text-xl sm:text-2xl font-black hover:bg-[#8f6d2a] transition-all border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] uppercase rounded-none"
              >
                {t.pricing.cta}
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      <section ref={waitlistRef} id="waitlist" className="py-24 sm:py-40 bg-white px-4 sm:px-6 relative overflow-hidden text-center">
        <HandDrawnCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] text-[#2E5F40] opacity-5 pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <FadeIn>
            <h2 className={`text-3xl sm:text-6xl md:text-8xl font-black ${titleFont} mb-4 sm:mb-6 text-[#1A1A1A] uppercase tracking-tighter`}>
              {t.waitlist.title}
            </h2>
            <p className="text-base sm:text-xl text-[#3D4A3F] mb-3 font-bold bg-[#F5F2EC] inline-block px-4 sm:px-6 py-2 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-none">
              {t.waitlist.desc}
            </p>
            <p className="text-sm sm:text-base text-[#3D4A3F]/70 font-bold mb-8 sm:mb-12">
              {(t.waitlist as any).trustNote}
            </p>

            <div className="relative max-w-xl mx-auto">
              <HandDrawnArrow className="absolute -left-20 top-4 w-16 h-16 text-[#A07C33] hidden md:block transform -scale-x-100 rotate-45" />

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
                      className="flex-1 bg-[#F5F2EC] px-5 sm:px-8 py-4 sm:py-5 text-base sm:text-xl outline-none border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] focus:shadow-[2px_2px_0px_#1A1A1A] focus:translate-y-0.5 focus:translate-x-0.5 transition-all font-bold placeholder:text-gray-400 rounded-none"
                    />
                    <button
                      type="submit"
                      className="bg-[#2E5F40] text-white px-6 sm:px-10 py-4 sm:py-5 text-base sm:text-xl font-black border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] hover:bg-[#1f422c] transition-all uppercase whitespace-nowrap rounded-none"
                    >
                      {t.waitlist.button}
                    </button>
                  </form>
                  {formError && (
                    <p className="text-red-600 text-sm font-bold">{t.waitlist.err}</p>
                  )}
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-0.5 bg-[#1A1A1A]/10 flex-1"></div>
                    <span className="text-[#1A1A1A]/40 font-black uppercase text-sm">{lang === 'ar' ? 'أو' : 'or'}</span>
                    <div className="h-0.5 bg-[#1A1A1A]/10 flex-1"></div>
                  </div>
                  <a
                    href="https://wa.me/966500000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 bg-white text-[#1A1A1A] px-6 sm:px-10 py-4 sm:py-5 text-base sm:text-xl font-black border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] hover:bg-gray-50 transition-all w-full sm:w-auto rounded-none"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 sm:w-6 h-5 sm:h-6 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    {t.waitlist.whatsappCta}
                  </a>
                </div>
              ) : (
                <div className="bg-white text-[#2E5F40] p-6 sm:p-8 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-black text-xl sm:text-2xl flex items-center justify-center gap-4 rounded-none">
                  <span className="text-3xl sm:text-4xl">🎉</span>
                  {t.waitlist.success}
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="bg-[#1A1A1A] text-[#F5F2EC] py-10 sm:py-16 px-4 sm:px-6 border-t-4 border-[#2E5F40]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className={`text-3xl sm:text-4xl font-black ${titleFont} tracking-tighter flex items-center gap-2`}>
            {t.nav.logo}
            <div className="w-3 sm:w-4 h-3 sm:h-4 bg-[#A07C33] rounded-none"></div>
          </div>
          <div className="text-white/60 font-bold font-mono text-sm sm:text-base">
            &copy; {new Date().getFullYear()} Niqaty. {lang === 'ar' ? 'صُنع في السعودية 🇸🇦' : 'Made in Saudi Arabia 🇸🇦'}
          </div>
        </div>
      </footer>
    </div>
  );
}
