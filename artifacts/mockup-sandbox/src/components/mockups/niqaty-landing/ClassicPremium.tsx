import React, { useState, useEffect, useRef } from 'react';
import { Check, CheckCircle2, LayoutDashboard, QrCode, Smartphone, Star, Target, Users, Zap } from 'lucide-react';
import './_group.css';

type Language = 'ar' | 'en';

const CONTENT = {
  ar: {
    nav: {
      logo: "نقاطي",
      langToggle: "English",
      login: "تسجيل الدخول",
      cta: "ابدأ مجاناً"
    },
    hero: {
      badge1: "✅ تم إضافة نقطة",
      badge2: "🎉 تم فتح المكافأة",
      headline: "عميلك يزورك مرة — ويختفي. نقاطي يرجّعه.",
      subhead: "برنامج ولاء بالـ QR ينضاف لمحفظة جوال عميلك بثانية. بدون تطبيق، بدون جهاز، بدون تعقيد. صُمم خصيصاً للمحلات الصغيرة في السعودية.",
      ctaPrimary: "ابدأ مجاناً",
      ctaSecondary: "شاهد كيف يعمل"
    },
    socialProof: {
      count: "٣٤٧+",
      text: "صاحب محل في قائمة الانتظار",
      cities: "من الرياض، جدة، والدمام",
      live: "مباشر"
    },
    marquee: [
      "☕️ مقاهي", "🍔 مطاعم", "💈 صالونات حلاقة", "💅 صالونات تجميل", "🥐 مخابز", "👕 مغاسل", "🛍️ متاجر", "🪴 مشاتل"
    ],
    stats: {
      setup: { value: 7, suffix: " دقائق", label: "للتشغيل" },
      hardware: { value: 0, suffix: "", label: "أجهزة مطلوبة" },
      customers: { value: 347, suffix: "+", label: "في قائمة الانتظار" },
      price: { value: 75, suffix: " ريال/شهر", label: "سعر ثابت" }
    },
    howItWorks: {
      title: "كيف يعمل؟",
      steps: [
        { icon: "📱", title: "يمسح العميل الباركود", desc: "بدون تحميل أي تطبيق، فقط كاميرا الجوال." },
        { icon: "💼", title: "تُضاف لمحفظة أبل/جوجل", desc: "تُحفظ البطاقة تلقائياً في محفظة العميل الرقمية." },
        { icon: "⭐️", title: "يكسب النقاط بسهولة", desc: "عند كل زيارة، امسح بطاقته لإضافة نقطة." },
        { icon: "🎁", title: "يحصل على المكافأة", desc: "عند اكتمال النقاط، يحصل على مكافأته المحددة مسبقاً." },
        { icon: "🔄", title: "يعود مرة أخرى", desc: "ترسل البطاقة إشعارات تذكيرية للعميل للعودة." }
      ]
    },
    businessTypes: {
      title: "مصمم لكل نشاط تجاري",
      types: [
        { icon: "☕️", name: "المقاهي المختصة" },
        { icon: "🍔", name: "المطاعم والوجبات السريعة" },
        { icon: "💈", name: "صالونات الحلاقة" },
        { icon: "💅", name: "صالونات التجميل والسبا" },
        { icon: "🥐", name: "المخابز والحلويات" },
        { icon: "👕", name: "المغاسل" },
        { icon: "🚗", name: "مغاسل السيارات" },
        { icon: "🛍️", name: "المتاجر المتنوعة" }
      ]
    },
    features: {
      title: "كل ما تحتاجه للنجاح",
      items: [
        { icon: <QrCode className="w-6 h-6" />, title: "مسح سريع للباركود", desc: "إضافة النقاط بمسحة واحدة سريعة جداً." },
        { icon: <Smartphone className="w-6 h-6" />, title: "محفظة أبل وجوجل", desc: "بطاقات رقمية متوافقة بالكامل مع جميع الأجهزة." },
        { icon: <Zap className="w-6 h-6" />, title: "إشعارات ذكية", desc: "تذكير العملاء بزيارتك عند اقترابهم من المتجر." },
        { icon: <LayoutDashboard className="w-6 h-6" />, title: "لوحة تحكم بسيطة", desc: "تابع أداء برنامج الولاء الخاص بك بكل سهولة." },
        { icon: <Users className="w-6 h-6" />, title: "بيانات العملاء", desc: "افهم سلوك عملائك وحسّن مبيعاتك." },
        { icon: <Target className="w-6 h-6" />, title: "حملات تسويقية", desc: "أرسل عروض خاصة مباشرة لهواتف عملائك." }
      ]
    },
    mockup: {
      title: "شكل بطاقتك في محفظة العميل",
      walletTitle: "المحفظة",
      vipPass: "بطاقة VIP",
      businessName: "مقهى ومحمصة",
      rewardText: "احصل على قهوة مجانية بعد 10 أكواب",
      points: "النقاط",
      mostPopular: "الأكثر طلباً"
    },
    pricing: {
      title: "باقة واحدة. بدون مفاجآت.",
      price: "٧٥ ريال",
      period: "/ شهرياً",
      priceNote: "(≈ $20 USD)",
      desc: "بدون عقود. بدون رسوم خفية. ألغِ بأي وقت. جرّب أسبوع مجاناً.",
      features: [
        "عملاء غير محدودين",
        "نقاط ومكافآت غير محدودة",
        "تصميم بطاقة بهويتك",
        "لوحة تحكم وتقارير مفصلة",
        "دعم فني عبر واتساب ٢٤/٧"
      ],
      cta: "ابدأ تجربتك المجانية"
    },
    cta: {
      title: "خلّ عميلك يرجع لك — ابدأ اليوم",
      desc: "انضم لـ ٣٤٧+ صاحب محل بدأوا يبنون ولاء عملائهم مع نقاطي.",
      placeholder: "رقم الواتساب أو البريد الإلكتروني",
      button: "سجّل الآن",
      whatsappCta: "تواصل عبر واتساب",
      success: "تم التسجيل بنجاح! بنتواصل معك عبر الواتساب قريباً 🎉"
    },
    footer: "© 2025 نقاطي. صُنع في السعودية 🇸🇦"
  },
  en: {
    nav: {
      logo: "Niqaty",
      langToggle: "العربية",
      login: "Login",
      cta: "Start Free"
    },
    hero: {
      badge1: "✅ Point Added",
      badge2: "🎉 Reward Unlocked",
      headline: "Your customers visit once — and vanish. Niqaty brings them back.",
      subhead: "A QR-based loyalty card that lives in your customer's Apple or Google Wallet. No app. No hardware. No contracts. Built for small businesses in Saudi Arabia.",
      ctaPrimary: "Start Free",
      ctaSecondary: "See How It Works"
    },
    socialProof: {
      count: "347+",
      text: "shop owners on the waitlist",
      cities: "From Riyadh, Jeddah & Dammam",
      live: "Live"
    },
    marquee: [
      "☕️ Coffee Shops", "🍔 Restaurants", "💈 Barbershops", "💅 Salons", "🥐 Bakeries", "👕 Laundromats", "🛍️ Boutiques", "🪴 Nurseries"
    ],
    stats: {
      setup: { value: 7, suffix: " mins", label: "To Go Live" },
      hardware: { value: 0, suffix: "", label: "Hardware Needed" },
      customers: { value: 347, suffix: "+", label: "On The Waitlist" },
      price: { value: 75, suffix: " SAR/mo", label: "Flat Price" }
    },
    howItWorks: {
      title: "How It Works",
      steps: [
        { icon: "📱", title: "Customer Scans QR", desc: "No app download needed, just their phone camera." },
        { icon: "💼", title: "Added to Wallet", desc: "Card is automatically saved to Apple/Google Wallet." },
        { icon: "⭐️", title: "Earn Points Easily", desc: "Scan their card to add a point on every visit." },
        { icon: "🎁", title: "Unlock Rewards", desc: "Once points are filled, they get their pre-set reward." },
        { icon: "🔄", title: "Keep Coming Back", desc: "Push notifications remind them to return." }
      ]
    },
    businessTypes: {
      title: "Built For Every Business",
      types: [
        { icon: "☕️", name: "Specialty Coffee" },
        { icon: "🍔", name: "Fast Food & Dining" },
        { icon: "💈", name: "Barbershops" },
        { icon: "💅", name: "Salons & Spas" },
        { icon: "🥐", name: "Bakeries" },
        { icon: "👕", name: "Laundromats" },
        { icon: "🚗", name: "Car Washes" },
        { icon: "🛍️", name: "Retail Stores" }
      ]
    },
    features: {
      title: "Everything You Need To Grow",
      items: [
        { icon: <QrCode className="w-6 h-6" />, title: "Fast QR Scanning", desc: "Add points with a single, lightning-fast scan." },
        { icon: <Smartphone className="w-6 h-6" />, title: "Apple & Google Wallet", desc: "Fully compatible digital cards for all devices." },
        { icon: <Zap className="w-6 h-6" />, title: "Smart Notifications", desc: "Remind customers to visit when they're nearby." },
        { icon: <LayoutDashboard className="w-6 h-6" />, title: "Simple Dashboard", desc: "Track your loyalty program's performance easily." },
        { icon: <Users className="w-6 h-6" />, title: "Customer Data", desc: "Understand customer behavior and boost sales." },
        { icon: <Target className="w-6 h-6" />, title: "Marketing Campaigns", desc: "Send special offers directly to their phones." }
      ]
    },
    mockup: {
      title: "Your Card in Their Wallet",
      walletTitle: "Wallet",
      vipPass: "VIP Pass",
      businessName: "Coffee Roasters",
      rewardText: "Get a free coffee after 10 cups",
      points: "Points",
      mostPopular: "Most Popular"
    },
    pricing: {
      title: "One Plan. No Surprises.",
      price: "75 SAR",
      period: "/ month",
      priceNote: "(≈ $20 USD)",
      desc: "No contracts. No hidden fees. Cancel anytime. Free 7-day trial.",
      features: [
        "Unlimited customers",
        "Unlimited points & rewards",
        "Custom branded card design",
        "Analytics dashboard & reports",
        "24/7 WhatsApp support"
      ],
      cta: "Start Your Free Trial"
    },
    cta: {
      title: "Make your customers come back — start today",
      desc: "Join 347+ shop owners already building customer loyalty with Niqaty.",
      placeholder: "WhatsApp number or email",
      button: "Join Now",
      whatsappCta: "Chat on WhatsApp",
      success: "Successfully joined! We'll reach out via WhatsApp soon 🎉"
    },
    footer: "© 2025 Niqaty. Made in Saudi Arabia 🇸🇦"
  }
};

