import React, { useEffect, useState } from 'react';
import { ArrowLeft, Coffee, Scissors, Dumbbell, Store, MapPin, Sparkles } from 'lucide-react';

export function ProofWall() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div 
      dir="rtl"
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-sans bg-[#0D1F15] text-[#FDFAF3]"
    >
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0A6C3B]/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#C8922A]/10 rounded-full blur-[100px]" />
      </div>

      {/* City Pills scattered absolutely */}
      <div className={`absolute top-[15%] right-[10%] md:right-[20%] z-10 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex items-center gap-2 bg-[#FDFAF3]/5 backdrop-blur-md border border-[#FDFAF3]/10 rounded-full px-5 py-2.5 text-[#FDFAF3] text-sm md:text-lg font-bold shadow-lg">
          <MapPin size={18} className="text-[#C8922A]" />
          <span>الرياض</span>
        </div>
      </div>
      <div className={`absolute top-[35%] left-[5%] md:left-[12%] z-10 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex items-center gap-2 bg-[#FDFAF3]/5 backdrop-blur-md border border-[#FDFAF3]/10 rounded-full px-5 py-2.5 text-[#FDFAF3] text-sm md:text-lg font-bold shadow-lg">
          <MapPin size={18} className="text-[#C8922A]" />
          <span>جدة</span>
        </div>
      </div>
      <div className={`absolute bottom-[25%] left-[10%] md:left-[22%] z-10 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex items-center gap-2 bg-[#FDFAF3]/5 backdrop-blur-md border border-[#FDFAF3]/10 rounded-full px-5 py-2.5 text-[#FDFAF3] text-sm md:text-lg font-bold shadow-lg">
          <MapPin size={18} className="text-[#C8922A]" />
          <span>الدمام</span>
        </div>
      </div>
      <div className={`absolute bottom-[40%] right-[8%] md:right-[15%] z-10 transition-all duration-1000 delay-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex items-center gap-2 bg-[#FDFAF3]/5 backdrop-blur-md border border-[#FDFAF3]/10 rounded-full px-5 py-2.5 text-[#FDFAF3] text-sm md:text-lg font-bold shadow-lg">
          <Sparkles size={18} className="text-[#C8922A]" />
          <span>مكة المكرمة</span>
        </div>
      </div>

      <div className="relative z-20 flex flex-col items-center justify-center w-full px-4 max-w-7xl mx-auto h-full flex-1 pt-12 md:pt-20">
        
        {/* The Giant Number - dominates ~60% height */}
        <div className="relative flex justify-center items-center h-[50vh] sm:h-[55vh] md:h-[60vh] w-full mb-0 md:mb-8">
          {/* Outline layer */}
          <h1 
            className={`font-black text-[12rem] sm:text-[18rem] md:text-[24rem] lg:text-[32rem] leading-none tracking-tighter transition-all duration-[1500ms] ease-out transform ${mounted ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
            style={{ 
              WebkitTextStroke: '4px #0A6C3B',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ٣٤٧+
          </h1>
          {/* Fill layer for subtle depth */}
          <h1 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-[12rem] sm:text-[18rem] md:text-[24rem] lg:text-[32rem] leading-none tracking-tighter transition-all duration-[1500ms] ease-out transform ${mounted ? 'scale-100 opacity-100' : 'scale-90 opacity-0'} text-[#0A6C3B]/10`}
          >
            ٣٤٧+
          </h1>
        </div>

        {/* Content overlapping the bottom of the number */}
        <div className="flex flex-col items-center -mt-24 sm:-mt-32 md:-mt-40 z-30">
          <h2 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-8 md:mb-12 text-center text-[#FDFAF3] transition-all duration-1000 delay-300 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`} style={{ textShadow: '0 4px 24px rgba(13, 31, 21, 0.9)' }}>
            صاحب محل <span className="text-[#C8922A]">انضموا قبلك</span>
          </h2>

          {/* Badges/Avatars Grid */}
          <div className={`flex flex-wrap justify-center gap-3 md:gap-5 mb-12 md:mb-16 max-w-4xl transition-all duration-1000 delay-500 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            {[
              { icon: Coffee, text: 'مقهى' },
              { icon: Scissors, text: 'صالون' },
              { icon: Store, text: 'مطعم' },
              { icon: Dumbbell, text: 'نادي رياضي' },
              { icon: Store, text: 'متجر تجزئة' }
            ].map((item, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 bg-[#0D1F15] text-[#FDFAF3] px-6 py-3 md:px-8 md:py-4 rounded-none font-bold text-lg md:text-xl border-2 border-[#0A6C3B] hover:bg-[#0A6C3B] transition-colors shadow-[4px_4px_0px_#0A6C3B] hover:shadow-[6px_6px_0px_#C8922A] hover:-translate-y-1 hover:border-[#C8922A]"
              >
                <item.icon size={24} className="hidden sm:block text-[#C8922A]" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button positioned within the proof */}
          <div className={`transition-all duration-1000 delay-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} flex flex-col items-center`}>
            <button className="group relative flex items-center justify-center gap-4 bg-[#C8922A] text-[#0D1F15] px-10 py-5 md:px-14 md:py-6 rounded-none text-2xl md:text-3xl font-black hover:bg-[#FDFAF3] transition-all border-4 border-[#C8922A] hover:border-[#FDFAF3] shadow-[8px_8px_0px_#0A6C3B] hover:-translate-y-1 hover:shadow-[12px_12px_0px_#0A6C3B] active:translate-y-1 active:shadow-[4px_4px_0px_#0A6C3B]">
              <span>احجز مكاني — مجاناً</span>
              <ArrowLeft className="w-8 h-8 group-hover:-translate-x-2 transition-transform" />
            </button>
            <p className="mt-6 text-[#FDFAF3]/60 font-medium text-lg tracking-wide">
              لا يتطلب تطبيق • ٧٥ ريال / شهرياً • الإعداد في ٧ دقائق
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
