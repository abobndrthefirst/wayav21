const fs = require('fs');

let content = fs.readFileSync('artifacts/niqaty/src/pages/Home.tsx', 'utf-8');

// 1. Base colors replacement
content = content.replace(/#FDFAF3/g, '#FCF0DC'); // Page bg
content = content.replace(/#FFF8E1/g, '#FFF6E8'); // Surface cards
content = content.replace(/#E8F5E9/g, '#FFF6E8'); // Surface cards
content = content.replace(/bg-white/g, 'bg-[#FFF6E8]'); // Surface cards
content = content.replace(/text-white/g, 'text-[#FCF0DC]'); // Text on dark
content = content.replace(/#0D1F15/g, '#2B1708'); // Dark sections / headings
content = content.replace(/#0A6C3B/g, '#C05C30'); // Primary
content = content.replace(/#C8922A/g, '#D4963B'); // Accent

// Fix border classes globally
content = content.replace(/border-4/g, 'border-[3px]');
content = content.replace(/border-2/g, 'border-[3px]');
content = content.replace(/border-y-4/g, 'border-y-[3px]');
content = content.replace(/border-t-8/g, 'border-t-[3px]');
content = content.replace(/border-b-4/g, 'border-b-[3px]');

// Fix body text
content = content.replace(/text-\[#2B1708\] max-w-xl/g, 'text-[#4A2E18] max-w-xl');
content = content.replace(/<p className="([^"]*)text-\[#2B1708\]([^"]*)"/g, '<p className="$1text-[#4A2E18]$2"');

// Fix secondary CTA
content = content.replace(
  /bg-\[#FFF6E8\] text-\[#2B1708\] border-\[3px\] border-\[#2B1708\] px-6 sm:px-8 py-4 sm:py-5 text-lg sm:text-xl font-bold hover:bg-\[#FFF6E8\] transition-all transform hover:-translate-y-2 hover:-rotate-2 shadow-\[8px_8px_0px_#2B1708\] relative/g,
  'bg-transparent text-[#C05C30] border-[2px] border-[#C05C30] px-6 sm:px-8 py-4 sm:py-5 text-lg sm:text-xl font-bold hover:bg-[#FFF6E8] transition-all transform hover:-translate-y-2 hover:-rotate-2 shadow-[8px_8px_0px_#2B1708] relative'
);

// Marquee
// original before replacement: bg-[#C8922A] ... text-[#0D1F15] ... text-white
// after generic replacement: bg-[#D4963B] ... text-[#2B1708] ... text-[#FCF0DC]
// we want: bg-[#2B1708] text-[#D4963B] text-[#D4963B]
content = content.replace(
  /<section className="bg-\[#D4963B\] py-4 sm:py-6 border-y-\[3px\] border-\[#2B1708\] overflow-hidden whitespace-nowrap flex relative z-20 transform -rotate-1 origin-left w-\[105vw\] -ml-\[2vw\]">/g,
  '<section className="bg-[#2B1708] py-4 sm:py-6 border-y-[3px] border-[#2B1708] overflow-hidden whitespace-nowrap flex relative z-20 transform -rotate-1 origin-left w-[105vw] -ml-[2vw]">'
);
content = content.replace(
  /className="animate-marquee flex gap-6 sm:gap-8 text-\[#2B1708\]/g,
  'className="animate-marquee flex gap-6 sm:gap-8 text-[#D4963B]'
);
// Marquee items
// Original after gen replace: <span className="bg-[#FFF6E8] px-3 sm:px-4 py-1 border-[3px] border-[#2B1708] rounded-full shadow-[4px_4px_0px_#2B1708] transform hover:rotate-3 transition-transform">{item}</span>
// <HandDrawnStar className="w-6 sm:w-8 h-6 sm:h-8 text-[#FCF0DC]" />
// Change star to text-[#D4963B] inside Marquee loop
content = content.replace(
  /<HandDrawnStar className="w-6 sm:w-8 h-6 sm:h-8 text-\[#FCF0DC\]" \/>/g,
  '<HandDrawnStar className="w-6 sm:w-8 h-6 sm:h-8 text-[#D4963B]" />'
);

// Add imports and change name
content = content.replace(/export default function Home/g, 'export default function WarmSouq');
content = content.replace(/import \{/g, "import './_group.css';\nimport {");

// Adjust CTA primary text specifically if needed:
// Wait, CTA primary on generic replacement: bg-[#C05C30] text-[#FCF0DC]
// This matches requirement: "CTA primary: bg #C05C30, text #FCF0DC"

// Adjust waitlist section WhatsApp text color
content = content.replace(/text-\[#2B1708\]\/70/g, 'text-[#4A2E18]');

// Make sure that the file writes properly
fs.writeFileSync('artifacts/mockup-sandbox/src/components/mockups/niqaty-landing/WarmSouq.tsx', content);

console.log("Transformation complete.");