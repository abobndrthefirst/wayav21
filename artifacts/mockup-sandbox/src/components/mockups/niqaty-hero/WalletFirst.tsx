import React from 'react';
import { Check, ArrowRight, ArrowDownRight, ArrowUpRight, ArrowLeft } from 'lucide-react';

const HandDrawnArrow1 = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 90 Q 40 50 90 10" />
    <path d="M70 10 L 90 10 L 90 30" />
  </svg>
);

const HandDrawnArrow2 = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M90 90 Q 50 50 10 10" />
    <path d="M30 10 L 10 10 L 10 30" />
  </svg>
);

const HandDrawnArrow3 = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 10 Q 50 50 90 90" />
    <path d="M70 90 L 90 90 L 90 70" />
  </svg>
);

export function WalletFirst() {
  return (
    <div 
      className="relative min-h-screen flex flex-col items-center justify-center bg-[#FDFAF3] font-['Tajawal',sans-serif] overflow-hidden"
      dir="rtl"
    >
      {/* Background blobs for depth */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#E8F5E9] rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#FFF8E1] rounded-full blur-3xl opacity-60"></div>

      <div className="w-full max-w-6xl px-6 py-20 flex flex-col items-center z-10 relative">
        
        {/* Title / Intro */}
        <div className="text-center mb-16 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-black text-[#0D1F15] mb-6 leading-tight">
            برنامج ولاء <span className="text-[#0A6C3B]">بمحفظة الجوال</span>
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            امنح عملاءك تجربة ولاء عصرية دون الحاجة لتحميل أي تطبيقات.
          </p>
        </div>

        {/* Hero Central Area: Wallet Card + Annotations */}
        <div className="relative w-full max-w-4xl flex justify-center mb-16">
          
          {/* Card Container */}
          <div className="relative w-full max-w-sm shrink-0">
            {/* The Wallet Card */}
            <div className="relative bg-gradient-to-br from-[#0A6C3B] to-[#0D1F15] rounded-[2rem] shadow-2xl p-8 text-white overflow-hidden transform hover:-translate-y-2 transition-transform duration-500 border border-white/10">
              
              {/* Wallet Header Punch hole (Mocking iOS wallet style) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#FDFAF3] rounded-b-2xl"></div>

              {/* Card Header */}
              <div className="flex justify-between items-start mt-4 mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden">
                    <span className="text-2xl" role="img" aria-label="coffee">☕</span>
                  </div>
                  <div>
                    <h3 className="font-black text-xl tracking-tight">مقهى أبو سعود</h3>
                    <p className="text-sm text-white/70">بطاقة ولاء</p>
                  </div>
                </div>
                {/* Points count badge */}
                <div className="bg-[#C8922A] px-3 py-1 rounded-full text-xs font-bold text-[#0D1F15] shadow-md">
                  ٨ / ١٠ نقاط
                </div>
              </div>

              {/* Stamps Grid */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/5 shadow-inner">
                <div className="grid grid-cols-5 gap-3">
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`aspect-square rounded-full flex items-center justify-center border-2 transition-all ${
                        i < 8 
                          ? 'bg-[#C8922A] border-[#C8922A] text-[#0D1F15] shadow-[0_0_10px_rgba(200,146,42,0.5)]' 
                          : 'bg-transparent border-white/20 text-transparent'
                      }`}
                    >
                      {i < 8 ? <Check className="w-5 h-5 font-bold" strokeWidth={3} /> : null}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-sm text-white/70 mb-1">المكافأة القادمة</div>
                  <div className="font-bold text-lg text-[#C8922A]">قهوة مجانية 🎁</div>
                </div>
                {/* Niqaty branding small */}
                <div className="text-xs text-white/50 font-bold uppercase tracking-wider flex items-center gap-1 opacity-80">
                  <span className="w-4 h-4 rounded-full bg-white/20 inline-block"></span>
                  نقاطي
                </div>
              </div>
            </div>

            {/* Floating Notifications (Proof elements overlapping the card) */}
            <div className="absolute -right-12 top-24 bg-white rounded-2xl p-3 shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="bg-[#E8F5E9] w-8 h-8 rounded-full flex items-center justify-center text-[#0A6C3B]">
                <Check className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-[#0D1F15]">تم إضافة نقطة</span>
            </div>

          </div>

          {/* Annotations (Desktop Only) */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none">
            {/* Annotation 1: No app */}
            <div className="absolute top-[10%] right-[5%] flex flex-col items-end">
              <span className="font-black text-xl text-[#0A6C3B] bg-white px-4 py-2 rounded-xl shadow-lg border-2 border-[#0A6C3B] rotate-2">
                بدون تطبيق
              </span>
              <HandDrawnArrow2 className="w-16 h-16 text-[#0D1F15] mt-2 mr-10" />
            </div>

            {/* Annotation 2: Add to wallet */}
            <div className="absolute top-[30%] left-[0%] flex flex-col items-start">
              <span className="font-black text-xl text-[#C8922A] bg-[#0D1F15] px-4 py-2 rounded-xl shadow-lg -rotate-3">
                يُضاف لمحفظة الجوال
              </span>
              <HandDrawnArrow1 className="w-16 h-16 text-[#C8922A] mt-2 ml-12 scale-x-[-1]" />
            </div>

            {/* Annotation 3: 7 mins to setup */}
            <div className="absolute bottom-[20%] right-[0%] flex flex-col items-end">
              <HandDrawnArrow3 className="w-16 h-16 text-[#0D1F15] mb-2 mr-16" />
              <span className="font-black text-xl text-[#0D1F15] bg-[#FFF8E1] px-4 py-2 rounded-xl shadow-lg border-2 border-[#C8922A] -rotate-2">
                ٧ دقائق للإعداد
              </span>
            </div>
          </div>
          
        </div>

        {/* Bottom CTA Area */}
        <div className="text-center w-full max-w-md relative z-20">
          <button className="w-full bg-[#0A6C3B] text-white text-xl font-black py-5 px-8 rounded-2xl hover:bg-[#08552e] transition-all transform hover:-translate-y-1 shadow-[0_8px_0px_#0D1F15] border-2 border-[#0D1F15] active:translate-y-2 active:shadow-none flex items-center justify-center gap-3">
            احجز مكاني — مجاناً
            <ArrowLeft className="w-6 h-6" strokeWidth={3} />
          </button>
          <p className="mt-6 text-[#0D1F15] font-bold text-sm">
            ٧٥ ريال/شهرياً • بدون عقود • جاهز في دقائق
          </p>
        </div>

      </div>
    </div>
  );
}
