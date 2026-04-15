import React, { useState, useEffect, useRef } from 'react';
import './_group.css';

import { 
  Globe, 
  Check,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

// === DOODLE COMPONENTS ===
const HandDrawnStar = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M50 10 Q55 35 85 40 Q55 50 65 85 Q45 65 15 85 Q30 55 10 45 Q40 35 50 10 Z" />
  </svg>
);

const HandDrawnArrow = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 50 Q40 10 90 40 M70 20 Q85 35 90 40 Q75 55 60 60" />
  </svg>
);

const HandDrawnCircle = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M50 10 C75 8, 95 25, 90 50 C85 75, 60 95, 30 85 C10 75, 5 45, 20 25 C30 15, 45 12, 55 15" />
  </svg>
);

const WavyUnderline = ({ className = "" }) => (
  <svg viewBox="0 0 100 20" className={className} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" preserveAspectRatio="none">
    <path d="M5 10 Q15 0 25 10 T45 10 T65 10 T85 10 T95 10" />
  </svg>
);

const DoodleScribble = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 50 Q20 20 40 60 T60 30 T90 70" />
  </svg>
);

const AR = {
  nav: {
    logo: 'نقاطي',
    login: 'تسجيل الدخول',
    cta: 'ابدأ مجاناً'
  },
  hero: {
    badge1: 'تم إضافة نقطة ✅',
    badge2: 'تم فتح المكافأة 🎉',
    headline: 'عميلك يزورك مرة — ويختفي.',
    subHeadline: 'نقاطي يرجّعه. برنامج ولاء بالـ QR ينضاف لمحفظة جوال عميلك بثانية. بدون تطبيق، بدون جهاز. صُمم للمحلات الصغيرة في السعودية.',
    primaryCta: 'ابدأ مجاناً',
    secondaryCta: 'كيف يعمل؟'
  },
  socialProof: {
    count: '٣٤٧+',
    text: 'صاحب محل في قائمة الانتظار',
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
    cta: 'ابدأ تجربتك المجانية'
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
    title: 'خلّ عميلك يرجع لك — ابدأ اليوم',
    desc: 'انضم لـ ٣٤٧+ صاحب محل بدأوا يبنون ولاء عملائهم مع نقاطي.',
    placeholder: 'رقم الواتساب أو البريد الإلكتروني',
    button: 'سجّل الآن',
    whatsappCta: 'تواصل عبر واتساب',
    success: 'تم التسجيل بنجاح! بنتواصل معك عبر الواتساب قريباً 🎉'
  }
};

const EN = {
  nav: {
    logo: 'Niqaty',
    login: 'Log In',
    cta: 'Start Free'
  },
  hero: {
    badge1: 'Point Added ✅',
    badge2: 'Reward Unlocked 🎉',
    headline: 'Your customers visit once — and vanish.',
    subHeadline: 'Niqaty brings them back. A QR-based loyalty card in their Apple or Google Wallet. No app. No hardware. Built for small businesses in Saudi Arabia.',
    primaryCta: 'Start Free',
    secondaryCta: 'How it works'
  },
  socialProof: {
    count: '347+',
    text: 'shop owners on the waitlist',
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
    cta: 'Start Your Free Trial'
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
    title: 'Make your customers come back — start today',
    desc: 'Join 347+ shop owners already building customer loyalty with Niqaty.',
    placeholder: 'WhatsApp number or email',
    button: 'Join Now',
    whatsappCta: 'Chat on WhatsApp',
    success: 'Successfully joined! We\'ll reach out via WhatsApp soon 🎉'
  }
};

const CountUp = ({ end, duration = 2000, prefix = '', suffix = '', startVisible = false }: { end: number, duration?: number, prefix?: string, suffix?: string, startVisible?: boolean }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(startVisible);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [end, duration, isVisible]);

  return <span ref={countRef}>{prefix}{count}{suffix}</span>;
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

    if (ref.current) {
      observer.observe(ref.current);
    }

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

const toArabicNumerals = (n: number) => n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);

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

