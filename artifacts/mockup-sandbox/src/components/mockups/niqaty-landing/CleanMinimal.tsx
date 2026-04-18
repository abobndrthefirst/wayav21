import React, { useState, useEffect, useRef } from 'react';
import { Globe, CheckCircle2, Star, Coffee, Scissors, Utensils, ShoppingBag, Shirt, Heart, Gift, Smartphone, Zap, Shield, TrendingUp, Users, Check, Send } from 'lucide-react';
import './_group.css';

// --- Types ---
type Language = 'ar' | 'en';

// --- Content Dictionary ---
const content = {
  ar: {
    nav: { logo: 'نقاطي', cta: 'ابدأ مجاناً' },
    hero: {
      headline: 'عميلك يزورك مرة — ويختفي. نقاطي يرجّعه.',
      subheadline: 'برنامج ولاء بالـ QR ينضاف لمحفظة جوال عميلك بثانية. بدون تطبيق، بدون جهاز، بدون تعقيد. صُمم للمحلات الصغيرة في السعودية.',
      ctaPrimary: 'ابدأ مجاناً',
      ctaSecondary: 'شاهد كيف يعمل',
      badge1: 'تم إضافة نقطة',
      badge2: 'تم فتح المكافأة'
    },
    socialProof: {
      count: '٣٤٧+',
      text: 'صاحب محل في قائمة الانتظار',
      cities: 'من الرياض، جدة، والدمام',
      live: 'مباشر'
    },
    marquee: ['مقاهي', 'مطاعم', 'مغاسل', 'صالونات', 'مخابز', 'متاجر', 'سبا', 'عيادات'],
    stats: [
      { value: 7, suffix: '', label: 'دقائق للتشغيل' },
      { value: 0, suffix: '', label: 'أجهزة مطلوبة' },
      { value: 347, suffix: '+', label: 'في قائمة الانتظار' },
      { value: 75, suffix: '', label: 'ريال/شهرياً' }
    ],
    howItWorks: {
      title: 'كيف يشتغل؟',
      steps: [
        { title: 'العميل يمسح الكود', desc: 'بدون تحميل أي تطبيق، يمسح العميل الكود بالكاميرا.' },
        { title: 'يضيف البطاقة للمحفظة', desc: 'تنحفظ البطاقة في Apple Wallet أو Google Pay بضغطة.' },
        { title: 'يكسب نقاط', desc: 'مع كل زيارة، يمسح الكود ويحصل على نقطة جديدة.' },
        { title: 'يوصل للمكافأة', desc: 'عند اكتمال النقاط، تظهر المكافأة تلقائياً.' },
        { title: 'يرجع لك دايماً', desc: 'نرسل إشعارات تذكره يرجع يزورك.' }
      ]
    },
    businesses: {
      title: 'مناسب لكل نشاط',
      types: ['مقاهي مختصة', 'مطاعم', 'صالونات تجميل', 'مغاسل ملابس', 'متاجر ورود', 'مخابز', 'عيادات', 'أندية رياضية']
    },
    features: {
      title: 'كل اللي تحتاجه، وأكثر',
      items: [
        { title: 'إعداد سريع', desc: 'ابني برنامجك في أقل من 10 دقائق وبدون مساعدة تقنية.' },
        { title: 'بدون أجهزة', desc: 'لا تحتاج لأجهزة قراءة أو أيباد، فقط كود QR مطبوع.' },
        { title: 'محفظة رقمية', desc: 'متوافق مع محافظ آبل وجوجل لسهولة الوصول.' },
        { title: 'إشعارات ذكية', desc: 'أرسل عروض وتذكيرات مباشرة لشاشة العميل.' },
        { title: 'تحليلات بسيطة', desc: 'اعرف عملائك الأوفياء ومعدل زياراتهم.' },
        { title: 'أمان عالي', desc: 'حماية كاملة لبيانات عملائك ونقاطهم.' }
      ]
    },
    mockup: {
      title: 'بطاقة في جيب العميل',
      businessName: 'كافيه المحمصة',
      points: 'النقاط',
      reward: 'قهوة مجانية بعد 10 أكواب',
      scanText: 'امسح الكود'
    },
    pricing: {
      title: 'باقة واحدة. بدون مفاجآت.',
      price: '٧٥ ريال',
      period: '/ شهرياً',
      priceNote: '(≈ $20 USD)',
      features: ['عملاء غير محدودين', 'نقاط ومكافآت بلا حدود', 'تصميم بهويتك', 'دعم واتساب ٢٤/٧', 'إشعارات للمحفظة'],
      cta: 'ابدأ تجربتك المجانية'
    },
    footerCTA: {
      title: 'خلّ عميلك يرجع لك — ابدأ اليوم',
      desc: 'انضم لـ ٣٤٧+ صاحب محل بدأوا يبنون ولاء عملائهم مع نقاطي.',
      placeholder: 'رقم الواتساب أو البريد الإلكتروني',
      button: 'سجّل الآن',
      whatsappCta: 'تواصل عبر واتساب',
      success: 'تم التسجيل بنجاح! بنتواصل معك عبر الواتساب قريباً 🎉'
    }
  },
  en: {
    nav: { logo: 'Niqaty', cta: 'Start Free' },
    hero: {
      headline: 'Your customers visit once — and vanish. Niqaty brings them back.',
      subheadline: "A QR-based loyalty card in your customer's Apple or Google Wallet. No app. No hardware. No contracts. Built for small businesses in Saudi Arabia.",
      ctaPrimary: 'Start Free',
      ctaSecondary: 'See How It Works',
      badge1: 'Point Added',
      badge2: 'Reward Unlocked'
    },
    socialProof: {
      count: '347+',
      text: 'shop owners on the waitlist',
      cities: 'From Riyadh, Jeddah & Dammam',
      live: 'Live'
    },
    marquee: ['Coffee Shops', 'Restaurants', 'Laundromats', 'Salons', 'Bakeries', 'Boutiques', 'Spas', 'Clinics'],
    stats: [
      { value: 7, suffix: '', label: 'Minutes To Go Live' },
      { value: 0, suffix: '', label: 'Hardware Needed' },
      { value: 347, suffix: '+', label: 'On The Waitlist' },
      { value: 75, suffix: '', label: 'SAR / Month' }
    ],
    howItWorks: {
      title: 'How it works?',
      steps: [
        { title: 'Customer Scans QR', desc: 'No app download needed, just their native camera.' },
        { title: 'Adds to Wallet', desc: 'Saves to Apple Wallet or Google Pay in one tap.' },
        { title: 'Earns Points', desc: 'Every visit, they scan and collect a new point.' },
        { title: 'Unlocks Reward', desc: 'When stamps are full, reward is unlocked instantly.' },
        { title: 'Keeps Coming Back', desc: 'We send push notifications to bring them back.' }
      ]
    },
    businesses: {
      title: 'Perfect for every business',
      types: ['Specialty Coffee', 'Restaurants', 'Beauty Salons', 'Laundromats', 'Flower Shops', 'Bakeries', 'Clinics', 'Gyms']
    },
    features: {
      title: 'Everything you need',
      items: [
        { title: 'Fast Setup', desc: 'Build your program in under 10 minutes, no tech skills.' },
        { title: 'Zero Hardware', desc: 'No iPads or scanners needed. Just a printed QR code.' },
        { title: 'Digital Wallet', desc: 'Native Apple & Google Wallet integration.' },
        { title: 'Push Notifications', desc: 'Send offers straight to the lock screen.' },
        { title: 'Simple Analytics', desc: 'Know your loyal customers and visit rates.' },
        { title: 'High Security', desc: 'Full protection for customer data and points.' }
      ]
    },
    mockup: {
      title: 'A card in their pocket',
      businessName: 'The Roastery Cafe',
      points: 'Points',
      reward: 'Free Coffee after 10 cups',
      scanText: 'Scan Code'
    },
    pricing: {
      title: 'One Plan. No Surprises.',
      price: '75 SAR',
      period: '/ month',
      priceNote: '(≈ $20 USD)',
      features: ['Unlimited Customers', 'Unlimited Points & Rewards', 'Custom Branded Cards', '24/7 WhatsApp Support', 'Wallet Notifications'],
      cta: 'Start Your Free Trial'
    },
    footerCTA: {
      title: 'Make your customers come back — start today',
      desc: 'Join 347+ shop owners already building customer loyalty with Niqaty.',
      placeholder: 'WhatsApp number or email',
      button: 'Join Now',
      whatsappCta: 'Chat on WhatsApp',
      success: 'Successfully joined! We\'ll reach out via WhatsApp soon 🎉'
    }
  }
};

