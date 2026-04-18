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
      { title: 'يجمع النقاط', desc: 'في كل زيارة، يمسح العميل كود خاص لإضافة نقطة.' }
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
      { title: 'Collects Points', desc: 'Customer scans a unique code to add points.' }
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

export default function AffordanceChapters() {
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

      {/* CHAPTER 1: HERO */}
      <section className="min-h-screen flex flex-col justify-center relative overflow-hidden bg-[#FCF0DC] pt-20 border-b-[3px] border-[#2B1708]">
        <div className="w-full h-full flex flex-col lg:flex-row relative z-10 max-w-[100vw]">
          
          {/* Text Content - Left Half */}
          <div className={`w-full lg:w-1/2 flex flex-col justify-center px-6 ${isRtl ? 'lg:pr-12 xl:pr-20' : 'lg:pl-12 xl:pl-20'} py-12 lg:py-0 z-20`}>
            <FadeIn>
              <div className="inline-block bg-[#FFF6E8] text-[#C05C30] px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-widest mb-6 border-[3px] border-[#C05C30] shadow-[4px_4px_0px_#2B1708] transform -rotate-2">
                {t.phone.badge}
              </div>
              <h1 className={`text-5xl sm:text-7xl lg:text-8xl font-black ${titleFont} leading-[1.1] uppercase relative text-[#2B1708] mb-8`}>
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

            <FadeIn delay={200}>
              <div className="relative inline-block mb-10">
                <p className="text-lg sm:text-2xl text-[#4A2E18] max-w-xl font-medium relative z-10 bg-[#FFF6E8] p-5 border-[3px] border-[#2B1708] shadow-[8px_8px_0px_#2B1708]">
                  {t.hero.subHeadline}
                </p>
                <div className="absolute -bottom-4 -right-4 text-4xl transform rotate-12 hidden sm:block">✨</div>
              </div>
            </FadeIn>

            <FadeIn delay={400} className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <button
                onClick={scrollWaitlist}
                className="bg-[#C05C30] text-white px-8 py-5 text-xl font-bold transition-all border-b-[6px] border-r-[4px] border-t-[2px] border-l-[2px] border-[#2B1708] active:translate-y-1 active:translate-x-1 active:border-b-[2px] active:border-r-[2px] flex items-center justify-center gap-3"
              >
                {t.hero.primaryCta}
                <ArrowIcon className="w-6 h-6" />
              </button>
              <button
                onClick={scrollHowItWorks}
                className="bg-transparent text-[#C05C30] border-[3px] border-[#C05C30] px-8 py-5 text-xl font-bold hover:bg-[#C05C30]/10 transition-all flex items-center justify-center"
              >
                {t.hero.secondaryCta}
              </button>
            </FadeIn>
          </div>

          {/* Phone Mockup - Right Half (or Left Half in AR) */}
          <div className={`w-full lg:w-1/2 lg:absolute lg:top-0 lg:h-full flex justify-center items-center py-12 lg:py-0 bg-[#D4963B]/20 ${isRtl ? 'lg:left-0 border-r-[3px]' : 'lg:right-0 border-l-[3px]'} border-[#2B1708]`}>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2B1708_2px,transparent_2px)] [background-size:24px_24px]"></div>
            
            <FadeIn delay={300} className="relative z-10 w-[260px] sm:w-[320px] h-[520px] sm:h-[640px] bg-[#FFF6E8] rounded-[3rem] p-3 shadow-2xl border-[3px] border-[#2B1708] transform hover:-translate-y-2 transition-transform duration-500">
              <div className="w-full h-full bg-[#FCF0DC] rounded-[2.5rem] overflow-hidden relative border-[3px] border-[#2B1708]/10">
                <div className="absolute top-0 inset-x-0 h-7 bg-[#2B1708] rounded-b-3xl w-40 mx-auto z-20"></div>

                <div className="h-full p-4 pt-12 relative">
                  <div className="text-center mb-6 relative">
                    <h3 className="font-bold text-base text-[#2B1708]">{t.phone.walletTitle}</h3>
                    <HandDrawnStar className="absolute top-0 right-10 w-6 h-6 text-[#D4963B]" />
                  </div>

                  <div className="bg-[#C05C30] rounded-3xl p-6 text-[#FCF0DC] shadow-[0_8px_0_#A04A26] border-[3px] border-[#2B1708] relative overflow-hidden transform -rotate-1">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D4963B] rounded-full opacity-50 mix-blend-multiply"></div>
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div>
                        <div className="font-bold opacity-90 text-sm uppercase tracking-wider bg-[#FFF6E8]/20 inline-block px-2 py-1 rounded">Niqaty</div>
                        <div className="font-black text-2xl mt-2 leading-none" style={{whiteSpace: 'pre-line'}}>{t.phone.shopName}</div>
                      </div>
                      <div className="w-12 h-12 bg-[#FFF6E8] rounded-full flex items-center justify-center text-2xl shadow-inner border-[3px] border-[#2B1708]">☕</div>
                    </div>

                    <div className="bg-[#FFF6E8] rounded-2xl p-4 mb-6 border-[3px] border-[#2B1708] shadow-[4px_4px_0px_#2B1708] text-[#2B1708] relative z-10">
                      <div className="flex justify-between text-sm mb-3 font-black uppercase">
                        <span>{t.phone.rewards}</span>
                        <span className="bg-[#FFF6E8] px-2 py-0.5 rounded border border-[#C05C30]">{isRtl ? `${toArabicNumerals(stamps)}/${toArabicNumerals(10)}` : `${stamps}/10`}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={`aspect-square rounded-full flex items-center justify-center border-[3px] transition-all duration-300
                              ${i < stamps
                                ? 'bg-[#D4963B] border-[#2B1708] scale-100 shadow-[2px_2px_0px_#2B1708]'
                                : 'bg-gray-100 border-gray-300 scale-90'}`}
                          >
                            {i < stamps && <Check className="w-4 h-4 text-[#FCF0DC]" strokeWidth={4} />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#FFF6E8] p-4 rounded-2xl flex justify-center border-[3px] border-[#2B1708] relative z-10 transform rotate-1">
                      <div className="w-32 h-32 bg-[#FCF0DC] flex items-center justify-center p-2 relative rounded-xl border-[3px] border-dashed border-[#2B1708]">
                        <div className="w-20 h-20 bg-[#2B1708] rounded-lg"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl bg-[#FFF6E8] rounded-md p-1 border-[3px] border-[#2B1708] transform rotate-12">📱</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            <div className="absolute -right-4 sm:-right-16 top-32 bg-[#FFF6E8] text-[#2B1708] font-black px-4 py-3 border-[3px] border-[#2B1708] shadow-[6px_6px_0px_#2B1708] animate-float z-30 transform rotate-6 rounded-lg text-lg">
              {t.hero.badge1}
            </div>
            <div className="absolute -left-4 sm:-left-20 bottom-40 bg-[#FFF6E8] text-[#C05C30] font-black px-4 py-3 border-[3px] border-[#2B1708] shadow-[-6px_6px_0px_#2B1708] animate-float-delayed z-30 transform -rotate-6 rounded-lg text-lg">
              {t.hero.badge2}
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 2: STATS */}
      <section className="min-h-screen flex flex-col justify-center bg-[#2B1708] border-b-[3px] border-[#2B1708] relative">
        <div className="absolute inset-0 grid grid-cols-1 sm:grid-cols-2 grid-rows-4 sm:grid-rows-2 gap-[3px] bg-[#FCF0DC]/20">
          {t.stats.map((stat, i) => {
            const bgColors = ['bg-[#2B1708]', 'bg-[#2B1708]', 'bg-[#2B1708]', 'bg-[#2B1708]'];
            const textColors = ['text-[#C05C30]', 'text-[#D4963B]', 'text-[#FCF0DC]', 'text-[#FCF0DC]'];
            const numberColors = ['text-[#FFF6E8]', 'text-[#D4963B]', 'text-[#FFF6E8]', 'text-[#C05C30]'];

            return (
              <div key={i} className={`${bgColors[i]} flex flex-col items-center justify-center p-8 group relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[#FFF6E8]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <FadeIn delay={i * 100} className="relative z-10 flex flex-col items-center text-center transform group-hover:scale-110 transition-transform duration-500">
                  <div className={`text-7xl sm:text-8xl md:text-9xl font-black ${titleFont} ${numberColors[i]} mb-4`}>
                    <CountUp end={stat.value} prefix={stat.prefix} suffix={stat.suffix} isArabic={isRtl} />
                  </div>
                  <div className={`text-xl sm:text-3xl font-bold ${textColors[i]} uppercase tracking-widest`}>
                    {stat.label}
                  </div>
                </FadeIn>
              </div>
            );
          })}
        </div>
      </section>

      {/* CHAPTER 3: HOW IT WORKS */}
      <section ref={howItWorksRef} id="how-it-works" className="min-h-screen flex flex-col items-center bg-[#FCF0DC] border-b-[3px] border-[#2B1708] relative overflow-hidden py-20 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMyQjE3MDgiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-30"></div>
        
        <FadeIn className="w-full text-center relative z-10 mb-16">
          <h2 className={`text-4xl sm:text-6xl md:text-8xl font-black ${titleFont} uppercase tracking-tighter inline-block relative bg-[#FFF6E8] text-[#2B1708] px-8 py-4 border-[3px] border-[#2B1708] shadow-[12px_12px_0px_#2B1708] transform -rotate-1`}>
            {t.howItWorks.title}
          </h2>
        </FadeIn>

        <div className="w-full max-w-7xl mx-auto flex-1 relative z-10 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full items-center">
            {t.howItWorks.steps.slice(0, 3).map((step, i) => {
              const styles = [
                "bg-[#C05C30] text-[#FCF0DC] rotate-2 lg:-translate-y-20",
                "bg-[#2B1708] text-[#FCF0DC] -rotate-1 lg:translate-y-10",
                "bg-[#D4963B] text-[#2B1708] rotate-1 lg:-translate-y-10"
              ];

              return (
                <FadeIn key={i} delay={i * 200} className="h-full flex justify-center">
                  <div className={`p-8 sm:p-12 w-full max-w-sm rounded-[2rem] border-[3px] border-[#2B1708] shadow-[12px_12px_0px_#2B1708] flex flex-col justify-center relative hover:scale-105 transition-transform duration-300 ${styles[i]} cursor-default`}>
                    <div className="text-6xl sm:text-8xl font-black text-[#FFF6E8] mb-4 opacity-50">{isRtl ? toArabicNumerals(i + 1) : i + 1}</div>
                    <h3 className={`text-3xl sm:text-4xl font-black mb-6 uppercase leading-tight`}>{step.title}</h3>
                    <p className="text-lg sm:text-xl font-bold opacity-90 border-t-[3px] border-current pt-6 border-dashed">{step.desc}</p>
                    
                    {i < 2 && (
                      <div className={`hidden lg:block absolute top-1/2 ${isRtl ? '-left-16' : '-right-16'} transform -translate-y-1/2 z-20`}>
                        <HandDrawnArrow className={`w-12 h-12 text-[#2B1708] ${i === 1 ? 'rotate-180' : ''} ${isRtl ? 'scale-x-[-1]' : ''}`} />
                      </div>
                    )}
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* CHAPTER 4: PRICING */}
      <section className="min-h-screen flex flex-col justify-center items-center bg-[#FFF6E8] px-4 sm:px-6 border-b-[3px] border-[#2B1708] relative py-20">
        <DoodleScribble className="absolute top-20 right-20 w-32 h-32 text-[#C05C30] opacity-20 transform rotate-45 hidden lg:block" />
        <HandDrawnStar className="absolute bottom-20 left-20 w-24 h-24 text-[#D4963B] animate-float hidden lg:block" />

        <div className="max-w-3xl mx-auto w-full relative z-10">
          <FadeIn>
            <div className="bg-[#FCF0DC] border-[4px] border-[#2B1708] p-10 sm:p-16 md:p-24 shadow-[24px_24px_0px_#2B1708] relative transform -rotate-1 cursor-default w-full">
              <div className="absolute -top-6 right-1/2 transform translate-x-1/2 sm:translate-x-0 sm:-right-10 bg-[#C05C30] text-[#FCF0DC] font-black px-8 py-4 border-[3px] border-[#2B1708] rotate-2 shadow-[8px_8px_0px_#2B1708] z-20 text-xl sm:text-2xl uppercase tracking-wider">
                {t.phone.bestDeal}
              </div>

              <div className="text-center mb-12 border-b-[4px] border-dashed border-[#2B1708] pb-12 pt-6">
                <h2 className={`text-4xl sm:text-6xl font-black ${titleFont} mb-8 uppercase text-[#2B1708]`}>
                  {t.pricing.title}
                </h2>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-end justify-center gap-3">
                    <div className="bg-[#D4963B] text-[#2B1708] px-8 py-3 transform rotate-2 border-[3px] border-[#2B1708] shadow-[8px_8px_0px_#2B1708] text-6xl sm:text-8xl font-black">
                      {t.pricing.price}
                    </div>
                    <span className="text-2xl sm:text-4xl font-bold text-[#2B1708] mb-4">{t.pricing.period}</span>
                  </div>
                  <span className="text-lg font-bold text-[#2B1708]/60 mt-2">{t.pricing.priceNote}</span>
                </div>
              </div>

              <ul className="space-y-6 sm:space-y-8 mb-16">
                {t.pricing.features.map((feature, i) => (
                  <li key={i} className="flex items-center justify-center sm:justify-start gap-4 text-xl sm:text-3xl font-bold text-[#2B1708]">
                    <div className="flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 bg-[#FFF6E8] border-[3px] border-[#2B1708] rounded-full flex items-center justify-center transform -rotate-6 shadow-[4px_4px_0px_#2B1708]">
                      <Check className="w-6 sm:w-8 h-6 sm:h-8 text-[#C05C30]" strokeWidth={4} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={scrollWaitlist}
                className="w-full bg-[#2B1708] text-[#FCF0DC] px-8 py-6 text-2xl sm:text-3xl font-black transition-all border-[3px] border-[#2B1708] hover:bg-[#4A2E18] active:translate-y-2 active:translate-x-2 shadow-[8px_8px_0px_#C05C30] active:shadow-[0px_0px_0px_#C05C30] uppercase flex items-center justify-center"
              >
                {t.pricing.cta}
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CHAPTER 5: WAITLIST & FOOTER */}
      <section ref={waitlistRef} id="waitlist" className="min-h-screen flex flex-col bg-[#C05C30] px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#2B1708] opacity-5 mix-blend-multiply pattern-dots"></div>
        
        <div className="flex-1 flex flex-col justify-center items-center max-w-4xl mx-auto w-full relative z-10 py-20">
          <FadeIn className="w-full text-center">
            <h2 className={`text-5xl sm:text-7xl md:text-9xl font-black ${titleFont} mb-8 text-[#FCF0DC] uppercase tracking-tighter`}>
              {t.waitlist.title}
            </h2>
            <p className="text-xl sm:text-3xl text-[#2B1708] mb-6 font-bold bg-[#FFF6E8] inline-block px-8 py-4 border-[3px] border-[#2B1708] transform rotate-1 shadow-[8px_8px_0px_#2B1708]">
              {t.waitlist.desc}
            </p>
            <p className="text-lg sm:text-2xl text-[#FCF0DC]/90 font-bold mb-16 max-w-2xl mx-auto leading-relaxed">
              {(t.waitlist as any).trustNote}
            </p>

            <div className="w-full max-w-2xl mx-auto">
              {!formSuccess ? (
                <div className="space-y-6">
                  <form
                    onSubmit={submit}
                    className="flex flex-col gap-6"
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={e => { setInput(e.target.value); setFormError(false); }}
                      placeholder={t.waitlist.placeholder}
                      dir={isRtl ? 'rtl' : 'ltr'}
                      className="w-full bg-[#FFF6E8] px-8 h-[80px] text-2xl outline-none border-[4px] border-[#2B1708] shadow-[8px_8px_0px_#2B1708] focus:translate-y-1 focus:translate-x-1 focus:shadow-[4px_4px_0px_#2B1708] transition-all font-bold placeholder:text-[#4A2E18]/40 text-[#2B1708] text-center"
                    />
                    <button
                      type="submit"
                      className="w-full bg-[#2B1708] text-[#FCF0DC] px-10 h-[80px] text-2xl sm:text-3xl font-black border-[4px] border-[#2B1708] shadow-[8px_8px_0px_#D4963B] hover:translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_#D4963B] transition-all flex items-center justify-center gap-4 uppercase"
                    >
                      {isRtl && <ArrowLeft className="w-8 h-8" />}
                      {t.waitlist.button}
                      {!isRtl && <ArrowRight className="w-8 h-8" />}
                    </button>
                  </form>
                  {formError && (
                    <p className="text-[#FFF6E8] bg-red-600 inline-block px-4 py-2 font-bold text-lg border-2 border-[#2B1708]">{t.waitlist.err}</p>
                  )}
                  <div className="flex items-center justify-center gap-6 py-4">
                    <div className="h-[4px] bg-[#2B1708]/20 flex-1"></div>
                    <span className="text-[#2B1708] font-black uppercase text-xl">{lang === 'ar' ? 'أو' : 'or'}</span>
                    <div className="h-[4px] bg-[#2B1708]/20 flex-1"></div>
                  </div>
                  <a
                    href="https://wa.me/966500000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-4 bg-[#25D366] text-white w-full h-[80px] text-2xl font-black border-[4px] border-[#2B1708] shadow-[8px_8px_0px_#2B1708] hover:translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_#2B1708] transition-all"
                  >
                    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    {t.waitlist.whatsappCta}
                  </a>
                </div>
              ) : (
                <div className="bg-[#FFF6E8] text-[#C05C30] p-10 border-[4px] border-[#2B1708] shadow-[12px_12px_0px_#2B1708] font-black text-3xl flex flex-col items-center justify-center gap-6 transform -rotate-1">
                  <span className="text-6xl">🎉</span>
                  {t.waitlist.success}
                </div>
              )}
            </div>
          </FadeIn>
        </div>

        {/* Bottom band footer */}
        <div className="w-full bg-[#2B1708] text-[#FCF0DC] py-6 px-6 border-t-[3px] border-[#2B1708] mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className={`text-2xl font-black ${titleFont} tracking-tighter flex items-center gap-2`}>
              {t.nav.logo}
              <div className="w-3 h-3 bg-[#C05C30] rounded-full"></div>
            </div>
            <div className="text-[#FCF0DC]/60 font-bold font-mono text-sm">
              &copy; {new Date().getFullYear()} Niqaty. {lang === 'ar' ? 'صُنع في السعودية 🇸🇦' : 'Made in Saudi Arabia 🇸🇦'}
            </div>
          </div>
        </div>
      </section>

      <div style={{ position: 'fixed', bottom: '16px', left: '16px', background: '#2B1708', color: '#FCF0DC', padding: '8px 12px', fontSize: '11px', borderRadius: '4px', zIndex: 999, opacity: 0.85 }}>
        Layout: Full-Screen Chapters — Sections are 100vh cinematic stops
      </div>
    </div>
  );
}