export default function BoldEditorial() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [stamps, setStamps] = useState<number>(0);
  const [formSuccess, setFormSuccess] = useState(false);
  const t = lang === 'ar' ? AR : EN;
  const isRtl = lang === 'ar';
  
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  // Stamp animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setStamps((prev) => {
        if (prev >= 10) return 0;
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const titleFont = isRtl ? 'font-["Tajawal"]' : 'font-["DM_Sans"] tracking-tight';
  const bodyFont = isRtl ? 'font-["Cairo"]' : 'font-["DM_Sans"]';
  
  return (
    <div 
      className={`min-h-screen ${bodyFont} bg-[#FDFAF3] text-[#0D1F15] overflow-x-hidden transition-all duration-300`} 
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* 1. Fixed Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#FDFAF3]/90 backdrop-blur-md border-b-4 border-[#0D1F15]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className={`text-3xl font-black ${titleFont} tracking-tighter relative`}>
            <span className="relative z-10">{t.nav.logo}</span>
            <div className="absolute -bottom-1 left-0 w-full h-3 bg-[#C8922A] -z-10 transform -rotate-2"></div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-2 font-bold hover:text-[#0A6C3B] transition-colors uppercase tracking-widest text-sm bg-[#E8F5E9] px-3 py-1 rounded-full border-2 border-[#0D1F15] transform hover:-rotate-3"
            >
              <Globe className="w-4 h-4" />
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            <button className="hidden md:block font-bold hover:text-[#0A6C3B] transition-colors relative group">
              {t.nav.login}
              <WavyUnderline className="absolute -bottom-2 left-0 w-full h-3 text-[#C8922A] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button className={`bg-[#0A6C3B] text-white px-6 py-3 font-bold hover:bg-[#08552e] transition-all transform hover:-translate-y-1 hover:rotate-2 shadow-[4px_4px_0px_#0D1F15] border-2 border-[#0D1F15]`}>
              {t.nav.cta}
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section - Playful & Asymmetric */}
      <section className="pt-28 pb-16 px-6 min-h-[80vh] flex items-center relative overflow-hidden bg-[#FDFAF3]">
        {/* Floating Doodles & Stickers */}
        <HandDrawnStar className="absolute top-40 left-10 w-12 h-12 text-[#C8922A] animate-float" />
        <HandDrawnStar className="absolute bottom-20 right-20 w-16 h-16 text-[#0A6C3B] animate-float-delayed" />
        <DoodleScribble className="absolute top-20 right-1/4 w-24 h-24 text-[#0D1F15] opacity-20 transform rotate-45" />
        
        <div className="absolute top-1/4 right-10 text-6xl transform rotate-12 animate-float bg-white rounded-full p-4 shadow-[4px_4px_0px_#0D1F15] border-2 border-[#0D1F15]">☕</div>
        <div className="absolute bottom-1/4 left-10 text-5xl transform -rotate-12 animate-float-delayed bg-[#FFF8E1] rounded-full p-4 shadow-[4px_4px_0px_#0A6C3B] border-2 border-[#0D1F15]">🎯</div>

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-12 items-center relative z-10">
          
          <div className="lg:col-span-7 space-y-8 relative">
            <HandDrawnArrow className={`absolute -top-16 ${isRtl ? 'left-0 transform scale-x-[-1]' : 'right-0'} w-24 h-24 text-[#C8922A]`} />
            
            <FadeIn>
              <div className="inline-block bg-[#E8F5E9] text-[#0A6C3B] px-4 py-2 text-sm font-bold uppercase tracking-widest mb-4 border-2 border-[#0A6C3B] shadow-[4px_4px_0px_#0A6C3B] transform -rotate-2">
                {t.phone.badge}
              </div>
              <h1 className={`text-6xl md:text-7xl lg:text-8xl font-black ${titleFont} leading-[1.1] uppercase relative`}>
                {lang === 'en' ? (
                  <>
                    <span className="relative inline-block transform -rotate-2 mb-2">Your customers
                      <div className="absolute inset-0 bg-[#C8922A] -z-10 transform rotate-2 translate-y-2 translate-x-2"></div>
                    </span><br/>
                    vanish.<br/>
                    <span className="text-white relative inline-block transform rotate-1 mt-2 px-2">Niqaty brings them back.
                      <div className="absolute inset-0 bg-[#0A6C3B] -z-10 transform -rotate-1"></div>
                      <HandDrawnCircle className="absolute -inset-4 w-auto h-auto text-[#0D1F15] opacity-50 z-20 pointer-events-none" />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="relative inline-block transform rotate-2 mb-2">عميلك يختفي
                      <div className="absolute inset-0 bg-[#C8922A] -z-10 transform -rotate-2 translate-y-2 -translate-x-2"></div>
                    </span><br/>
                    نقاطي<br/>
                    <span className="text-white relative inline-block transform -rotate-1 mt-2 px-4">يرجّعه.
                      <div className="absolute inset-0 bg-[#0A6C3B] -z-10 transform rotate-1"></div>
                      <HandDrawnCircle className="absolute -inset-4 w-auto h-auto text-[#0D1F15] opacity-50 z-20 pointer-events-none" />
                    </span>
                  </>
                )}
              </h1>
            </FadeIn>
            
            <FadeIn delay={200}>
              <div className="relative inline-block">
                <p className="text-xl md:text-2xl text-[#0D1F15] max-w-xl font-medium relative z-10 bg-white p-6 border-4 border-[#0D1F15] shadow-[8px_8px_0px_#E8F5E9]">
                  {t.hero.subHeadline}
                </p>
                <div className="absolute -bottom-4 -right-4 text-4xl transform rotate-12">✨</div>
              </div>
            </FadeIn>

            <FadeIn delay={400} className="flex flex-col sm:flex-row gap-6 pt-8">
              <button className={`bg-[#0D1F15] text-[#FDFAF3] px-8 py-5 text-xl font-bold hover:bg-[#C8922A] transition-all transform hover:-translate-y-2 hover:rotate-2 shadow-[8px_8px_0px_#0A6C3B] border-2 border-[#0D1F15] flex items-center justify-center gap-3`}>
                {t.hero.primaryCta}
                <ArrowIcon className="w-6 h-6" />
              </button>
              <button className={`bg-[#FFF8E1] text-[#0D1F15] border-4 border-[#0D1F15] px-8 py-5 text-xl font-bold hover:bg-[#E8F5E9] transition-all transform hover:-translate-y-2 hover:-rotate-2 shadow-[8px_8px_0px_#0D1F15] relative`}>
                {t.hero.secondaryCta}
              </button>
            </FadeIn>
          </div>

          <div className="lg:col-span-5 relative h-[600px] flex justify-center items-center mt-12 lg:mt-0">
            {/* Colorful Accent Shapes Behind Phone */}
            <div className="absolute inset-0 bg-[#C8922A] rounded-[3rem] transform rotate-6 scale-95 border-4 border-[#0D1F15]"></div>
            <div className="absolute inset-0 bg-[#0A6C3B] rounded-[3rem] transform -rotate-3 scale-100 border-4 border-[#0D1F15]"></div>
            
            {/* Phone Mockup */}
            <FadeIn delay={300} className="relative z-10 w-[300px] h-[600px] bg-white rounded-[3rem] p-3 shadow-2xl border-4 border-[#0D1F15] transform hover:-translate-y-4 transition-transform duration-500">
              <div className="w-full h-full bg-[#FDFAF3] rounded-[2.5rem] overflow-hidden relative border-2 border-[#0D1F15]/10">
                <div className="absolute top-0 inset-x-0 h-7 bg-[#0D1F15] rounded-b-3xl w-40 mx-auto z-20"></div>
                
                <div className="h-full p-4 pt-12 relative">
                  {/* Playful top section */}
                  <div className="text-center mb-6 relative">
                    <h3 className="font-bold text-[#0D1F15]">{t.phone.walletTitle}</h3>
                    <HandDrawnStar className="absolute top-0 right-10 w-6 h-6 text-[#C8922A]" />
                  </div>

                  {/* The Pass */}
                  <div className="bg-[#0A6C3B] rounded-3xl p-6 text-white shadow-[0_8px_0_#08552e] border-2 border-[#0D1F15] relative overflow-hidden transform -rotate-1">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#C8922A] rounded-full opacity-50 mix-blend-multiply"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#0D1F15] rounded-full opacity-20"></div>
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div>
                        <div className="font-bold opacity-90 text-sm uppercase tracking-wider bg-white/20 inline-block px-2 py-1 rounded">Niqaty</div>
                        <div className="font-black text-2xl mt-2 leading-none" style={{whiteSpace: 'pre-line'}}>{t.phone.shopName}</div>
                      </div>
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-inner border-2 border-[#0D1F15]">☕</div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 mb-6 border-2 border-[#0D1F15] shadow-[4px_4px_0px_rgba(13,31,21,1)] text-[#0D1F15] relative z-10">
                      <div className="flex justify-between text-sm mb-3 font-black uppercase">
                        <span>{t.phone.rewards}</span>
                        <span className="bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#0A6C3B]">{stamps}/10</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[...Array(10)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`aspect-square rounded-full flex items-center justify-center border-2 transition-all duration-300
                              ${i < stamps 
                                ? 'bg-[#C8922A] border-[#0D1F15] scale-100 shadow-[2px_2px_0px_#0D1F15]' 
                                : 'bg-gray-100 border-gray-300 scale-90'}`}
                          >
                            {i < stamps && <Check className="w-4 h-4 text-white" strokeWidth={4} />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl flex justify-center border-2 border-[#0D1F15] relative z-10 transform rotate-1">
                      <div className="w-32 h-32 bg-[#FDFAF3] flex items-center justify-center p-2 relative rounded-xl border-2 border-dashed border-[#0D1F15]">
                        <div className="w-20 h-20 bg-[#0D1F15] rounded-lg"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl bg-white rounded-md p-1 border-2 border-[#0D1F15] transform rotate-12">📱</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Badges */}
              <div className="absolute -right-16 top-32 bg-[#FFF8E1] text-[#0D1F15] font-black px-4 py-3 border-4 border-[#0D1F15] shadow-[6px_6px_0px_#C8922A] animate-float z-30 transform rotate-6 rounded-lg text-lg">
                {t.hero.badge1}
              </div>
              <div className="absolute -left-20 bottom-40 bg-[#E8F5E9] text-[#0A6C3B] font-black px-4 py-3 border-4 border-[#0D1F15] shadow-[-6px_6px_0px_#0A6C3B] animate-float-delayed z-30 transform -rotate-6 rounded-lg text-lg">
                {t.hero.badge2}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="py-6 px-6 bg-[#E8F5E9] border-y-4 border-[#0D1F15] relative z-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0A6C3B] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#0A6C3B] border-2 border-[#0D1F15]"></span>
            </span>
            <span className="text-sm font-black uppercase tracking-widest text-[#0A6C3B]">{t.socialProof.live}</span>
          </div>
          <div className="flex items-center gap-3 text-[#0D1F15]">
            <span className={`text-3xl font-black text-[#0A6C3B] ${titleFont}`}>
              <SocialProofCounter target={347} isArabic={isRtl} />+
            </span>
            <span className="text-lg font-bold">{t.socialProof.text}</span>
          </div>
          <span className="bg-white px-4 py-1 border-2 border-[#0D1F15] shadow-[3px_3px_0px_#0D1F15] text-sm font-bold transform -rotate-1">{t.socialProof.cities}</span>
        </div>
      </section>

      {/* 3. Playful Marquee */}
      <section className="bg-[#C8922A] py-6 border-y-4 border-[#0D1F15] overflow-hidden whitespace-nowrap flex relative z-20 transform -rotate-1 origin-left w-[105vw] -ml-[2vw]">
        <div className="animate-marquee flex gap-8 text-[#0D1F15] text-3xl md:text-5xl font-black uppercase tracking-widest items-center">
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={i}>
              {t.marquee.map((item, j) => (
                <div key={`${i}-${j}`} className="flex items-center gap-8">
                  <span className="bg-white px-4 py-1 border-2 border-[#0D1F15] rounded-full shadow-[4px_4px_0px_#0D1F15] transform hover:rotate-3 transition-transform">{item}</span>
                  <HandDrawnStar className="w-8 h-8 text-white" />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* 4. Stats Mosaic */}
      <section className="py-24 bg-[#FDFAF3] px-6 relative mt-12">
        <DoodleScribble className="absolute top-10 left-10 w-32 h-32 text-[#E8F5E9]" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.stats.map((stat, i) => {
            const bgColors = ['bg-[#E8F5E9]', 'bg-[#FFF8E1]', 'bg-[#0D1F15]', 'bg-[#0A6C3B]'];
            const textColors = ['text-[#0A6C3B]', 'text-[#C8922A]', 'text-white', 'text-white'];
            const numberColors = ['text-[#0D1F15]', 'text-[#0D1F15]', 'text-[#C8922A]', 'text-[#FFF8E1]'];
            const rotations = ['rotate-1', '-rotate-2', 'rotate-2', '-rotate-1'];
            
            return (
              <div key={i} className="relative">
                {i < 3 && <HandDrawnArrow className={`hidden lg:block absolute -right-8 top-1/2 w-16 h-16 text-[#0D1F15] z-10 ${isRtl ? 'transform scale-x-[-1]' : ''}`} />}
                
                <FadeIn delay={i * 100}>
                  <div className={`${bgColors[i]} border-4 border-[#0D1F15] p-8 rounded-2xl shadow-[8px_8px_0px_#0D1F15] transform ${rotations[i]} hover:rotate-0 hover:-translate-y-2 transition-all duration-300 text-center relative overflow-hidden group`}>
                    <div className={`absolute -right-4 -top-4 w-20 h-20 bg-white opacity-20 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
                    <div className={`text-6xl md:text-7xl font-black ${titleFont} ${numberColors[i]} mb-4 relative z-10`}>
                      <CountUp end={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                    </div>
                    <div className={`text-lg md:text-xl font-bold ${textColors[i]} uppercase tracking-widest relative z-10 bg-white/10 py-2 rounded-lg border-2 border-transparent group-hover:border-current transition-colors inline-block px-4`}>
                      {stat.label}
                    </div>
                  </div>
                </FadeIn>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. How It Works - Bento Style */}
      <section className="py-32 bg-[#0A6C3B] text-[#FDFAF3] px-6 border-y-4 border-[#0D1F15] relative overflow-hidden">
        {/* Playful background shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C8922A] rounded-full mix-blend-multiply opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#0D1F15] rounded-full mix-blend-multiply opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
        
        <HandDrawnCircle className="absolute top-20 left-20 w-32 h-32 text-white/20" />
        <WavyUnderline className="absolute bottom-20 right-20 w-48 h-10 text-[#C8922A]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <FadeIn>
            <div className="text-center mb-20 relative inline-block mx-auto w-full">
              <h2 className={`text-5xl md:text-7xl font-black ${titleFont} uppercase tracking-tighter inline-block relative bg-[#0D1F15] text-white px-8 py-4 border-4 border-white shadow-[12px_12px_0px_#C8922A] transform -rotate-1`}>
                {t.howItWorks.title}
                <HandDrawnStar className="absolute -top-6 -right-6 w-12 h-12 text-[#FFF8E1]" />
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.howItWorks.steps.map((step, i) => {
              const styles = [
                "bg-[#FFF8E1] text-[#0D1F15] md:col-span-2 lg:col-span-2 shadow-[8px_8px_0px_#C8922A] rotate-1",
                "bg-[#0D1F15] text-white shadow-[8px_8px_0px_#FDFAF3] -rotate-1",
                "bg-[#E8F5E9] text-[#0D1F15] shadow-[8px_8px_0px_#0D1F15] -rotate-2",
                "bg-white text-[#0A6C3B] md:col-span-2 lg:col-span-1 shadow-[8px_8px_0px_#C8922A] rotate-2",
                "bg-[#C8922A] text-[#0D1F15] md:col-span-2 lg:col-span-1 shadow-[8px_8px_0px_#0D1F15] rotate-1"
              ];
              
              return (
                <FadeIn key={i} delay={i * 100} className="h-full">
                  <div className={`p-8 rounded-3xl border-4 border-[#0D1F15] h-full flex flex-col justify-center relative hover:scale-105 transition-transform duration-300 ${styles[i]}`}>
                    <div className="absolute top-4 right-4 w-16 h-16 rounded-full border-4 border-current flex items-center justify-center font-black text-2xl opacity-50 transform rotate-12 bg-white text-[#0D1F15]">
                      {i + 1}
                    </div>
                    <h3 className="text-3xl font-black mb-4 uppercase pr-16">{step.title}</h3>
                    <p className="text-lg font-bold opacity-80 border-t-4 border-current pt-4 border-dashed">{step.desc}</p>
                    
                    {/* Connecting elements between cards */}
                    {i < 4 && (
                      <div className="absolute -bottom-6 -right-6 z-20 text-4xl hidden lg:block transform rotate-45">
                        <HandDrawnArrow className={`w-12 h-12 ${isRtl ? 'scale-x-[-1]' : ''}`} />
                      </div>
                    )}
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Businesses Grid - Bulletin Board */}
      <section className="py-32 bg-[#FFF8E1] px-6 relative border-b-4 border-[#0D1F15]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMwRDFGMTUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeIn>
            <div className="flex flex-col items-center mb-24">
              <span className="bg-[#E8F5E9] text-[#0A6C3B] font-black px-6 py-2 rounded-full border-2 border-[#0D1F15] mb-6 transform -rotate-3 inline-block">{t.phone.whoUses}</span>
              <h2 className={`text-5xl md:text-7xl font-black ${titleFont} text-center uppercase tracking-tighter text-[#0D1F15] relative inline-block`}>
                {t.businesses.title}
                <WavyUnderline className="absolute -bottom-6 left-0 w-full h-6 text-[#C8922A]" />
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {t.businesses.items.map((item, i) => {
              const colors = ['bg-[#0A6C3B] text-white', 'bg-white text-[#0D1F15]', 'bg-[#C8922A] text-[#0D1F15]', 'bg-[#0D1F15] text-white', 'bg-[#E8F5E9] text-[#0A6C3B]', 'bg-white text-[#0D1F15]'];
              const color = colors[i % colors.length];
              const rotations = ['rotate-2', '-rotate-3', 'rotate-3', '-rotate-2', 'rotate-1', '-rotate-3', 'rotate-2', '-rotate-1'];
              const rotate = rotations[i % rotations.length];
              
              return (
                <FadeIn key={i} delay={i * 50}>
                  <div className={`p-6 border-4 border-[#0D1F15] shadow-[6px_6px_0px_rgba(13,31,21,1)] transform ${rotate} hover:scale-110 hover:z-20 transition-all duration-300 relative group ${color}`}>
                    {/* Push pin */}
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full border-2 border-[#0D1F15] shadow-sm z-10">
                      <div className="absolute inset-1 bg-white rounded-full opacity-30"></div>
                    </div>
                    
                    <div className="flex flex-col items-center text-center mt-2">
                      <div className="text-6xl mb-4 bg-white/20 w-24 h-24 rounded-2xl flex items-center justify-center border-2 border-current transform group-hover:rotate-12 transition-transform shadow-inner">
                        {item.emoji}
                      </div>
                      <h3 className="text-xl font-black uppercase">{item.title}</h3>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Features Bento Grid */}
      <section className="py-32 bg-[#FDFAF3] px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="mb-20">
              <h2 className={`text-5xl md:text-7xl font-black ${titleFont} uppercase tracking-tighter text-[#0D1F15]`}>
                {t.features.title}
                <span className="text-[#0A6C3B] inline-block transform rotate-12 ml-4">!</span>
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[250px]">
            {t.features.items.map((item, i) => {
              const isLarge = i === 0 || i === 3;
              const isTall = i === 1;
              const bgClass = i % 3 === 0 ? 'bg-[#E8F5E9]' : i % 3 === 1 ? 'bg-white' : 'bg-[#FFF8E1]';
              
              return (
                <FadeIn 
                  key={i} 
                  delay={i * 100} 
                  className={`h-full ${isLarge ? 'md:col-span-2' : ''} ${isTall ? 'row-span-2' : ''}`}
                >
                  <div className={`${bgClass} p-8 border-4 border-[#0D1F15] shadow-[8px_8px_0px_#0D1F15] h-full flex flex-col hover:-translate-y-2 hover:shadow-[12px_12px_0px_#0A6C3B] transition-all duration-300 relative overflow-hidden group`}>
                    
                    {/* Decorative accent shape */}
                    <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full opacity-20 transform group-hover:scale-150 transition-transform duration-700 ${i % 2 === 0 ? 'bg-[#0A6C3B]' : 'bg-[#C8922A]'}`}></div>

                    <div className="w-16 h-16 bg-white border-4 border-[#0D1F15] shadow-[4px_4px_0px_#0D1F15] rounded-xl flex items-center justify-center text-3xl mb-6 transform -rotate-6 group-hover:rotate-0 transition-transform z-10">
                      {item.emoji}
                    </div>
                    
                    <div className="relative z-10 mt-auto">
                      <h3 className="text-2xl font-black mb-2 uppercase text-[#0D1F15]">{item.title}</h3>
                      <p className="text-lg font-bold text-[#0D1F15]/70">{item.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Pricing - Sticker/Badge Style */}
      <section className="py-32 bg-[#0D1F15] px-6 border-y-4 border-[#0A6C3B] relative overflow-hidden">
        <DoodleScribble className="absolute top-0 right-0 w-full h-full text-[#0A6C3B] opacity-10 pointer-events-none" />
        <HandDrawnStar className="absolute top-20 left-20 w-24 h-24 text-[#C8922A] animate-float" />
        <HandDrawnStar className="absolute bottom-20 right-20 w-16 h-16 text-white animate-float-delayed" />
        
        <div className="max-w-2xl mx-auto relative z-10">
          <FadeIn>
            <div className="bg-[#FDFAF3] border-4 border-[#C8922A] p-10 md:p-16 shadow-[16px_16px_0px_#0A6C3B] relative transform rotate-1">
              {/* BEST DEAL Badge */}
              <div className="absolute -top-8 -right-8 bg-[#C8922A] text-[#0D1F15] font-black px-6 py-4 border-4 border-[#0D1F15] transform rotate-12 shadow-[4px_4px_0px_#0D1F15] z-20 text-xl">
                {t.phone.bestDeal}
              </div>

              <div className="text-center mb-10 border-b-4 border-dashed border-[#0D1F15] pb-10">
                <h2 className={`text-4xl font-black ${titleFont} mb-6 uppercase text-[#0D1F15]`}>
                  {t.pricing.title}
                </h2>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-end justify-center gap-2">
                    <div className="bg-[#0A6C3B] text-white px-6 py-2 transform -rotate-3 border-4 border-[#0D1F15] shadow-[6px_6px_0px_#0D1F15] text-6xl font-black">
                      {t.pricing.price}
                    </div>
                    <span className="text-2xl font-bold text-[#0D1F15] mb-2">{t.pricing.period}</span>
                  </div>
                  <span className="text-sm font-bold text-[#0D1F15]/50 mt-2">{t.pricing.priceNote}</span>
                </div>
              </div>

              <ul className="space-y-6 mb-12">
                {t.pricing.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-4 text-xl font-bold text-[#0D1F15]">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#E8F5E9] border-2 border-[#0D1F15] rounded-full flex items-center justify-center transform -rotate-6">
                      <Check className="w-5 h-5 text-[#0A6C3B]" strokeWidth={4} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button className={`w-full bg-[#C8922A] text-[#0D1F15] py-6 text-2xl font-black hover:bg-[#b07d20] transition-all transform hover:-translate-y-2 border-4 border-[#0D1F15] shadow-[8px_8px_0px_#0D1F15] uppercase`}>
                {t.pricing.cta}
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 9. CTA - Playful Scattered */}
      <section className="py-32 bg-[#E8F5E9] px-6 relative overflow-hidden text-center">
        {/* Scattered Stickers */}
        <div className="absolute top-20 left-[10%] text-6xl transform -rotate-12 animate-float">🚀</div>
        <div className="absolute bottom-20 left-[20%] text-5xl transform rotate-45 animate-float-delayed">🔥</div>
        <div className="absolute top-32 right-[15%] text-7xl transform rotate-12 animate-float">🎉</div>
        <div className="absolute bottom-32 right-[25%] text-5xl transform -rotate-12 animate-float-delayed">👋</div>
        
        <HandDrawnCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] text-[#0A6C3B] opacity-10 pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <FadeIn>
            <h2 className={`text-6xl md:text-8xl font-black ${titleFont} mb-6 text-[#0D1F15] uppercase tracking-tighter`}>
              {t.waitlist.title}
            </h2>
            <p className="text-2xl text-[#0D1F15] mb-12 font-bold bg-white inline-block px-6 py-2 border-2 border-[#0D1F15] transform -rotate-1 shadow-[4px_4px_0px_#0D1F15]">
              {t.waitlist.desc}
            </p>
            
            <div className="relative max-w-xl mx-auto">
              <HandDrawnArrow className="absolute -left-20 top-4 w-20 h-20 text-[#C8922A] hidden md:block transform -scale-x-100 rotate-45" />
              
              {!formSuccess ? (
                <div className="space-y-6">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); setFormSuccess(true); }}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <input 
                      type="text" 
                      placeholder={t.waitlist.placeholder}
                      required
                      className="flex-1 bg-white px-8 py-5 text-xl outline-none border-4 border-[#0D1F15] shadow-[6px_6px_0px_#0D1F15] focus:shadow-[2px_2px_0px_#0D1F15] focus:translate-y-1 focus:translate-x-1 transition-all font-bold placeholder:text-gray-400"
                    />
                    <button 
                      type="submit"
                      className="bg-[#0A6C3B] text-white px-10 py-5 text-xl font-black border-4 border-[#0D1F15] shadow-[6px_6px_0px_#C8922A] hover:bg-[#0D1F15] transition-all transform hover:-translate-y-2 uppercase whitespace-nowrap"
                    >
                      {t.waitlist.button}
                    </button>
                  </form>
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-1 bg-[#0D1F15]/10 flex-1"></div>
                    <span className="text-[#0D1F15]/40 font-black uppercase text-sm">{lang === 'ar' ? 'أو' : 'or'}</span>
                    <div className="h-1 bg-[#0D1F15]/10 flex-1"></div>
                  </div>
                  <a 
                    href="https://wa.me/966500000000" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-white px-10 py-5 text-xl font-black border-4 border-[#0D1F15] shadow-[6px_6px_0px_#0D1F15] hover:bg-[#20bd5a] transition-all transform hover:-translate-y-2 w-full sm:w-auto"
                  >
                    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    {t.waitlist.whatsappCta}
                  </a>
                </div>
              ) : (
                <div className="bg-[#FFF8E1] text-[#0A6C3B] p-8 border-4 border-[#0D1F15] shadow-[8px_8px_0px_#0D1F15] font-black text-2xl flex items-center justify-center gap-4 transform rotate-1">
                  <span className="text-4xl">🎉</span>
                  {t.waitlist.success}
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D1F15] text-[#FDFAF3] py-12 px-6 border-t-8 border-[#C8922A]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className={`text-4xl font-black ${titleFont} tracking-tighter flex items-center gap-2`}>
            {t.nav.logo}
            <div className="w-4 h-4 bg-[#0A6C3B] rounded-full"></div>
          </div>
          <div className="text-white/60 font-bold font-mono">
            © {new Date().getFullYear()} Niqaty. {lang === 'ar' ? 'صُنع في السعودية 🇸🇦' : 'Made in Saudi Arabia 🇸🇦'}
          </div>
        </div>
      </footer>
    </div>
  );
}