// --- Helper Components ---
const SectionReveal = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
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
    <div ref={ref} className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}>
      {children}
    </div>
  );
};

const CountUp = ({ end, suffix = '' }: { end: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, end]);

  return <span ref={ref}>{count}{suffix}</span>;
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
      setCount(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, target]);
  return <span ref={ref}>{isArabic ? toArabicNumerals(count) : count}</span>;
};

// --- Main Component ---
export default function CleanMinimal() {
  const [lang, setLang] = useState<Language>('ar');
  const t = content[lang];
  const isRTL = lang === 'ar';
  
  const [stampCount, setStampCount] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [isRTL]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStampCount(prev => (prev >= 10 ? 0 : prev + 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  const fontClasses = isRTL 
    ? "font-['Cairo']" 
    : "font-['DM_Sans']";
  const headingFont = isRTL 
    ? "font-['Tajawal']" 
    : "font-['Playfair_Display']";

  return (
    <div className={`min-h-screen bg-[#FDFAF3] text-[#0D1F15] ${fontClasses} overflow-x-hidden relative`}>
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-islamic-pattern opacity-10 pointer-events-none z-0 mix-blend-multiply"></div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FDFAF3]/80 backdrop-blur-xl border-b border-[#0A6C3B]/10 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-10">
          <div className={`text-2xl font-bold text-[#0A6C3B] ${headingFont}`}>{t.nav.logo}</div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-2 text-sm font-semibold text-[#0D1F15] hover:text-[#0A6C3B] transition-colors bg-white/50 px-3 py-1.5 rounded-full border border-black/5"
            >
              <Globe className="w-4 h-4" />
              {lang.toUpperCase()}
            </button>
            <button className="bg-[#0A6C3B] text-white px-6 py-2.5 rounded-full font-medium hover:bg-[#085a31] transition-all hover:shadow-lg hover:shadow-[#0A6C3B]/20 transform hover:-translate-y-0.5">
              {t.nav.cta}
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20">
        {/* Hero */}
        <section className="px-6 py-20 text-center max-w-5xl mx-auto relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#0A6C3B]/10 to-[#C8922A]/10 rounded-full blur-[80px] -z-10"></div>
          
          {/* Floating Badges */}
          <div className="hidden md:block absolute top-20 right-10 bg-white/90 backdrop-blur shadow-sm border border-black/5 rounded-2xl p-4 animate-float flex items-center gap-3 z-10">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xl">✅</div>
            <span className="font-medium text-sm text-[#0D1F15]">{t.hero.badge1}</span>
          </div>
          <div className="hidden md:block absolute bottom-20 left-10 bg-white/90 backdrop-blur shadow-sm border border-black/5 rounded-2xl p-4 animate-float-delayed flex items-center gap-3 z-10">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-xl">🎉</div>
            <span className="font-medium text-sm text-[#0D1F15]">{t.hero.badge2}</span>
          </div>

          <SectionReveal>
            <h1 className={`text-5xl md:text-7xl font-bold text-[#0D1F15] leading-tight mb-8 ${headingFont}`}>
              {t.hero.headline}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              {t.hero.subheadline}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-4 bg-[#0A6C3B] text-white rounded-full font-semibold text-lg hover:bg-[#085a31] transition-all hover:shadow-xl hover:shadow-[#0A6C3B]/30 transform hover:-translate-y-1">
                {t.hero.ctaPrimary}
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-[#0D1F15] border border-black/10 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all hover:shadow-md">
                {t.hero.ctaSecondary}
              </button>
            </div>
          </SectionReveal>
        </section>

        {/* Social Proof Strip */}
        <section className="py-8 px-6">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-5 text-center">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0A6C3B] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0A6C3B]"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#0A6C3B]">{t.socialProof.live}</span>
            </div>
            <div className="flex items-center gap-2 text-[#0D1F15]">
              <span className={`text-2xl font-bold text-[#0A6C3B] ${headingFont}`}>
                <SocialProofCounter target={347} isArabic={isRTL} />+
              </span>
              <span className="text-sm font-medium text-gray-600">{t.socialProof.text}</span>
            </div>
            <span className="text-sm text-gray-400 font-medium">{t.socialProof.cities}</span>
          </div>
        </section>

        {/* Marquee */}
        <section className="py-12 border-y border-black/5 bg-white/50 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#FDFAF3] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#FDFAF3] to-transparent z-10 pointer-events-none"></div>
          <div className="flex animate-marquee gap-12 text-2xl md:text-4xl font-light text-gray-400 whitespace-nowrap px-6">
            {[...t.marquee, ...t.marquee].map((item, i) => (
              <span key={i} className={`flex items-center gap-4 ${headingFont}`}>
                {item}
                <span className="text-[#C8922A] text-xl">✦</span>
              </span>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="py-24 px-6 max-w-6xl mx-auto">
          <div className="bg-[#0A6C3B] rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white opacity-5 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 relative z-10">
              {t.stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className={`text-4xl md:text-5xl font-bold mb-2 text-[#C8922A] ${headingFont}`}>
                    <CountUp end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-white/80 font-medium text-sm md:text-base">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-24 px-6 bg-white/40 border-y border-black/5">
          <div className="max-w-5xl mx-auto">
            <SectionReveal>
              <h2 className={`text-4xl md:text-5xl font-bold text-center mb-20 text-[#0D1F15] ${headingFont}`}>
                {t.howItWorks.title}
              </h2>
            </SectionReveal>
            <div className="relative">
              <div className="hidden md:block absolute top-1/2 left-12 right-12 h-0.5 bg-gradient-to-r from-transparent via-[#0A6C3B]/20 to-transparent -translate-y-1/2 z-0"></div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
                {t.howItWorks.steps.map((step, i) => {
                  const icons = [Smartphone, CheckCircle2, Star, Gift, Heart];
                  const Icon = icons[i];
                  return (
                    <SectionReveal key={i} className={`delay-${i * 100}`}>
                      <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-lg hover:border-[#0A6C3B]/30 hover:-translate-y-2 transition-all duration-300 text-center h-full relative group">
                        <div className="w-14 h-14 bg-[#FDFAF3] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#0A6C3B] group-hover:bg-[#0A6C3B] group-hover:text-white transition-colors">
                          <Icon className="w-7 h-7" />
                        </div>
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
                          {i + 1}
                        </div>
                        <h3 className={`text-xl font-bold mb-3 text-[#0D1F15] ${headingFont}`}>{step.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                      </div>
                    </SectionReveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Phone Mockup Section */}
        <section className="py-32 px-6 max-w-6xl mx-auto overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <SectionReveal>
                <h2 className={`text-4xl md:text-5xl font-bold mb-8 text-[#0D1F15] leading-tight ${headingFont}`}>
                  {t.mockup.title}
                </h2>
                <div className="space-y-6">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#0A6C3B]/10 flex items-center justify-center shrink-0 mt-1 text-[#0A6C3B]">
                        <Check className="w-4 h-4" />
                      </div>
                      <p className="text-lg text-gray-600">
                        {t.howItWorks.steps[i].desc}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionReveal>
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2 flex justify-center perspective-[1000px]">
              <SectionReveal>
                <div className="relative w-[300px] h-[600px] bg-black rounded-[3rem] p-3 shadow-2xl border-4 border-gray-800 transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-20"></div>
                  <div className="w-full h-full bg-[#f4f4f5] rounded-[2.5rem] overflow-hidden relative pt-12">
                    {/* Wallet Pass */}
                    <div className="mx-4 mt-6 h-[480px] bg-gradient-to-br from-[#0A6C3B] to-[#0D1F15] rounded-[1.5rem] shadow-lg relative text-white flex flex-col">
                      <div className="p-6 pb-4">
                        <div className="flex justify-between items-center mb-8">
                          <div className={`font-bold text-xl ${headingFont}`}>{t.mockup.businessName}</div>
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Coffee className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="text-center mb-2">
                          <div className="text-xs text-white/70 uppercase tracking-wider">{t.mockup.points}</div>
                          <div className="text-4xl font-bold">{Math.min(stampCount, 10)}<span className="text-xl text-white/50">/10</span></div>
                        </div>
                      </div>
                      <div className="bg-white/10 mx-4 h-px border-t border-dashed border-white/30"></div>
                      <div className="flex-1 p-6 flex flex-col">
                        <div className="grid grid-cols-5 gap-3 mb-auto">
                          {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-square rounded-full border-2 border-white/20 flex items-center justify-center relative bg-white/5">
                              {i < stampCount && (
                                <div className="absolute inset-0 bg-[#C8922A] rounded-full stamp-active shadow-[0_0_10px_rgba(200,146,42,0.5)]"></div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 bg-white/10 rounded-xl p-4 text-center backdrop-blur-md">
                          <div className="w-16 h-16 bg-white mx-auto rounded-lg mb-3 flex items-center justify-center text-black font-mono text-xs">QR</div>
                          <div className="text-xs font-medium">{t.mockup.scanText}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Reflection */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-[3rem] pointer-events-none"></div>
                </div>
              </SectionReveal>
            </div>
          </div>
        </section>

        {/* Business Types */}
        <section className="py-24 px-6 bg-[#0D1F15] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#0A6C3B]/20 via-transparent to-transparent pointer-events-none"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <SectionReveal>
              <h2 className={`text-4xl md:text-5xl font-bold text-center mb-16 text-white ${headingFont}`}>
                {t.businesses.title}
              </h2>
            </SectionReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { icon: Coffee, label: t.businesses.types[0] },
                { icon: Utensils, label: t.businesses.types[1] },
                { icon: Scissors, label: t.businesses.types[2] },
                { icon: Shirt, label: t.businesses.types[3] },
                { icon: Heart, label: t.businesses.types[4] },
                { icon: ShoppingBag, label: t.businesses.types[5] },
                { icon: Zap, label: t.businesses.types[6] },
                { icon: TrendingUp, label: t.businesses.types[7] },
              ].map((biz, i) => (
                <SectionReveal key={i} className={`delay-${(i % 4) * 100}`}>
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center hover:bg-[#0A6C3B] hover:border-[#0A6C3B] hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                    <biz.icon className="w-8 h-8 mx-auto mb-4 text-white/50 group-hover:text-white transition-colors" />
                    <div className="font-medium text-lg text-white/90 group-hover:text-white">{biz.label}</div>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-6 max-w-6xl mx-auto">
          <SectionReveal>
            <h2 className={`text-4xl md:text-5xl font-bold text-center mb-16 text-[#0D1F15] ${headingFont}`}>
              {t.features.title}
            </h2>
          </SectionReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.features.items.map((feat, i) => {
              const icons = [Zap, Smartphone, Shield, Send, Users, TrendingUp];
              const Icon = icons[i];
              return (
                <SectionReveal key={i} className={`delay-${(i % 3) * 100}`}>
                  <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl hover:shadow-[#0A6C3B]/5 transition-all duration-500 group relative overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-[#0A6C3B] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-[#0A6C3B] group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className={`text-xl font-bold mb-3 text-[#0D1F15] ${headingFont}`}>{feat.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{feat.desc}</p>
                  </div>
                </SectionReveal>
              );
            })}
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 px-6 max-w-4xl mx-auto">
          <SectionReveal>
            <div className="bg-white rounded-[3rem] p-10 md:p-16 text-center border border-black/5 shadow-xl shadow-black/[0.02] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#0A6C3B]/5 to-transparent rounded-bl-full pointer-events-none"></div>
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 text-[#0D1F15] ${headingFont}`}>
                {t.pricing.title}
              </h2>
              <div className="flex flex-col items-center mb-10">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-6xl md:text-7xl font-bold text-[#0A6C3B]">{t.pricing.price}</span>
                  <span className="text-xl text-gray-500 font-medium mt-4">{t.pricing.period}</span>
                </div>
                <span className="text-sm text-gray-400 mt-1">{t.pricing.priceNote}</span>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 mb-12 max-w-2xl mx-auto">
                {t.pricing.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-700 font-medium bg-gray-50 px-4 py-2 rounded-full border border-black/5">
                    <CheckCircle2 className="w-4 h-4 text-[#0A6C3B]" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
              <button className="px-10 py-4 bg-[#0A6C3B] text-white rounded-full font-bold text-lg hover:bg-[#085a31] transition-all hover:shadow-xl hover:shadow-[#0A6C3B]/30 transform hover:-translate-y-1 w-full md:w-auto min-w-[240px]">
                {t.pricing.cta}
              </button>
            </div>
          </SectionReveal>
        </section>

        {/* CTA Waitlist */}
        <section className="pt-12 pb-24 px-6 max-w-4xl mx-auto">
          <SectionReveal>
            <div className="bg-[#0A6C3B] rounded-[3rem] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-50 pointer-events-none"></div>
              <h2 className={`text-3xl md:text-5xl font-bold mb-4 relative z-10 ${headingFont}`}>
                {t.footerCTA.title}
              </h2>
              <p className="text-white/80 text-lg mb-10 relative z-10 font-light">
                {t.footerCTA.desc}
              </p>
              
              {!formSubmitted ? (
                <div className="relative z-10 max-w-lg mx-auto space-y-4">
                  <form onSubmit={handleFormSubmit} className="bg-white/10 p-2 rounded-full flex flex-col sm:flex-row gap-2 border border-white/20 backdrop-blur-md">
                    <input 
                      type="text" 
                      placeholder={t.footerCTA.placeholder}
                      className="flex-1 bg-transparent px-6 py-4 outline-none text-white placeholder-white/50 text-center sm:text-start"
                      required
                    />
                    <button type="submit" className="bg-white text-[#0A6C3B] px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg">
                      {t.footerCTA.button}
                    </button>
                  </form>
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-px bg-white/15 flex-1"></div>
                    <span className="text-white/30 text-sm font-medium">{lang === 'ar' ? 'أو' : 'or'}</span>
                    <div className="h-px bg-white/15 flex-1"></div>
                  </div>
                  <a 
                    href="https://wa.me/966500000000" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-full font-bold hover:bg-[#20bd5a] transition-all hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    {t.footerCTA.whatsappCta}
                  </a>
                </div>
              ) : (
                <div className="mt-6 text-green-200 font-medium animate-fade-up relative z-10 bg-black/20 inline-block px-6 py-2 rounded-full">
                  {t.footerCTA.success}
                </div>
              )}
            </div>
          </SectionReveal>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-black/5 py-8 text-center text-gray-400 text-sm">
        <p>© 2025 Niqaty. {lang === 'ar' ? 'صُنع في السعودية 🇸🇦' : 'Made in Saudi Arabia 🇸🇦'}</p>
      </footer>
    </div>
  );
}