const UseIntersectionObserver = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-up');
          entry.target.classList.remove('opacity-0');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
};

// CountUp hook
const useCountUp = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration, isVisible]);

  return { count, ref };
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

export default function ClassicPremium() {
  const [lang, setLang] = useState<Language>('ar');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [activeStamps, setActiveStamps] = useState(7);
  
  const isRtl = lang === 'ar';
  const t = CONTENT[lang];
  
  UseIntersectionObserver();

  // Stats count up integration
  const setupCount = useCountUp(t.stats.setup.value);
  const hardwareCount = useCountUp(t.stats.hardware.value);
  const customersCount = useCountUp(t.stats.customers.value);
  const priceCount = useCountUp(t.stats.price.value);

  // Stamp animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStamps(prev => {
        if (prev >= 10) return 0;
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleLang = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setEmail('');
    }
  };

  const fontClasses = isRtl 
    ? 'font-["Tajawal"]' 
    : 'font-["DM_Sans"]';
    
  const headingFontClasses = isRtl 
    ? 'font-["Cairo"]' 
    : 'font-["Playfair_Display"]';

  return (
    <div 
      className={`min-h-screen bg-[#FDFAF3] text-[#0D1F15] bg-islamic-pattern ${fontClasses} transition-all duration-300 overflow-x-hidden`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* 1. Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-[#FDFAF3]/90 backdrop-blur-md z-50 border-b border-[#C8922A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className={`text-2xl font-bold text-[#0A6C3B] ${headingFontClasses}`}>
            {t.nav.logo}
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={handleToggleLang}
              className="text-sm font-medium hover:text-[#0A6C3B] transition-colors flex items-center gap-1"
            >
              {t.nav.langToggle}
            </button>
            <button className="hidden sm:block text-sm font-medium hover:text-[#0A6C3B] transition-colors">
              {t.nav.login}
            </button>
            <button className="bg-[#0A6C3B] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#085a31] transition-colors shadow-lg shadow-[#0A6C3B]/20">
              {t.nav.cta}
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero */}
      <section className="pt-40 pb-20 px-4 relative overflow-hidden flex flex-col items-center text-center max-w-5xl mx-auto reveal opacity-0">
        <div className="absolute top-32 left-10 md:left-20 bg-white px-4 py-2 rounded-full shadow-xl text-sm md:text-base border border-[#C8922A]/30 animate-float z-10 hidden sm:block">
          {t.hero.badge1}
        </div>
        <div className="absolute top-48 right-10 md:right-20 bg-white px-4 py-2 rounded-full shadow-xl text-sm md:text-base border border-[#C8922A]/30 animate-float-delayed z-10 hidden sm:block">
          {t.hero.badge2}
        </div>

        <h1 className={`text-5xl md:text-7xl font-bold text-[#0D1F15] mb-6 leading-tight ${headingFontClasses}`}>
          {t.hero.headline}
        </h1>
        <p className="text-lg md:text-xl text-[#0D1F15]/70 max-w-2xl mb-10">
          {t.hero.subhead}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button className="bg-[#0A6C3B] text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#085a31] transition-all shadow-xl shadow-[#0A6C3B]/30 hover:scale-105">
            {t.hero.ctaPrimary}
          </button>
          <button className="bg-white text-[#0A6C3B] px-8 py-4 rounded-full text-lg font-semibold border-2 border-[#0A6C3B] hover:bg-[#0A6C3B]/5 transition-all">
            {t.hero.ctaSecondary}
          </button>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="py-6 px-4 reveal opacity-0">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0A6C3B] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0A6C3B]"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#0A6C3B]">{t.socialProof.live}</span>
          </div>
          <div className="flex items-center gap-2 text-[#0D1F15]">
            <span className={`text-2xl font-bold text-[#0A6C3B] ${headingFontClasses}`}>
              <SocialProofCounter target={347} isArabic={isRtl} />+
            </span>
            <span className="text-sm font-medium">{t.socialProof.text}</span>
          </div>
          <span className="text-sm text-[#0D1F15]/50 font-medium">{t.socialProof.cities}</span>
        </div>
      </section>

      {/* 3. Marquee */}
      <div className="w-full overflow-hidden bg-[#0A6C3B] text-[#C8922A] py-4 reveal opacity-0 border-y border-[#C8922A]/30">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...t.marquee, ...t.marquee, ...t.marquee].map((item, i) => (
            <span key={i} className="mx-8 text-lg font-medium">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* 4. Stats */}
      <section className="py-20 bg-[#FDFAF3] px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 reveal opacity-0">
          <div ref={setupCount.ref} className="text-center p-6 border border-[#C8922A]/20 rounded-2xl bg-white shadow-sm hover:border-[#0A6C3B] transition-colors">
            <div className={`text-4xl md:text-5xl font-bold text-[#0A6C3B] mb-2 ${headingFontClasses}`}>
              {setupCount.count}{t.stats.setup.suffix}
            </div>
            <div className="text-sm text-[#0D1F15]/60 font-medium uppercase tracking-wider">
              {t.stats.setup.label}
            </div>
          </div>
          <div ref={hardwareCount.ref} className="text-center p-6 border border-[#C8922A]/20 rounded-2xl bg-white shadow-sm hover:border-[#0A6C3B] transition-colors">
            <div className={`text-4xl md:text-5xl font-bold text-[#0A6C3B] mb-2 ${headingFontClasses}`}>
              {hardwareCount.count}{t.stats.hardware.suffix}
            </div>
            <div className="text-sm text-[#0D1F15]/60 font-medium uppercase tracking-wider">
              {t.stats.hardware.label}
            </div>
          </div>
          <div ref={customersCount.ref} className="text-center p-6 border border-[#C8922A]/20 rounded-2xl bg-white shadow-sm hover:border-[#0A6C3B] transition-colors">
            <div className={`text-4xl md:text-5xl font-bold text-[#0A6C3B] mb-2 ${headingFontClasses}`}>
              {customersCount.count}{t.stats.customers.suffix}
            </div>
            <div className="text-sm text-[#0D1F15]/60 font-medium uppercase tracking-wider">
              {t.stats.customers.label}
            </div>
          </div>
          <div ref={priceCount.ref} className="text-center p-6 border border-[#C8922A]/20 rounded-2xl bg-white shadow-sm hover:border-[#0A6C3B] transition-colors">
            <div className={`text-4xl md:text-5xl font-bold text-[#0A6C3B] mb-2 ${headingFontClasses}`}>
              {priceCount.count}{t.stats.price.suffix}
            </div>
            <div className="text-sm text-[#0D1F15]/60 font-medium uppercase tracking-wider">
              {t.stats.price.label}
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section className="py-24 px-4 bg-white border-y border-[#C8922A]/10">
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-4xl md:text-5xl font-bold text-center mb-20 ${headingFontClasses} reveal opacity-0`}>
            {t.howItWorks.title}
          </h2>
          <div className="space-y-12 md:space-y-0 relative">
            {/* Desktop Connector Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-[#C8922A]/20 -translate-x-1/2"></div>
            
            {t.howItWorks.steps.map((step, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div key={idx} className={`relative flex flex-col md:flex-row items-center gap-8 reveal opacity-0 delay-${(idx % 3) * 100}`}>
                  <div className={`md:w-1/2 w-full flex ${isEven ? 'md:justify-end' : 'md:justify-start md:order-2'}`}>
                    <div className="bg-[#FDFAF3] p-8 rounded-2xl border border-[#C8922A]/30 w-full md:w-5/6 hover:-translate-y-2 hover:border-[#0A6C3B] transition-all duration-300 shadow-lg hover:shadow-xl group">
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{step.icon}</div>
                      <h3 className={`text-xl font-bold mb-2 ${headingFontClasses}`}>{step.title}</h3>
                      <p className="text-[#0D1F15]/70">{step.desc}</p>
                    </div>
                  </div>
                  {/* Circle on line */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-[#0A6C3B] rounded-full border-4 border-white items-center justify-center text-white font-bold z-10 shadow-md">
                    {idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Business Types Grid */}
      <section className="py-24 px-4 bg-[#0D1F15] text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className={`text-4xl md:text-5xl font-bold text-center mb-16 text-[#C8922A] ${headingFontClasses} reveal opacity-0`}>
            {t.businessTypes.title}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {t.businessTypes.types.map((type, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-[#0A6C3B] hover:border-[#0A6C3B] transition-all duration-300 cursor-default reveal opacity-0 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{type.icon}</div>
                <div className="font-medium text-lg">{type.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Features Grid */}
      <section className="py-24 px-4 bg-[#FDFAF3]">
        <div className="max-w-7xl mx-auto">
          <h2 className={`text-4xl md:text-5xl font-bold text-center mb-16 text-[#0D1F15] ${headingFontClasses} reveal opacity-0`}>
            {t.features.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.features.items.map((item, idx) => (
              <div key={idx} className={`bg-white p-8 rounded-2xl border border-[#C8922A]/20 hover:border-[#0A6C3B] transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-md reveal opacity-0 delay-${(idx % 3) * 100}`}>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0A6C3B] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="w-14 h-14 bg-[#FDFAF3] rounded-xl flex items-center justify-center text-[#0A6C3B] mb-6 border border-[#C8922A]/30 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className={`text-xl font-bold mb-3 ${headingFontClasses}`}>{item.title}</h3>
                <p className="text-[#0D1F15]/70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Phone Mockup */}
      <section className="py-24 px-4 bg-white overflow-hidden border-y border-[#C8922A]/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2 reveal opacity-0">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${headingFontClasses}`}>
              {t.mockup.title}
            </h2>
            <p className="text-xl text-[#0D1F15]/70 mb-8">
              {t.hero.subhead}
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 text-[#0A6C3B] font-medium text-lg">
                <CheckCircle2 className="w-6 h-6" />
                <span>{t.features.items[0].title}</span>
              </div>
              <div className="flex items-center gap-4 text-[#0A6C3B] font-medium text-lg">
                <CheckCircle2 className="w-6 h-6" />
                <span>{t.features.items[1].title}</span>
              </div>
              <div className="flex items-center gap-4 text-[#0A6C3B] font-medium text-lg">
                <CheckCircle2 className="w-6 h-6" />
                <span>{t.features.items[2].title}</span>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center reveal opacity-0 delay-200">
            {/* Phone Frame */}
            <div className="relative w-[300px] h-[600px] bg-black rounded-[48px] p-4 shadow-2xl shadow-[#0A6C3B]/20 border-[8px] border-black">
              {/* Screen */}
              <div className="bg-[#f0f0f0] w-full h-full rounded-[32px] overflow-hidden flex flex-col pt-12">
                {/* Dynamic Island / Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-full z-20"></div>
                
                {/* Wallet App Header */}
                <div className="px-6 pb-4 pt-2 flex justify-between items-center">
                  <div className="text-2xl font-semibold text-black">{t.mockup.walletTitle}</div>
                  <div className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-black rounded-full"></div>
                  </div>
                </div>

                {/* The Pass */}
                <div className="mx-4 bg-gradient-to-br from-[#0A6C3B] to-[#0D1F15] rounded-2xl p-6 text-white shadow-xl relative mt-2 flex-1 mb-8 overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23C8922A\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E')] opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                      <div className="text-sm opacity-80 uppercase tracking-widest mb-1">{t.mockup.businessName}</div>
                      <div className={`text-2xl font-bold ${headingFontClasses}`}>{t.mockup.vipPass}</div>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Star className="w-5 h-5 text-[#C8922A] fill-[#C8922A]" />
                    </div>
                  </div>

                  <div className="mb-8 relative z-10">
                    <div className="text-sm opacity-80 mb-3">{t.mockup.points} ({activeStamps}/10)</div>
                    <div className="flex flex-wrap gap-2" dir="ltr">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="w-[30px] h-[30px] rounded-full border-2 border-[#C8922A]/30 flex items-center justify-center relative overflow-hidden bg-black/10">
                          {i < activeStamps && (
                            <div className="absolute inset-0 bg-[#C8922A] flex items-center justify-center stamp-active">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-xl p-4 mt-auto backdrop-blur-sm relative z-10">
                    <div className="text-sm text-center opacity-90">{t.mockup.rewardText}</div>
                  </div>

                  {/* Faux Barcode */}
                  <div className="mt-8 bg-white p-3 rounded-lg flex justify-center relative z-10">
                    <QrCode className="w-24 h-24 text-black" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Pricing */}
      <section className="py-24 px-4 bg-[#FDFAF3] border-y border-[#C8922A]/10">
        <div className="max-w-xl mx-auto text-center reveal opacity-0">
          <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${headingFontClasses}`}>
            {t.pricing.title}
          </h2>
          <p className="text-lg text-[#0D1F15]/70 mb-12">
            {t.pricing.desc}
          </p>

          <div className="bg-white border-2 border-[#C8922A] rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#C8922A] text-white px-4 py-1 rounded-bl-xl text-sm font-bold uppercase tracking-wider">
              {t.mockup.mostPopular}
            </div>
            <div className="flex flex-col items-center mb-6">
              <div className="flex items-center justify-center gap-2">
                <span className={`text-6xl font-bold text-[#0A6C3B] ${headingFontClasses}`}>{t.pricing.price}</span>
                <span className="text-xl text-[#0D1F15]/60 mt-4">{t.pricing.period}</span>
              </div>
              <span className="text-sm text-[#0D1F15]/40 mt-1">{t.pricing.priceNote}</span>
            </div>
            
            <div className="space-y-4 mb-8 text-left" dir={isRtl ? 'rtl' : 'ltr'}>
              {t.pricing.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#0A6C3B] shrink-0" />
                  <span className="text-lg text-[#0D1F15]/80">{feat}</span>
                </div>
              ))}
            </div>

            <button className="w-full bg-[#0A6C3B] text-white py-4 rounded-xl text-xl font-bold hover:bg-[#085a31] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
              {t.pricing.cta}
            </button>
          </div>
        </div>
      </section>

      {/* 10. CTA / Waitlist */}
      <section className="py-24 px-4 bg-[#0A6C3B] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23C8922A\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M30 0l30 30-30 30L0 30zM15 15l15 15-15 15L0 30zM45 15l15 15-15 15L30 30zM30 15l15 15-15 15-15-15z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        <div className="max-w-2xl mx-auto reveal opacity-0 relative z-10">
          <h2 className={`text-4xl md:text-5xl font-bold mb-6 text-[#C8922A] ${headingFontClasses}`}>
            {t.cta.title}
          </h2>
          <p className="text-xl mb-10 opacity-90">
            {t.cta.desc}
          </p>

          {submitted ? (
            <div className="bg-white/10 border border-white/20 p-6 rounded-2xl flex items-center justify-center gap-3 animate-fade-up">
              <CheckCircle2 className="w-8 h-8 text-[#C8922A]" />
              <span className="text-xl font-medium">{t.cta.success}</span>
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.cta.placeholder}
                  className="flex-1 px-6 py-4 rounded-xl text-[#0D1F15] text-lg focus:outline-none focus:ring-4 focus:ring-[#C8922A]/50 bg-white"
                />
                <button 
                  type="submit"
                  className="bg-[#C8922A] text-[#0D1F15] px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#d4a03b] transition-all whitespace-nowrap shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  {t.cta.button}
                </button>
              </form>
              <div className="flex items-center justify-center gap-3">
                <div className="h-px bg-white/20 flex-1"></div>
                <span className="text-white/50 text-sm">{isRtl ? 'أو' : 'or'}</span>
                <div className="h-px bg-white/20 flex-1"></div>
              </div>
              <a 
                href="https://wa.me/966500000000" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#20bd5a] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 w-full sm:w-auto"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                {t.cta.whatsappCta}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D1F15] py-8 text-center text-white/50 border-t border-white/10">
        <p>{t.footer}</p>
      </footer>
    </div>
  );
}
