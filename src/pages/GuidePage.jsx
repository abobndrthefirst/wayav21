// Staff training guide — printable one-pager for merchants to hand to staff.
// Supports 5 languages: English, Arabic, Urdu, Hindi, Bengali.
// User picks a language from the dropdown, then clicks "Save as PDF" which
// triggers the browser's native print dialog — that handles font rendering
// for all these scripts without any extra font bundles in our JS.
//
// Route: /guide  (opens in a new tab from the Dashboard sidebar)

import { useState } from 'react'
import wayaLogo from '../assets/waya-logo.png'

const LANGUAGES = [
  { code: 'en', label: 'English',           dir: 'ltr', font: "system-ui, -apple-system, sans-serif" },
  { code: 'ar', label: 'العربية (Arabic)',   dir: 'rtl', font: "'SF Arabic', 'Noto Naskh Arabic', system-ui, sans-serif" },
  { code: 'ur', label: 'اردو (Urdu)',        dir: 'rtl', font: "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'SF Arabic', serif" },
  { code: 'hi', label: 'हिन्दी (Hindi)',       dir: 'ltr', font: "'Noto Sans Devanagari', system-ui, sans-serif" },
  { code: 'bn', label: 'বাংলা (Bengali)',     dir: 'ltr', font: "'Noto Sans Bengali', 'Kalpurush', system-ui, sans-serif" },
]

