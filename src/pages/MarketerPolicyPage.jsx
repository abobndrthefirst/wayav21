// Marketer affiliate program policy.
// Route: /marketers/policy (lazy-loaded by App.jsx).
//
// The Arabic copy is the authoritative version provided by ops; the page
// is Arabic-only by design (the landing's English mirror does not have a
// localized policy yet — visitors with lang=en see the Arabic policy).

import { useEffect } from 'react'
import { motion } from 'framer-motion'

const WAYA_LOGO = '/Arabic Letters Midjourney (1).svg'

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 0 20" /><path d="M12 2a15.3 15.3 0 0 0 0 20" />
    </svg>
  )
}

export default function MarketerPolicyPage({ lang, setLang, theme, setTheme }) {
  useEffect(() => {
    document.title = 'سياسة التسويق بالعمولة – وايا'
  }, [])

  return (
    <div className="marketer-policy-page" dir="rtl" lang="ar">
      <header className="marketer-landing-nav">
        <button className="marketer-landing-brand" onClick={() => navigate('/marketers')} aria-label="وايا">
          <img src={WAYA_LOGO} alt="وايا" />
        </button>
        <div className="marketer-landing-nav-actions">
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="lang-toggle" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <GlobeIcon /><span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
          <button className="marketer-landing-login" onClick={() => navigate('/marketers')}>الرجوع</button>
        </div>
      </header>

      <motion.article className="marketer-policy" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <h1 className="marketer-policy-title">سياسة التسويق بالعمولة – وايا</h1>

        <p>نرحب بانضمامكم لفريق المسوّقين بالعمولة، ونسعى لتقديم نظام واضح وعادل لاحتساب العمولات.</p>

        <h2>آلية احتساب العمولة:</h2>
        <ul>
          <li>يتم احتساب العمولة لكل متجر يشترك في الباقة الشهرية من خلالك.</li>
          <li><strong>الشهر الأول:</strong> 75 ريال لكل متجر مشترك</li>
          <li><strong>الشهر الثاني:</strong> 50 ريال لكل متجر مستمر</li>
          <li><strong>الشهر الثالث:</strong> 25 ريال لكل متجر مستمر</li>
          <li><strong>بعد الشهر الثالث:</strong> لا يتم احتساب عمولات إضافية</li>
        </ul>

        <h2>شروط احتساب العمولة:</h2>
        <ul>
          <li>يجب أن يقوم المتجر بإدخال <strong>كود المسوّق الخاص بك</strong> أثناء التسجيل.</li>
          <li>في حال عدم إدخال الكود، لن يتم احتساب العمولة.</li>
          <li>يتم احتساب العمولة فقط بعد <strong>تفعيل الاشتراك والدفع</strong>.</li>
          <li>يجب أن يكون المتجر حقيقي وليس مكرر أو وهمي.</li>
        </ul>

        <h2>طريقة التحويل:</h2>
        <ul>
          <li>يتم تحويل العمولات <strong>كل أسبوعين</strong>.</li>
          <li>يتم احتساب فقط المتاجر المفعّلة والمؤهلة للدفع خلال الفترة.</li>
        </ul>

        <h2>ملاحظات:</h2>
        <ul>
          <li>تحتفظ وايا بحق مراجعة أي عملية تسجيل للتأكد من صحتها.</li>
          <li>أي محاولة تلاعب أو تسجيل غير حقيقي تؤدي إلى إلغاء العمولة.</li>
        </ul>

        <p className="marketer-policy-closing">نهدف من هذه السياسة إلى ضمان الشفافية وتحقيق فائدة للجميع.</p>

        <div className="marketer-policy-cta">
          <button className="marketer-btn-primary" onClick={() => navigate('/marketer/signup')}>سجّل كمسوّق الآن</button>
          <button className="marketer-btn-secondary" onClick={() => navigate('/marketers')}>الرجوع للصفحة الرئيسية</button>
        </div>
      </motion.article>
    </div>
  )
}
