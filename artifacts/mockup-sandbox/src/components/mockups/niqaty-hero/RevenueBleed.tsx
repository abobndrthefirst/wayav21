import React, { useState, useEffect, useRef } from 'react';
import { Check, X, ArrowLeft, ArrowDown } from 'lucide-react';

const HandDrawnArrow = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 50 Q40 10 90 40 M70 20 Q85 35 90 40 Q75 55 60 60" />
  </svg>
);

const customers = [
  { id: 1, amount: 45, time: "٠٨:٣٠ ص" },
  { id: 2, amount: 60, time: "٠٩:١٥ ص" },
  { id: 3, amount: 35, time: "١٠:٤٠ ص" },
  { id: 4, amount: 85, time: "١٢:٢٠ م" },
  { id: 5, amount: 40, time: "٠١:١٠ م" },
  { id: 6, amount: 55, time: "٠٢:٤٥ م" },
];

export function RevenueBleed() {
  const [visibleRows, setVisibleRows] = useState<number>(0);
  const [lostRevenue, setLostRevenue] = useState(0);

  useEffect(() => {
    if (visibleRows < customers.length) {
      const timer = setTimeout(() => {
        setVisibleRows(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [visibleRows]);

  useEffect(() => {
    const total = customers.slice(0, visibleRows).reduce((acc, curr) => acc + curr.amount, 0);
    let start = lostRevenue;
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(start + (total - start) * progress);
      setLostRevenue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [visibleRows]);

  const toArabicNumerals = (n: number | string) => {
    return n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
  };

  return (
    <div className="min-h-[100vh] w-full bg-[#FDFAF3] text-[#0D1F15] overflow-hidden flex items-center justify-center font-['Tajawal',sans-serif]" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        
        {/* Right Side (Headline and CTA in RTL) */}
        <div className="space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#fee2e2] text-[#b91c1c] px-4 py-2 rounded-full font-bold text-sm border-2 border-[#b91c1c] shadow-[3px_3px_0px_#b91c1c] transform -rotate-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b91c1c] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#dc2626]"></span>
            </span>
            تنزف إيراداتك بصمت
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight text-[#0D1F15]">
            كم عميل <span className="text-[#b91c1c] relative inline-block">
              خسرت
              <svg className="absolute w-full h-4 -bottom-1 left-0 text-[#b91c1c]" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0 10 Q25 20 50 10 T100 10" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span> هذا الأسبوع؟
          </h1>

          <p className="text-xl md:text-2xl text-[#0D1F15]/80 max-w-lg leading-relaxed font-semibold">
            عملاؤك يدفعون ويمشون، ولا يملكون سبباً للعودة. أوقف هذا النزيف اليوم ببرنامج ولاء ذكي يعمل بدون تطبيقات معقدة.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
            <button className="w-full sm:w-auto bg-[#0A6C3B] text-white px-8 py-4 text-xl font-bold rounded-lg border-4 border-[#0D1F15] shadow-[6px_6px_0px_#0D1F15] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_#0D1F15] transition-all">
              احجز مكاني — مجاناً
            </button>
            <span className="text-sm font-bold text-[#0D1F15]/60">٧٥ ريال/شهرياً • ٧ دقائق للإعداد</span>
          </div>
        </div>

        {/* Left Side (Ledger / Visual in RTL) */}
        <div className="relative w-full max-w-md mx-auto lg:mx-0 z-10">
          {/* Annotation */}
          <div className="absolute -top-12 -left-8 md:-left-16 rotate-12 flex flex-col items-center animate-bounce-slow">
            <span className="text-[#C8922A] font-bold text-lg md:text-xl whitespace-nowrap bg-[#FDFAF3] px-2">عملاء لن يعودوا!</span>
            <HandDrawnArrow className="w-16 h-16 text-[#C8922A] transform rotate-90" />
          </div>

          <div className="bg-white border-4 border-[#0D1F15] shadow-[12px_12px_0px_#0D1F15] rounded-xl overflow-hidden flex flex-col">
            {/* Receipt Header */}
            <div className="bg-[#f8f9fa] border-b-4 border-[#0D1F15] p-4 text-center border-dashed">
              <h3 className="font-black text-xl tracking-widest text-[#0D1F15]">سجل الزيارات الضائعة</h3>
              <p className="text-sm font-bold text-[#0D1F15]/60 mt-1 font-mono">{toArabicNumerals("2023-10-24")}</p>
            </div>

            {/* Receipt Body */}
            <div className="p-4 space-y-3 font-mono">
              <div className="grid grid-cols-4 gap-2 text-xs font-bold text-[#0D1F15]/50 border-b-2 border-[#0D1F15]/10 pb-2 mb-2">
                <div className="col-span-1">الوقت</div>
                <div className="col-span-1 text-center">القيمة</div>
                <div className="col-span-1 text-center">زيارة أولى</div>
                <div className="col-span-1 text-left">عاد؟</div>
              </div>

              {customers.map((customer, idx) => (
                <div 
                  key={customer.id} 
                  className={`grid grid-cols-4 gap-2 items-center text-sm md:text-base font-bold transition-all duration-500
                    ${idx < visibleRows ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  `}
                >
                  <div className="col-span-1 text-[#0D1F15]/70">{customer.time}</div>
                  <div className="col-span-1 text-center">{toArabicNumerals(customer.amount)} ر.س</div>
                  <div className="col-span-1 flex justify-center text-[#0A6C3B]">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div className="col-span-1 flex justify-end text-[#b91c1c]">
                    <X className="w-5 h-5 stroke-[3]" />
                  </div>
                </div>
              ))}

              {/* Blurry empty rows to hint at more */}
              <div className="grid grid-cols-4 gap-2 items-center text-sm md:text-base font-bold opacity-30 blur-[1px]">
                <div className="col-span-1 text-[#0D1F15]/70">٠٣:١٥ م</div>
                <div className="col-span-1 text-center">٤٠ ر.س</div>
                <div className="col-span-1 flex justify-center text-[#0A6C3B]"><Check className="w-5 h-5" /></div>
                <div className="col-span-1 flex justify-end text-[#b91c1c]"><X className="w-5 h-5" /></div>
              </div>
              <div className="grid grid-cols-4 gap-2 items-center text-sm md:text-base font-bold opacity-10 blur-[2px]">
                <div className="col-span-1 text-[#0D1F15]/70">٠٤:٠٠ م</div>
                <div className="col-span-1 text-center">٩٥ ر.س</div>
                <div className="col-span-1 flex justify-center text-[#0A6C3B]"><Check className="w-5 h-5" /></div>
                <div className="col-span-1 flex justify-end text-[#b91c1c]"><X className="w-5 h-5" /></div>
              </div>
            </div>

            {/* Receipt Footer - Tally */}
            <div className="mt-auto bg-[#0D1F15] text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-[#b91c1c]"></div>
              <div className="flex justify-between items-end relative z-10">
                <div className="space-y-1">
                  <p className="text-[#FDFAF3]/70 font-bold text-sm">خسائر اليوم (تقديرية)</p>
                  <p className="text-3xl md:text-4xl font-black text-[#b91c1c]">
                    {toArabicNumerals(lostRevenue)} <span className="text-lg">ر.س</span>
                  </p>
                </div>
                <div className="animate-pulse bg-[#b91c1c]/20 p-2 rounded-lg border border-[#b91c1c]/50">
                  <ArrowDown className="w-6 h-6 text-[#b91c1c]" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute -z-10 -bottom-8 -right-8 w-32 h-32 bg-[#C8922A] rounded-full mix-blend-multiply opacity-20 blur-xl"></div>
          <div className="absolute -z-10 -top-8 -left-8 w-40 h-40 bg-[#0A6C3B] rounded-full mix-blend-multiply opacity-10 blur-xl"></div>
        </div>

      </div>
    </div>
  );
}