const CONTENT = {
  en: {
    title: 'How to use Waya',
    subtitle: 'A quick guide for your staff',
    steps: [
      { h: 'Log in', b: 'Open Waya on your phone or computer. Enter the email and password the owner gave you.' },
      { h: 'Open Scan & Redeem', b: 'From the sidebar, tap "Scan & Redeem". This is where every visit is recorded.' },
      { h: 'Enter the customer\'s phone number', b: 'Enter the phone number starting with 05 (e.g. 0551234567). Their loyalty card opens automatically.' },
      { h: 'Give 1 stamp for each visit', b: 'Tap the "+ Stamp" button once per visit. Never give more than one stamp for the same visit.' },
      { h: 'Redeem a reward', b: 'When the customer has enough stamps or points, tap "Redeem" on the same screen. The reward is marked as used.' },
    ],
    footerTip: 'Tip: if a customer is new, their card is created the moment you enter their phone number for the first time.',
    printBtn: 'Save as PDF',
    langLabel: 'Language',
    noSecondary: 'None',
  },
  ar: {
    title: 'كيف تستخدم وايا',
    subtitle: 'دليل سريع للموظفين',
    steps: [
      { h: 'سجّل الدخول', b: 'افتح وايا من الجوال أو الكمبيوتر. أدخل الإيميل وكلمة المرور اللي عطاك إياها المدير.' },
      { h: 'افتح المسح والاستبدال', b: 'من القائمة الجانبية، اضغط على "المسح والاستبدال". هنا تسجّل كل زيارة.' },
      { h: 'أدخل رقم جوال العميل', b: 'اكتب رقم الجوال اللي يبدأ بـ 05 (مثلاً 0551234567). بطاقته تفتح تلقائياً.' },
      { h: 'أضف ختم واحد لكل زيارة', b: 'اضغط على زر "+ ختم" مرة وحدة في كل زيارة. لا تضيف أكثر من ختم في نفس الزيارة.' },
      { h: 'اصرف المكافأة', b: 'لما يكون عند العميل أختام أو نقاط كافية، اضغط "استبدال" في نفس الشاشة. المكافأة تُحتسب مستخدمة.' },
    ],
    footerTip: 'ملاحظة: لو العميل جديد، بطاقته تُنشأ تلقائياً أول ما تدخل رقم جواله.',
    printBtn: 'حفظ كـ PDF',
    langLabel: 'اللغة',
    noSecondary: 'بدون',
  },
  ur: {
    title: 'وایا کیسے استعمال کریں',
    subtitle: 'عملے کے لیے ایک فوری گائیڈ',
    steps: [
      { h: 'لاگ اِن کریں', b: 'اپنے فون یا کمپیوٹر پر وایا کھولیں۔ وہ ای میل اور پاس ورڈ درج کریں جو مالک نے دیا ہے۔' },
      { h: 'اسکین اور ریڈیم کھولیں', b: 'سائیڈ بار سے "اسکین اور ریڈیم" پر ٹیپ کریں۔ یہاں ہر وزٹ ریکارڈ ہوتی ہے۔' },
      { h: 'گاہک کا فون نمبر درج کریں', b: 'ایسا نمبر لکھیں جو 05 سے شروع ہوتا ہو (مثلاً 0551234567)۔ ان کا لائلٹی کارڈ خود بخود کھل جائے گا۔' },
      { h: 'ہر وزٹ پر ایک سٹیمپ دیں', b: 'ہر وزٹ میں ایک بار "+ سٹیمپ" بٹن دبائیں۔ ایک وزٹ میں ایک سے زیادہ سٹیمپ نہ دیں۔' },
      { h: 'انعام ریڈیم کریں', b: 'جب گاہک کے پاس کافی سٹیمپ یا پوائنٹس ہوں، اسی اسکرین پر "ریڈیم" ٹیپ کریں۔ انعام استعمال شدہ کے طور پر نشان زد ہو جاتا ہے۔' },
    ],
    footerTip: 'نوٹ: اگر گاہک نیا ہے، جیسے ہی آپ ان کا فون نمبر پہلی بار درج کرتے ہیں ان کا کارڈ بن جاتا ہے۔',
    printBtn: 'PDF کے طور پر محفوظ کریں',
    langLabel: 'زبان',
    noSecondary: 'کوئی نہیں',
  },
  hi: {
    title: 'वाया कैसे इस्तेमाल करें',
    subtitle: 'आपके स्टाफ के लिए एक क्विक गाइड',
    steps: [
      { h: 'लॉग इन करें', b: 'अपने फ़ोन या कंप्यूटर पर वाया खोलें। मालिक द्वारा दिए गए ईमेल और पासवर्ड से लॉग इन करें।' },
      { h: 'स्कैन और रिडीम खोलें', b: 'साइडबार से "स्कैन और रिडीम" पर टैप करें। यहीं पर हर विज़िट दर्ज होती है।' },
      { h: 'ग्राहक का फ़ोन नंबर डालें', b: '05 से शुरू होने वाला फ़ोन नंबर डालें (जैसे 0551234567)। उनका लॉयल्टी कार्ड अपने आप खुल जाएगा।' },
      { h: 'हर विज़िट पर 1 स्टैम्प दें', b: 'हर विज़िट में एक बार "+ स्टैम्प" बटन दबाएं। एक ही विज़िट पर एक से ज़्यादा स्टैम्प न दें।' },
      { h: 'रिवॉर्ड रिडीम करें', b: 'जब ग्राहक के पास काफ़ी स्टैम्प या पॉइंट हों, उसी स्क्रीन पर "रिडीम" टैप करें। रिवॉर्ड इस्तेमाल हुआ के रूप में चिह्नित होता है।' },
    ],
    footerTip: 'टिप: अगर ग्राहक नया है, उनका कार्ड तब बनता है जब आप पहली बार उनका फ़ोन नंबर डालते हैं।',
    printBtn: 'PDF के रूप में सेव करें',
    langLabel: 'भाषा',
    noSecondary: 'कोई नहीं',
  },
  bn: {
    title: 'ওয়ায়া কীভাবে ব্যবহার করবেন',
    subtitle: 'আপনার স্টাফদের জন্য একটি দ্রুত গাইড',
    steps: [
      { h: 'লগ ইন করুন', b: 'আপনার ফোন বা কম্পিউটারে ওয়ায়া খুলুন। মালিক দেওয়া ইমেল এবং পাসওয়ার্ড দিয়ে লগ ইন করুন।' },
      { h: 'স্ক্যান ও রিডিম খুলুন', b: 'সাইডবার থেকে "স্ক্যান ও রিডিম"-এ ট্যাপ করুন। এখানে প্রতিটি ভিজিট রেকর্ড হয়।' },
      { h: 'গ্রাহকের ফোন নম্বর দিন', b: '05 দিয়ে শুরু হওয়া ফোন নম্বর লিখুন (যেমন 0551234567)। তাদের লয়্যালটি কার্ড স্বয়ংক্রিয়ভাবে খুলবে।' },
      { h: 'প্রতি ভিজিটে ১টি স্ট্যাম্প দিন', b: 'প্রতি ভিজিটে একবার "+ স্ট্যাম্প" বোতাম চাপুন। একই ভিজিটে একাধিক স্ট্যাম্প দেবেন না।' },
      { h: 'রিওয়ার্ড রিডিম করুন', b: 'গ্রাহকের পর্যাপ্ত স্ট্যাম্প বা পয়েন্ট হলে, একই স্ক্রিনে "রিডিম" ট্যাপ করুন। রিওয়ার্ডটি ব্যবহৃত হিসেবে চিহ্নিত হয়।' },
    ],
    footerTip: 'টিপ: গ্রাহক নতুন হলে, প্রথমবার ফোন নম্বর দেওয়ার মুহূর্তেই তাদের কার্ড তৈরি হয়।',
    printBtn: 'PDF হিসেবে সংরক্ষণ করুন',
    langLabel: 'ভাষা',
    noSecondary: 'কিছু না',
  },
}

// Render a single block of translated step content in its own direction + font.
// Used twice per step when two languages are selected.
function StepBlock({ code, header, body, muted }) {
  const meta = LANGUAGES.find((l) => l.code === code)
  return (
    <div dir={meta.dir} style={{ fontFamily: meta.font, flex: 1, minWidth: 0 }}>
      <h2 style={{ margin: '2px 0 4px', fontSize: muted ? 15 : 18, color: muted ? '#374151' : '#111' }}>
        {header}
      </h2>
      <p style={{ margin: 0, color: muted ? '#555' : '#333', fontSize: muted ? 13 : 14 }}>
        {body}
      </p>
    </div>
  )
}

export default function GuidePage() {
  const [code, setCode] = useState('en')
  const [code2, setCode2] = useState('none')     // secondary language — 'none' = single
  const primary = LANGUAGES.find((l) => l.code === code)
  const c = CONTENT[code]
  const c2 = code2 !== 'none' && code2 !== code ? CONTENT[code2] : null
  const secondaryCode = c2 ? code2 : null

  // Controls stay in primary-language direction (matches UI the user selected first).
  return (
    <div
      dir={primary.dir}
      style={{
        fontFamily: primary.font,
        maxWidth: 820,
        margin: '0 auto',
        padding: '24px',
        color: '#111',
        background: '#fff',
        lineHeight: 1.55,
      }}
    >
      {/* Controls — hidden when printing */}
      <div
        className="guide-controls"
        style={{
          display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14 }}>
          <span style={{ color: '#555' }}>{c.langLabel}:</span>
          <select value={code} onChange={(e) => setCode(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}>
            {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
          </select>
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14 }}>
          <span style={{ color: '#555' }}>+</span>
          <select value={code2} onChange={(e) => setCode2(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}>
            <option value="none">{c.noSecondary}</option>
            {LANGUAGES.filter((l) => l.code !== code).map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => window.print()}
          style={{
            padding: '8px 16px', border: 'none', background: '#10B981',
            color: 'white', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
          }}
        >
          {c.printBtn}
        </button>
      </div>

      {/* Printable content */}
      <div className="guide-printable">
        <header style={{ textAlign: 'center', paddingBottom: 16, borderBottom: '2px solid #10B981' }}>
          <img src={wayaLogo} alt="Waya" style={{ height: 56, display: 'inline-block' }} />
          <h1 style={{ margin: '12px 0 4px', fontSize: 28 }}>
            {c.title}{c2 ? ` · ${c2.title}` : ''}
          </h1>
          <p style={{ margin: 0, color: '#555' }}>
            {c.subtitle}{c2 ? ` — ${c2.subtitle}` : ''}
          </p>
        </header>

        <ol style={{ listStyle: 'none', padding: 0, marginTop: 28 }}>
          {c.steps.map((s, i) => {
            const s2 = c2?.steps[i]
            return (
              <li key={i} style={{
                display: 'flex', gap: 16, marginBottom: 22, alignItems: 'flex-start',
                pageBreakInside: 'avoid',
              }}>
                <div style={{
                  flex: '0 0 auto', width: 36, height: 36, borderRadius: '50%',
                  background: '#10B981', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 16,
                }}>{i + 1}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                  <StepBlock code={code} header={s.h} body={s.b} />
                  {s2 && (
                    <div style={{ paddingTop: 6, borderTop: '1px dashed #d1d5db' }}>
                      <StepBlock code={secondaryCode} header={s2.h} body={s2.b} muted />
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>

        <footer style={{ marginTop: 32, paddingTop: 12, borderTop: '1px solid #e5e7eb',
          fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
          trywaya.com
        </footer>
      </div>

      <style>{`
        @media print {
          .guide-controls { display: none !important; }
          @page { margin: 16mm; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  )
}
