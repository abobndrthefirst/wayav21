import { useEffect, useRef, useState, createContext, useContext, lazy, Suspense } from 'react'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import {
  isValidKsaPhone,
  handlePhoneChange,
  KSA_PHONE_HINT_EN,
  KSA_PHONE_HINT_AR,
  KSA_PHONE_ERR_EN,
  KSA_PHONE_ERR_AR,
} from './lib/phone'
import { useShopStats } from './lib/useShopStats'
// Analytics loaded via script tag in index.html
import './styles.css'
import './components/loyalty-wizard.css'
import './components/notifications-panel.css'
import './components/pass-designer/pass-designer.css'
import { WhoWeServe, PosIntegrations } from './components/LoyaSections'

// Lazy-load the heavy merchant + customer flows so the marketing landing
// page doesn't ship a LoyaltyWizard / WalletEnrollPage bundle it never uses.
const ProgramsList = lazy(() => import('./components/ProgramsList'))
const ScanRedeemTab = lazy(() => import('./components/ScanRedeemTab'))
const WalletEnrollPage = lazy(() => import('./components/WalletEnrollPage'))
const EventsPanel = lazy(() => import('./components/EventsPanel'))
const NotificationsPanel = lazy(() => import('./components/NotificationsPanel'))
const NotificationsTab = lazy(() => import('./components/NotificationsTab'))
const PassDesignerPage = lazy(() => import('./components/pass-designer/PassDesignerPage'))
const BillingPage = lazy(() => import('./components/BillingPage'))
const BillingReturnPage = lazy(() => import('./components/BillingReturnPage'))
const BillingCancelPage = lazy(() => import('./components/BillingCancelPage'))
const GuidePage = lazy(() => import('./pages/GuidePage'))

const LazyFallback = () => (
  <div style={{ padding: 48, textAlign: 'center', color: '#888' }}>Loading…</div>
)

/* ─── Supabase config (from Vite env) ─── */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env var. Add them to .env.local and Vercel project env.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/* ─── Auth Context ─── */
const AuthContext = createContext({ user: null, loading: true, signOut: async () => {} })

// Hard session limit: 12 hours from sign-in, regardless of activity.
const SESSION_MAX_MS = 12 * 60 * 60 * 1000
const LOGIN_AT_KEY = 'waya_login_at'

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isExpired = () => {
      const at = parseInt(localStorage.getItem(LOGIN_AT_KEY) || '0', 10)
      return at > 0 && Date.now() - at > SESSION_MAX_MS
    }

    const enforce = async (session) => {
      if (!session) return false
      if (isExpired()) {
        await supabase.auth.signOut()
        localStorage.removeItem(LOGIN_AT_KEY)
        return true
      }
      return false
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session && !localStorage.getItem(LOGIN_AT_KEY)) {
        // Existing session from before this policy existed — start the 12h clock now.
        localStorage.setItem(LOGIN_AT_KEY, String(Date.now()))
      }
      const expired = await enforce(session)
      setUser(expired ? null : (session?.user ?? null))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && !localStorage.getItem(LOGIN_AT_KEY)) {
        localStorage.setItem(LOGIN_AT_KEY, String(Date.now()))
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(LOGIN_AT_KEY)
      }
      const expired = await enforce(session)
      setUser(expired ? null : (session?.user ?? null))
      setLoading(false)
    })

    const intervalId = setInterval(async () => {
      if (isExpired()) {
        await supabase.auth.signOut()
        localStorage.removeItem(LOGIN_AT_KEY)
      }
    }, 60_000)

    return () => { subscription.unsubscribe(); clearInterval(intervalId) }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem(LOGIN_AT_KEY)
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

function useAuth() { return useContext(AuthContext) }

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

async function submitLead({ contact, store_name, industry }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ contact, store_name, industry }),
  })
  return res.ok
}

/* ─── i18n content ─── */
const content = {
  ar: {
    nav: { cta: 'ابدأ مجاناً', pricing: 'الأسعار', features: 'المميزات', how: 'كيف يعمل', why: 'لماذا وايا', faq: 'الأسئلة', login: 'دخول', signup: 'سجّل', logout: 'خروج', hi: 'مرحباً', dashboard: 'لوحة التحكم', subscription: 'الاشتراك' },
    auth: {
      loginTitle: 'تسجيل الدخول', loginSub: 'ادخل لحسابك وابدأ تدير برنامج الولاء',
      signupTitle: 'إنشاء حساب', signupSub: 'سجّل الحين وابدأ أسبوعك المجاني',
      email: 'الإيميل', password: 'كلمة المرور', name: 'الاسم الكامل',
      emailPh: 'name@example.com', passwordPh: 'ادخل كلمة المرور', namePh: 'مثلاً: أحمد علي',
      loginBtn: 'دخول', signupBtn: 'أنشئ حسابي', googleBtn: 'الدخول عبر Google', googleSignup: 'التسجيل عبر Google', appleBtn: 'الدخول عبر Apple', appleSignup: 'التسجيل عبر Apple',
      or: 'أو', forgot: 'نسيت كلمة المرور؟', back: 'الرئيسية',
      noAccount: 'ما عندك حساب؟', hasAccount: 'عندك حساب؟', goSignup: 'سجّل الحين', goLogin: 'سجّل دخول',
      errInvalid: 'الإيميل أو كلمة المرور غلط', errEmpty: 'ادخل الإيميل وكلمة المرور',
      errName: 'ادخل اسمك', errEmail: 'ادخل إيميل صحيح', errPassword: 'كلمة المرور لازم 6 أحرف على الأقل',
      logging: 'جاري الدخول...', signing: 'جاري التسجيل...',
      successTitle: 'تم التسجيل!', successMsg: 'تفقد إيميلك وفعّل حسابك عشان تقدر تدخل.',
      errEmailFirst: 'ادخل إيميلك أولاً', resetSent: 'تم إرسال رابط إعادة التعيين على إيميلك',
      otpTitle: 'تأكيد إيميلك', otpSub: 'أرسلنا لك رمز مكوّن من 6 أرقام على إيميلك',
      otpLabel: 'رمز التأكيد', otpPh: '123456', otpBtn: 'تأكيد', otpVerifying: 'جاري التأكيد...',
      otpErrEmpty: 'ادخل الرمز', otpErrInvalid: 'الرمز غلط أو انتهت صلاحيته', otpResend: 'أعد الإرسال', otpResent: 'تم إرسال رمز جديد',
      resetTitle: 'كلمة مرور جديدة', resetSub: 'اختار كلمة مرور قوية لحسابك',
      resetNewPass: 'كلمة المرور الجديدة', resetConfirmPass: 'تأكيد كلمة المرور', resetNewPassPh: 'ادخل كلمة مرور جديدة',
      resetBtn: 'حفظ كلمة المرور', resetSaving: 'جاري الحفظ...', resetErrMatch: 'كلمتا المرور غير متطابقتين',
      resetSuccess: 'تم تغيير كلمة المرور!', resetSuccessMsg: 'يمكنك الآن الدخول بكلمة مرورك الجديدة.',
    },
    setup: {
      title: 'أعدّ متجرك', subtitle: 'أكمل معلومات متجرك عشان تبدأ',
      shopName: 'اسم المتجر', shopNamePh: 'مثلاً: كوفي لاونج',
      shopType: 'نوع النشاط', shopTypePh: 'اختر نوع النشاط',
      types: ['مقهى', 'مطعم', 'صالون', 'بقالة', 'ملابس', 'إلكترونيات', 'أخرى'],
      phone: 'رقم الجوال', phonePh: '05xxxxxxxx',
      address: 'العنوان', addressPh: 'مثلاً: الرياض، حي النخيل',
      instagram: 'انستقرام', twitter: 'تويتر',
      logo: 'شعار المتجر', logoUpload: 'اختر صورة', logoHint: 'PNG أو JPG، أقصى حجم 2 ميقا',
      loyaltyTitle: 'إعدادات برنامج الولاء',
      pointsPerVisit: 'نقاط لكل زيارة', rewardAt: 'المكافأة عند', points: 'نقطة',
      rewardDesc: 'وصف المكافأة', rewardDescPh: 'مثلاً: قهوة مجانية',
      submit: 'ابدأ الآن', saving: 'جاري الحفظ...',
      errName: 'ادخل اسم المتجر', errType: 'اختر نوع النشاط',
    },
    dashboard: {
      title: 'لوحة التحكم', welcome: 'مرحباً',
      yourQR: 'كود QR متجرك', qrHint: 'اطبعه وحطّه عند الكاشير — العميل يمسحه ويبدأ يجمع نقاط',
      journey: 'رحلة العميل',
      step1: 'يمسح QR', step2: 'يجمع نقاط', step3: 'يوصله إشعار', step4: 'يرجع ويستلم مكافأة',
      activity: 'آخر النشاطات', noActivity: 'ما في نشاطات بعد — شارك كود QR مع عملائك!',
      scan: 'مسح', reward: 'مكافأة', pointsEarned: 'نقطة',
      home: 'الرئيسية', data: 'البيانات', loyalty: 'الولاء', settings: 'الإعدادات', logout: 'خروج',
      navHome: 'الرئيسية', navData: 'البيانات', navLoyalty: 'برنامج الولاء', navDesigner: 'مصمم البطاقة', navScan: 'مسح واستبدال', navSettings: 'الإعدادات',
      visitSite: 'زيارة الموقع',
      createFirstCardTitle: 'أنشئ بطاقتك الأولى',
      createFirstCardSub: 'صمّم بطاقة ولاء جاهزة لمحفظة Apple وGoogle Wallet خلال دقائق.',
      createFirstCardCta: 'ابدأ التصميم',
      scanTitle: 'مسح واستبدال',
      scanLookupLabel: 'رقم جوال العميل',
      scanLookupPh: '05xxxxxxxx',
      scanLookupBtn: 'بحث',
      scanNotFound: 'ما لقينا عميل بهذا الرقم.',
      scanStamps: 'النقاط',
      scanRequired: 'مطلوب للمكافأة',
      scanAddStamp: 'إضافة نقطة',
      scanRedeem: 'استبدال مكافأة',
      scanSuccessAdd: 'تمت إضافة النقطة ✓',
      scanSuccessRedeem: 'تم استبدال المكافأة 🎉',
      scanError: 'صار خطأ، جرّب مرة ثانية.',
      scanRedeemDisabled: 'العميل ما وصل للمكافأة بعد.',
      statLabels: { customers: 'عميل نشط', visits: 'زيارات متكررة', revenue: 'إيرادات إضافية', rewards: 'مكافأة مرسلة' },
    },
    dataPage: {
      title: 'البيانات والتحليلات',
      customers: 'عملاء', totalScans: 'مسحات', rewardsRedeemed: 'مكافآت', totalPoints: 'إجمالي النقاط',
      moreComingSoon: 'تحليلات أكثر قريباً — رسوم بيانية، تقارير أسبوعية، وأكثر!',
    },
    loyaltyPage: {
      title: 'برنامج الولاء',
      programSettings: 'إعدادات البرنامج',
      pointsPerVisit: 'نقاط لكل زيارة', rewardAt: 'المكافأة عند', points: 'نقطة',
      rewardDesc: 'وصف المكافأة', rewardDescPh: 'مثلاً: قهوة مجانية',
      save: 'حفظ التغييرات', saving: 'جاري الحفظ...', saved: 'تم الحفظ ✓',
      cardDesign: 'تصميم البطاقة',
      cardColor: 'لون البطاقة',
      cardLogo: 'شعار المتجر',
      cardLogoUpload: 'رفع شعار',
      cardLogoHint: 'PNG أو JPG (مربع، أقل من 1MB)',
      cardPreview: 'معاينة البطاقة',
      walletTitle: 'محفظة قوقل',
      walletDesc: 'اسمح لعملائك بإضافة بطاقة الولاء إلى محفظة قوقل مباشرة',
      walletTestBtn: 'جرّب إضافة بطاقة تجريبية',
      walletGenerating: 'جاري الإنشاء...',
      walletSuccess: 'تم إنشاء الرابط! اضغط الزر لإضافة البطاقة',
      walletError: 'حدث خطأ',
      walletNotConfigured: 'لم يتم إعداد محفظة قوقل بعد. تواصل مع الدعم لتفعيلها.',
      walletCustomerLink: 'رابط العميل',
      walletCopyLink: 'نسخ الرابط',
      walletCopied: 'تم النسخ ✓',
      customerName: 'اسم العميل',
      customerPhone: 'رقم الجوال',
    },
    settingsPage: {
      title: 'الإعدادات',
      shopInfo: 'معلومات المتجر',
      account: 'الحساب', email: 'الإيميل', joined: 'تاريخ التسجيل',
      save: 'حفظ التغييرات', saving: 'جاري الحفظ...', saved: 'تم الحفظ ✓',
    },
    hero: {
      title1: 'العميل اللي يرجع',
      title2: 'هو أفضل عميل.',
      subtitle: 'وايا تساعد متجرك يحوّل الزيارة الأولى إلى علاقة مستمرة.',
      freeTrial: 'أول شهرين  اشتراك مجاناً   — بدون أي التزام',
      inputPlaceholder: 'إيميلك أو رقم جوالك',
      storeNamePlaceholder: 'اسم متجرك',
      industryPlaceholder: 'نوع النشاط',
      industries: ['مطعم', 'كافيه', 'صالون', 'مغسلة', 'حلويات', 'بقالة', 'ملابس', 'أخرى'],
      btn: 'ابدأ الآن',
      whatsapp: 'تواصل معنا عبر واتساب',
      successMsg: 'تم التسجيل بنجاح! بنتواصل معك قريباً',
      errorMsg: 'يرجى تعبئة جميع الحقول',
    },
    stats: [
      { value: '5–25x', label: 'تكلفة اكتساب العميل الجديد مقارنة بالاحتفاظ بالحالي' },
      { value: '+18%', label: 'زيادة في الإنفاق من العملاء المسجّلين ببرامج ولاء' },
      { value: '60–70%', label: 'احتمال الشراء من عميل حالي، مقابل 5–20% من عميل جديد' },
      { value: '4.8x', label: 'إنفاق أعلى من العملاء اللي يحسّون بارتباط عاطفي بالعلامة' },
    ],
    how: {
      badge: 'كيف يعمل',
      title: 'خمس خطوات وتبدأ. بدون جهاز مخصص. بدون انتظار.',
      subtitle: 'من التسجيل إلى أول مكافأة — كل شي واضح وبسيط.',
      steps: [
        { title: 'سجّل وجهّز كل شي', desc: 'سجّل حسابك، حمّل التطبيق، اختر ستايل المكافآت (ختم، نقاط، أو كاش باك)، وخصّص الهوية. جاهز خلال دقائق.' },
        { title: 'اطبع كود QR وحطه بالمحل', desc: 'اطبع الكود وحطه على الكاونتر أو الطاولة. العميل يمسحه بجواله بدون ما يحمّل أي تطبيق.' },
        { title: 'العميل يسجّل ويبدأ يجمع', desc: 'أول ما يمسح الكود، يسجّل بثواني ويبدأ يجمع نقاط أو أختام من أول زيارة.' },
        { title: 'العميل يرجع — الكاشير يمسح من التطبيق', desc: 'لما العميل يرجع، الكاشير يفتح تطبيق وايا ويمسح كود العميل من جواله. النقاط تنضاف تلقائي.' },
        { title: 'المكافأة توصل — والعميل يرجع أكثر', desc: 'أول ما يوصل للهدف، المكافأة تنزل تلقائي. العميل يحس بالتقدير ويرجع — وأنت تتابع كل شي من لوحة التحكم.' },
      ],
    },
    features: {
      title: 'كل اللي تحتاجه. ولا شي زيادة.',
      subtitle: 'أدوات مصممة تخلّي عميلك يرجع — بدون ما تعقّد شغلك.',
      dashboard: 'لوحة تحكم نظام الولاء',
      dashStats: [
        { label: 'ارتفاع الإيرادات', value: '14.2ك ر.س', change: '+22%' },
        { label: 'زيارات متكررة', value: '67%', change: '+8%' },
        { label: 'مكافآت مرسلة', value: '3,891', change: '+34%' },
        { label: 'عملاء نشطين', value: '1,247', change: '+12%' },
      ],
      items: [
        { icon: 'bell', title: 'إشعارات ذكية', desc: 'إشعار في الوقت الصح يذكّر عميلك يرجع — بدون إزعاج.' },
        { icon: 'chart', title: 'تحليلات واضحة ومفهومة', desc: 'اعرف مين عميلك الدائم، أي مكافأة تشتغل، ومتى يبدأ العميل يبتعد.' },
        { icon: 'share', title: 'حلقة إحالة مدمجة', desc: 'عميلك يشارك، صديقه يسجّل، والاثنين يكسبون. نمو عضوي بدون ميزانية.' },
        { icon: 'calendar', title: 'حملات المواسم جاهزة', desc: 'رمضان، العيد، اليوم الوطني — قوالب جاهزة تفعّلها بضغطة واحدة.' },
      ],
    },
    audience: {
      badge: 'وايا لمين؟',
      title: 'لكل محل يبي عملاءه يرجعون',
      subtitle: 'مهما كان نشاطك، وايا يناسبك.',
      items: [
        { label: 'كافيهات' },
        { label: 'مطاعم' },
        { label: 'صالونات' },
        { label: 'حلاقين' },
        { label: 'مغاسل' },
        { label: 'محلات تجزئة' },
      ],
    },
    demo: {
      badge: 'شوف بنفسك',
      title: 'جولة سريعة داخل وايا',
      subtitle: 'من لوحة التحكم إلى تجربة العميل — كل شي واضح وبسيط.',
      steps: [
        { label: 'سجّل متجرك', desc: 'اختر نوع نشاطك، ارفع شعارك، وحدد المكافآت. جاهز خلال دقائق.' },
        { label: 'شارك الكود', desc: 'اطبع QR أو شاركه رقمياً. العميل يمسح بجواله ويبدأ يجمع نقاط بدون ما يحمّل شي.' },
        { label: 'تابع النتائج', desc: 'شوف مين رجع، مين قرب من مكافأة، ومين يحتاج إشعار تذكيري.' },
        { label: 'كافئ وكرر', desc: 'المكافأة توصل تلقائياً، والعميل يرجع. حلقة ولاء ما توقف.' },
      ],
      dashboardTitle: 'لوحة تحكم وايا',
      metrics: [
        { icon: 'users', value: '1,247', label: 'عميل نشط', trend: '+12%' },
        { icon: 'repeat', value: '67%', label: 'زيارات متكررة', trend: '+8%' },
        { icon: 'gift', value: '3,891', label: 'مكافأة مرسلة', trend: '+34%' },
        { icon: 'sar', value: '14.2ك', label: 'إيرادات إضافية', trend: '+22%' },
      ],
      customerJourney: 'رحلة العميل',
      journeySteps: ['يمسح QR', 'يجمع نقاط', 'يوصله إشعار', 'يرجع ويستلم مكافأة'],
      cta: 'جاهز تجرّب؟ ابدأ مجاناً',
    },
    walletCards: {
      title: 'بطاقات ولاء رقمية بتصميمك',
      subtitle: 'كل بطاقة تعكس هوية متجرك — قهوة، صالون، أو أي نشاط.',
    },
    calculator: {
      badge: 'احسبها بنفسك',
      title: 'كم وايا بتزيد إيراداتك؟',
      subtitle: 'حرّك الأرقام وشوف الفرق — بناءً على بيانات حقيقية من تجار مثلك.',
      customersLabel: 'عدد العملاء شهرياً',
      avgOrderLabel: 'متوسط قيمة الطلب (ر.س)',
      withoutTitle: 'بدون وايا',
      withTitle: 'مع وايا',
      monthlyRevenue: 'إيرادات شهرية',
      repeatVisits: 'زيارات متكررة',
      avgTicket: 'متوسط الفاتورة',
      extraRevenue: 'إيرادات إضافية شهرياً',
      roi: 'عائد الاستثمار',
      currency: 'ر.س',
      perMonth: '/ شهر',
      xReturn: 'ضعف',
      wayaCost: 'تكلفة وايا',
      netProfit: 'صافي الربح الإضافي',
      cta: 'ابدأ الآن وشوف الفرق',
    },
    whyWaya: {
      badge: 'لماذا وايا',
      title: 'لماذا وايا هو الخيار الأفضل لمتجرك',
      subtitle: 'ثلاث أسباب تخليك ما تفكر ثاني.',
      points: [
        { title: 'يزيد مبيعاتك',    desc: 'العميل يرجع أكثر وينفق أعلى — حتى +18% في متوسط الفاتورة و+32% في الزيارات المتكررة.' },
        { title: 'بدون تطبيق جديد', desc: 'البطاقة تنضاف مباشرة لـ Apple Wallet وGoogle Wallet — العميل ما يحتاج ينزّل شي.' },
        { title: 'متكامل مع نظامك', desc: 'ربط مباشر مع Foodics وZid وSalla وأنظمة نقاط البيع — النقاط تنضاف تلقائي بعد كل فاتورة.' },
      ],
    },
    faq: {
      badge: 'الأسئلة الشائعة',
      title: 'كل شي تحتاج تعرفه',
      items: [
        { q: 'كم عميل لازم يكون عندي قبل ما أستخدم وايا؟', a: 'ما يهم — حتى لو عندك 10 عملاء. الفكرة إنك تخلّي العملاء الحاليين يرجعون، مو إنك تجيب جدد.' },
        { q: 'هل العميل يحتاج ينزّل تطبيق؟', a: 'لا. البطاقة تروح مباشرة إلى Apple Wallet أو Google Wallet. العميل يفتح محفظته ويشوف رصيده.' },
        { q: 'كم ياخذ الإعداد؟', a: 'دقائق. تسجّل متجرك، تصمّم بطاقتك، وتشارك كود QR مع عملائك.' },
        { q: 'هل أقدر ألغي بأي وقت؟', a: 'نعم بدون عقد. تقدر تلغي من لوحة التحكم، والخدمة تستمر لنهاية فترة الفوترة الحالية.' },
        { q: 'أي أنظمة نقاط البيع مدعومة؟', a: 'Foodics وZid وSalla وRewaa وOdoo حالياً. لو عندك نظام غيرهم، تواصل معنا ونربطه لك.' },
        { q: 'هل بياناتي آمنة؟', a: 'كلها مشفّرة، محفوظة في خوادم Supabase، وما نبيع ولا نشارك بياناتك مع أي طرف ثالث.' },
      ],
    },
    comparison: {
      badge: 'ليش وايا؟',
      title: 'ماذا لو برامج الولاء ما كانت بس للكبار؟',
      without: {
        header: 'بدون وايا',
        items: [
          'تصرف على إعلانات وما تدري مين رجع',
          'عميلك يروح للسلسلة لأنها تكافئه',
          'ما تعرف مين عميل دائم ومين زار مرة وحدة',
          'تحتاج مبرمج أو وقت طويل عشان تبني شي',
          'المواسم تعدي عليك وأنت مشغول',
          'كل عميل يمشي بدون ما تقدر ترجعه',
        ],
      },
      with: {
        header: 'مع وايا',
        items: [
          'عملاءك يرجعون — لأن في سبب يرجعون له',
          'تنافس السلاسل بنظام ولاء بمستواهم',
          'تعرف كل عميل بالاسم، وبعادته',
          'تطلق برنامجك بدقائق — بدون سطر كود',
          'حملات رمضان والعيد جاهزة بضغطة',
          'تقدر تتواصل مع عميلك قبل ما يختفي',
        ],
      },
    },
    socialProof: {
      title: 'أرقام تتكلم',
      subtitle: 'من أول شهر، التجار شافوا الفرق.',
      items: [
        { value: '+477', label: 'محل مسجّل', desc: 'تجار اختاروا وايا لإدارة ولاء عملائهم' },
        { value: '+32%', label: 'زيادة في الزيارات المتكررة', desc: 'عملاء يرجعون أكثر بعد تفعيل البرنامج' },
        { value: '+18%', label: 'ارتفاع في متوسط الفاتورة', desc: 'إنفاق أعلى من العملاء المكافَئين' },
      ],
    },
    pricing: {
      badge: 'الأسعار',
      title: 'سعر واضح. بدون مفاجآت. وعائد تحسبه.',
      foundingBanner: 'مجاناً بالكامل لأول شهرين للمشاريع الجديدة',
      foundingSub: 'ابدأ بدون أي تكلفة — ادفع بس لما تشوف النتائج',
      monthly: {
        label: 'الخطة الشهرية',
        price: '75',
        unit: 'ر.س / شهر',
        note: 'بدون التزام — الغي بأي وقت',
      },
      annual: {
        label: 'الخطة السنوية',
        badge: 'خصم 50%',
        price: '37',
        oldPrice: '75',
        unit: 'ر.س / شهر',
        note: 'يُفوتر 450 ر.س سنوياً — توفير 450 ر.س',
      },
      features: [
        'حملات غير محدودة',
        'إشعارات ذكية للعملاء',
        'لوحة تحكم كاملة',
        'تحليلات وتقارير',
        'حلقة إحالة مدمجة',
        'قوالب رمضان والعيد',
        'دعم فني عربي',
      ],
      cta: 'ابدأ الآن',
    },
    cta: {
      title: 'عميلك القادم ممكن يكون آخر زيارة — أو أول علاقة.',
      subtitle: 'ابدأ مجاناً. بدون بطاقة. بدون التزام. وشوف الفرق من أول أسبوع.',
      btn: 'ابدأ تجربتك المجانية',
    },
    explainer: {
      badge: 'وش وايا؟',
      problem: {
        label: 'المشكلة',
        text: 'كثير من العملاء يجربون المتجر مرة، لكن ما فيه سبب واضح يخليهم يرجعون.',
      },
      waya: {
        label: 'وايا',
        text: 'بطاقة ولاء رقمية تنحفظ في جوال العميل مباشرة، بدون تحميل تطبيق.',
      },
      how: {
        label: 'النتيجة',
        text: 'كل زيارة تكسب العميل نقاط أو مكافآت، وتعطيه سبب يرجع مرة ثانية.',
      },
    },
    cardTypes: {
      badge: 'آلية العمل',
      title: 'كيف تعمل البطاقة؟',
      steps: [
        { num: '01', title: 'الخطوة الأولى', desc: 'وجّه كاميرا الجوال على كود QR عند الكاشير.' },
        { num: '02', title: 'الخطوة الثانية', desc: 'تسجيل بسيط بثواني، بدون تحميل أي تطبيق.' },
        { num: '03', title: 'الخطوة الثالثة', desc: 'أضف البطاقة مباشرة إلى Apple Wallet أو Google Wallet.' },
      ],
      typesTitle: 'أنواع البطاقات',
      tabs: [
        { key: 'stamp', label: 'الأختام' },
        { key: 'points', label: 'النقاط' },
        { key: 'cashback', label: 'الكاش باك' },
        { key: 'subscription', label: 'الاشتراك' },
        { key: 'discount', label: 'التخفيض' },
        { key: 'gift', label: 'الإهداء' },
        { key: 'membership', label: 'العضوية' },
      ],
      details: {
        stamp: { title: 'بطاقة الأختام', desc: 'يجمع العميل أختاماً عند كل زيارة، وعند الاكتمال يستلم مكافأته في الزيارة القادمة.' },
        points: { title: 'بطاقة النقاط', desc: 'كل فاتورة تحوّل إلى نقاط يصرفها العميل على مكافآت يحبها.' },
        cashback: { title: 'بطاقة الكاش باك', desc: 'يرجع جزء من قيمة الفاتورة كرصيد يصرفه العميل في زيارته التالية.' },
        subscription: { title: 'بطاقة الاشتراك', desc: 'اشتراك شهري أو سنوي بمزايا ثابتة — دخل متكرر ووفاء مضمون.' },
        discount: { title: 'بطاقة التخفيض', desc: 'خصم ثابت للأعضاء كل زيارة — بدون عروض معقّدة.' },
        gift: { title: 'بطاقة الإهداء', desc: 'إهداء رصيد أو منتج لصديق بضغطة — يوصله عبر جواله مباشرة.' },
        membership: { title: 'بطاقة العضوية', desc: 'عضوية VIP رقمية تعرّف عملاءك المميزين وتعطيهم أولوية.' },
      },
    },
    whoWeServe: {
      badge: 'تعرّف على الفئات',
      title: 'من نخدم؟',
      cta: 'تواصل معنا لمعرفة كيف نخدم نشاطك التجاري',
      items: [
        { emoji: '🍽️', label: 'المطاعم' },
        { emoji: '💅', label: 'مراكز المناكير والعناية' },
        { emoji: '💆', label: 'مراكز المساج' },
        { emoji: '☕', label: 'المقاهي والكوفيهات' },
        { emoji: '🚘', label: 'مغاسل السيارات' },
        { emoji: '🏥', label: 'العيادات والمراكز الصحية' },
        { emoji: '💇', label: 'صالونات العناية بالشعر' },
        { emoji: '🏋️', label: 'صالات الرياضة واللياقة' },
        { emoji: '🛍️', label: 'متاجر التجزئة والسلع' },
        { emoji: '➕', label: 'وأكثر من ذلك' },
      ],
    },
    posIntegrations: {
      badge: 'حوكمة وسهولة أكثر!',
      title1: 'نربط مع أشهر أنظمة',
      title2: 'نقاط البيع',
      subtitle: '',
      ctaQuestion: 'عندك نظام نقاط بيع غير مدعوم؟',
      ctaBtn: 'تواصل معنا وجاهزين نربطه',
      logos: [
        { name: 'Foodics', src: '/Foodics_id-xUyauWo_0.svg' },
        { name: 'Odoo', src: '/Odoo_id34J-r875_0.svg' },
        { name: 'Zid' },
        { name: 'Salla' },
        { name: 'Rewaa' },
        { name: 'Marn' },
        { name: 'Lightspeed' },
      ],
    },
    partners: {
      badge: 'نشتغل معك',
      title: 'انضم إلى شركائنا',
      logos: ['dIPd', 'DRIVE', 'Nawa', 'hjeen', 'BAC', 'MORFi', 'IRIS', 'Bocelli', 'OAKBERRY'],
    },
    pricingFounding: {
      badge: 'باقة الأسعار',
      title: 'باقة التأسيس',
      subtitle: 'باقة واحدة، بكل المزايا — خصّيناها لأصحاب المشاريع الجدد.',
      price: '٨٥',
      sar: 'ر.س',
      perMonth: 'شهرياً',
      recommended: 'العرض الحالي',
      freeTrial: 'اشتراك أول شهرين مجاناً',
      featuresTitle: 'الباقة تحتوي على',
      features: [
        'اشتراك أول شهرين مجاناً',
        'عدد بطاقات غير محدود',
        'تصميم بطاقات مخصّص',
        'عدد عملاء غير محدود',
        'لوحة تحكم كاملة',
        'استيراد بيانات العملاء من Excel',
      ],
      soonTitle: 'قريباً',
      soonFeatures: [
        'ميزة الإشعارات اللامحدودة',
        'دعم منصات الكاشير المعروفة',
      ],
      cta: 'اشترك الآن',
    },
    pricingTiers: {
      badge: 'باقات الأسعار',
      title: 'تعرّف على باقاتنا',
      subtitle: 'لا تشيل هم الإعداد — نجهّز لك كامل بيانات الحساب شامل التصميم ونسلّمه لك.',
      monthly: 'شهري',
      annual: 'سنوي — خصم ٢٥٪',
      recommended: 'موصى به',
      annualLabel: 'التكلفة السنوية',
      perMonth: 'ر.س / شهرياً',
      sar: 'ر.س',
      ctaSubscribe: 'اشترك الآن',
      ctaTrial: 'جرّب الخدمة مجاناً لمدة أسبوعين',
      plans: [
        {
          key: 'basic',
          name: 'الباقة الأساسية',
          monthly: 75,
          annualMonthly: 56,
          annualTotal: 675,
          desc: 'لا تشيل هم الإعداد — نجهّز لك كامل بيانات الحساب شامل التصميم ونسلّمه لك.',
          features: [
            { label: 'برنامج الولاء', on: true },
            { label: 'عدد عملاء غير محدود', on: true },
            { label: 'إرسال التنبيهات غير محدود', on: true },
            { label: 'روابط لفروعك', on: true },
            { label: 'ترحيب عند الموقع', on: true },
            { label: 'عدد ١ من الحسابات الفرعية', on: true },
            { label: 'عدد ١ من الحقول الإضافية', on: true },
            { label: 'ربط مع أنظمة نقاط البيع', on: false },
            { label: 'بطاقة إضافية', on: false },
            { label: 'كروت مسبقة الدفع', on: false },
          ],
        },
        {
          key: 'standard',
          name: 'الباقة القياسية',
          monthly: 165,
          annualMonthly: 124,
          annualTotal: 1485,
          recommended: true,
          desc: 'الخيار الأفضل لأغلب الأنشطة — كل ما تحتاجه لإدارة برنامج ولاء احترافي.',
          features: [
            { label: 'برنامج الولاء', on: true },
            { label: 'عدد عملاء غير محدود', on: true },
            { label: 'إرسال التنبيهات غير محدود', on: true },
            { label: 'روابط لفروعك', on: true },
            { label: 'ترحيب عند الموقع', on: true },
            { label: 'عدد ٢ بطاقات إضافية', on: true },
            { label: 'عدد ٥ من الحسابات الفرعية', on: true },
            { label: 'عدد ٣ من الحقول الإضافية', on: true },
            { label: 'ربط مع أنظمة نقاط البيع', on: true },
            { label: 'كروت مسبقة الدفع', on: false },
          ],
        },
        {
          key: 'pro',
          name: 'الباقة الاحترافية',
          monthly: 315,
          annualMonthly: 236,
          annualTotal: 2835,
          desc: 'بدون حدود — للأنشطة الكبيرة والسلاسل اللي تبي تنطلق.',
          features: [
            { label: 'برنامج الولاء', on: true },
            { label: 'عدد عملاء غير محدود', on: true },
            { label: 'إرسال التنبيهات غير محدود', on: true },
            { label: 'روابط لفروعك', on: true },
            { label: 'ترحيب عند الموقع', on: true },
            { label: 'عدد بطاقات غير محدود', on: true },
            { label: 'عدد غير محدود حسابات فرعية', on: true },
            { label: 'عدد غير محدود حقول فرعية', on: true },
            { label: 'ربط مع أنظمة نقاط البيع', on: true },
            { label: 'كروت مسبقة الدفع', on: true },
          ],
        },
      ],
    },
    footer: {
      copy: '2026 وايا.',
      links: { privacy: 'الخصوصية', terms: 'الشروط' },
      contact: 'تواصل معنا',
      email: 'hello@trywaya.com',
      whatsapp: 'واتساب',
    },
  },
  en: {
    nav: { cta: 'Start Free', pricing: 'Pricing', features: 'Features', how: 'How It Works', why: 'Why Waya', faq: 'FAQ', login: 'Log In', signup: 'Sign Up', logout: 'Log Out', hi: 'Hi', dashboard: 'Dashboard', subscription: 'Subscription' },
    auth: {
      loginTitle: 'Log In', loginSub: 'Sign in to manage your loyalty program',
      signupTitle: 'Create Account', signupSub: 'Sign up and start your free trial',
      email: 'Email', password: 'Password', name: 'Full name',
      emailPh: 'name@example.com', passwordPh: 'Enter your password', namePh: 'e.g. Ahmed Ali',
      loginBtn: 'Log In', signupBtn: 'Create My Account', googleBtn: 'Continue with Google', googleSignup: 'Sign up with Google', appleBtn: 'Continue with Apple', appleSignup: 'Sign up with Apple',
      or: 'or', forgot: 'Forgot password?', back: 'Home',
      noAccount: "Don't have an account?", hasAccount: 'Already have an account?', goSignup: 'Sign up', goLogin: 'Log in',
      errInvalid: 'Invalid email or password', errEmpty: 'Please enter email and password',
      errName: 'Enter your name', errEmail: 'Enter a valid email', errPassword: 'Password must be at least 6 characters',
      logging: 'Logging in...', signing: 'Creating account...',
      successTitle: 'Account created!', successMsg: 'Check your email and confirm your account to get started.',
      errEmailFirst: 'Enter your email first', resetSent: 'Password reset link sent to your email',
      otpTitle: 'Confirm your email', otpSub: 'We sent a 6-digit code to your email',
      otpLabel: 'Confirmation code', otpPh: '123456', otpBtn: 'Verify', otpVerifying: 'Verifying...',
      otpErrEmpty: 'Enter the code', otpErrInvalid: 'Invalid or expired code', otpResend: 'Resend code', otpResent: 'New code sent',
      resetTitle: 'New password', resetSub: 'Choose a strong password for your account',
      resetNewPass: 'New password', resetConfirmPass: 'Confirm password', resetNewPassPh: 'Enter new password',
      resetBtn: 'Save password', resetSaving: 'Saving...', resetErrMatch: 'Passwords do not match',
      resetSuccess: 'Password changed!', resetSuccessMsg: 'You can now log in with your new password.',
    },
    setup: {
      title: 'Set Up Your Shop', subtitle: 'Complete your shop info to get started',
      shopName: 'Shop Name', shopNamePh: 'e.g. Coffee Lounge',
      shopType: 'Business Type', shopTypePh: 'Select your type',
      types: ['Café', 'Restaurant', 'Salon', 'Grocery', 'Clothing', 'Electronics', 'Other'],
      phone: 'Phone', phonePh: '05xxxxxxxx',
      address: 'Address', addressPh: 'e.g. Riyadh, Al Nakheel',
      instagram: 'Instagram', twitter: 'Twitter',
      logo: 'Shop Logo', logoUpload: 'Choose image', logoHint: 'PNG or JPG, max 2MB',
      loyaltyTitle: 'Loyalty Program Settings',
      pointsPerVisit: 'Points per visit', rewardAt: 'Reward at', points: 'points',
      rewardDesc: 'Reward description', rewardDescPh: 'e.g. Free coffee',
      submit: 'Get Started', saving: 'Saving...',
      errName: 'Enter your shop name', errType: 'Select a business type',
    },
    dashboard: {
      title: 'Dashboard', welcome: 'Welcome',
      yourQR: 'Your Shop QR Code', qrHint: 'Print it and place at your counter — customers scan to collect points',
      journey: 'Customer Journey',
      step1: 'Scan QR', step2: 'Collect Points', step3: 'Get Notified', step4: 'Return & Redeem',
      activity: 'Recent Activity', noActivity: 'No activity yet — share your QR code with customers!',
      scan: 'Scan', reward: 'Reward', pointsEarned: 'points',
      home: 'Home', data: 'Data', loyalty: 'Loyalty', settings: 'Settings', logout: 'Log Out',
      navHome: 'Home', navData: 'Analytics', navLoyalty: 'Loyalty Program', navDesigner: 'Pass Designer', navScan: 'Scan & Redeem', navSettings: 'Settings',
      visitSite: 'Visit Website',
      createFirstCardTitle: 'Create your first card',
      createFirstCardSub: 'Design a loyalty card ready for Apple & Google Wallet in minutes.',
      createFirstCardCta: 'Start designing',
      scanTitle: 'Scan & Redeem',
      scanLookupLabel: 'Customer phone number',
      scanLookupPh: '05xxxxxxxx',
      scanLookupBtn: 'Lookup',
      scanNotFound: "We couldn't find a customer with that number.",
      scanStamps: 'Stamps',
      scanRequired: 'Needed for reward',
      scanAddStamp: 'Add stamp',
      scanRedeem: 'Redeem reward',
      scanSuccessAdd: 'Stamp added ✓',
      scanSuccessRedeem: 'Reward redeemed 🎉',
      scanError: 'Something went wrong, try again.',
      scanRedeemDisabled: 'Customer has not reached the reward yet.',
      statLabels: { customers: 'Active Customers', visits: 'Repeat Visits', revenue: 'Extra Revenue', rewards: 'Rewards Sent' },
    },
    dataPage: {
      title: 'Data & Analytics',
      customers: 'Customers', totalScans: 'Total Scans', rewardsRedeemed: 'Rewards Redeemed', totalPoints: 'Total Points',
      moreComingSoon: 'More analytics coming soon — charts, weekly reports, and more!',
    },
    loyaltyPage: {
      title: 'Loyalty Program',
      programSettings: 'Program Settings',
      pointsPerVisit: 'Points per visit', rewardAt: 'Reward at', points: 'points',
      rewardDesc: 'Reward description', rewardDescPh: 'e.g. Free coffee',
      save: 'Save Changes', saving: 'Saving...', saved: 'Saved ✓',
      cardDesign: 'Card Design',
      cardColor: 'Card Color',
      cardLogo: 'Shop Logo',
      cardLogoUpload: 'Upload Logo',
      cardLogoHint: 'PNG or JPG (square, under 1MB)',
      cardPreview: 'Card Preview',
      walletTitle: 'Google Wallet',
      walletDesc: 'Let your customers add their loyalty card directly to Google Wallet',
      walletTestBtn: 'Generate Test Pass',
      walletGenerating: 'Generating...',
      walletSuccess: 'Link created! Click the button to add the card',
      walletError: 'An error occurred',
      walletNotConfigured: 'Google Wallet is not configured yet. Contact support to activate.',
      walletCustomerLink: 'Customer Link',
      walletCopyLink: 'Copy Link',
      walletCopied: 'Copied ✓',
      customerName: 'Customer Name',
      customerPhone: 'Phone Number',
    },
    settingsPage: {
      title: 'Settings',
      shopInfo: 'Shop Information',
      account: 'Account', email: 'Email', joined: 'Joined',
      save: 'Save Changes', saving: 'Saving...', saved: 'Saved ✓',
    },
    hero: {
      title1: 'Your most expensive customer',
      title2: "is the one who doesn't return.",
      subtitle: 'Waya brings them back.',
      freeTrial: 'First 2 months FREE for founding businesses — no commitment — try it yourself',
      inputPlaceholder: 'Your email or phone number',
      storeNamePlaceholder: 'Your store name',
      industryPlaceholder: 'Industry',
      industries: ['Restaurant', 'Café', 'Salon', 'Laundry', 'Bakery', 'Grocery', 'Clothing', 'Other'],
      btn: 'Start Now',
      whatsapp: 'Contact us on WhatsApp',
      successMsg: 'Registered successfully! We\'ll be in touch soon',
      errorMsg: 'Please fill in all fields',
    },
    stats: [
      { value: '5–25x', label: 'Cost of acquiring a new customer vs. retaining an existing one' },
      { value: '+18%', label: 'Increase in spending from loyalty program members' },
      { value: '60–70%', label: 'Purchase probability from existing customer vs. 5-20% from new' },
      { value: '4.8x', label: 'Higher spending from emotionally connected customers' },
    ],
    how: {
      badge: 'How It Works',
      title: 'Five steps and you\'re live. No dedicated device. No waiting.',
      subtitle: 'From signup to the first reward — everything is clear and simple.',
      steps: [
        { title: 'Sign up & set everything up', desc: 'Create your account, download the app, choose your reward style (stamps, points, or cashback), and customize the branding. Ready in minutes.' },
        { title: 'Print QR code & place it in your store', desc: 'Print the code and place it on the counter or table. Customers scan it with their phone — no download needed on their end.' },
        { title: 'Customer signs up & starts collecting', desc: 'Once they scan the code, they register in seconds and start earning points or stamps from their very first visit.' },
        { title: 'Customer returns — cashier scans from the app', desc: 'When the customer comes back, the cashier opens the Waya app and scans the QR code from the customer\'s phone. Points are added automatically.' },
        { title: 'Reward arrives — customer keeps coming back', desc: 'Once they reach the goal, the reward drops automatically. The customer feels valued and returns — and you track everything from the dashboard.' },
      ],
    },
    features: {
      title: 'Everything you need. Nothing you don\'t.',
      subtitle: 'Tools designed to bring your customers back — without complicating your work.',
      dashboard: 'Loyalty System Dashboard',
      dashStats: [
        { label: 'Revenue Growth', value: '14.2K SAR', change: '+22%' },
        { label: 'Repeat Visits', value: '67%', change: '+8%' },
        { label: 'Rewards Sent', value: '3,891', change: '+34%' },
        { label: 'Active Customers', value: '1,247', change: '+12%' },
      ],
      items: [
        { icon: 'bell', title: 'Smart Notifications', desc: 'The right notification at the right time reminds your customer to come back.' },
        { icon: 'chart', title: 'Clear & Simple Analytics', desc: 'Know your regulars, which rewards work, and when a customer starts drifting away.' },
        { icon: 'share', title: 'Built-in Referral Loop', desc: 'Your customer shares, their friend signs up, both earn. Organic growth, zero budget.' },
        { icon: 'calendar', title: 'Seasonal Campaigns Ready', desc: 'Ramadan, Eid, National Day — ready-made templates you activate with one click.' },
      ],
    },
    audience: {
      badge: 'Who Is Waya For?',
      title: 'For every store that wants customers to come back',
      subtitle: 'Whatever your business, Waya fits.',
      items: [
        { label: 'Cafés' },
        { label: 'Restaurants' },
        { label: 'Salons' },
        { label: 'Barbershops' },
        { label: 'Laundry' },
        { label: 'Retail Stores' },
      ],
    },
    demo: {
      badge: 'See It In Action',
      title: 'A Quick Tour Inside Waya',
      subtitle: 'From your dashboard to the customer experience — everything is clear and simple.',
      steps: [
        { label: 'Register your store', desc: 'Choose your business type, upload your logo, and set rewards. Ready in minutes.' },
        { label: 'Share the code', desc: 'Print the QR or share it digitally. Customers scan with their phone and start earning — no download needed.' },
        { label: 'Track results', desc: 'See who returned, who is close to a reward, and who needs a reminder notification.' },
        { label: 'Reward & repeat', desc: 'Rewards are delivered automatically, and customers come back. A loyalty loop that never stops.' },
      ],
      dashboardTitle: 'Waya Dashboard',
      metrics: [
        { icon: 'users', value: '1,247', label: 'Active Customers', trend: '+12%' },
        { icon: 'repeat', value: '67%', label: 'Repeat Visits', trend: '+8%' },
        { icon: 'gift', value: '3,891', label: 'Rewards Sent', trend: '+34%' },
        { icon: 'sar', value: '14.2K', label: 'Added Revenue', trend: '+22%' },
      ],
      customerJourney: 'Customer Journey',
      journeySteps: ['Scans QR', 'Earns Points', 'Gets Notified', 'Returns & Redeems'],
      cta: 'Ready to try? Start free',
    },
    walletCards: {
      title: 'Digital loyalty cards with your branding',
      subtitle: 'Each card reflects your store identity — coffee, salon, or any business.',
    },
    calculator: {
      badge: 'Calculate It Yourself',
      title: 'How much will Waya increase your revenue?',
      subtitle: 'Move the sliders and see the difference — based on real data from merchants like you.',
      customersLabel: 'Monthly Customers',
      avgOrderLabel: 'Average Order Value (SAR)',
      withoutTitle: 'Without Waya',
      withTitle: 'With Waya',
      monthlyRevenue: 'Monthly Revenue',
      repeatVisits: 'Repeat Visits',
      avgTicket: 'Avg. Ticket',
      extraRevenue: 'Extra Monthly Revenue',
      roi: 'Return on Investment',
      currency: 'SAR',
      perMonth: '/ month',
      xReturn: 'x return',
      wayaCost: 'Waya Cost',
      netProfit: 'Net Extra Profit',
      cta: 'Start now and see the difference',
    },
    whyWaya: {
      badge: 'Why Waya',
      title: 'Why Waya is the best loyalty program for your shop',
      subtitle: 'Three reasons you won\'t need to think twice.',
      points: [
        { title: 'Grows your sales',      desc: 'Customers come back more often and spend more — up to +18% average ticket and +32% repeat visits.' },
        { title: 'No app to download',    desc: 'Your card lives directly in Apple Wallet & Google Wallet — zero friction, nothing for your customer to install.' },
        { title: 'Plugs into your stack', desc: 'Native integrations with Foodics, Zid, Salla, and other POS systems — points post automatically after each receipt.' },
      ],
    },
    faq: {
      badge: 'FAQ',
      title: 'Everything you need to know',
      items: [
        { q: 'How many customers do I need before I start?',      a: "It doesn't matter — even 10 customers work. The point is getting your existing customers to come back, not finding new ones." },
        { q: 'Does my customer need to install an app?',          a: 'No. The pass goes straight into their Apple Wallet or Google Wallet. They open their wallet and see their balance.' },
        { q: 'How long does setup take?',                         a: 'A few minutes. Register your shop, design your card, and share the QR code with customers.' },
        { q: 'Can I cancel anytime?',                             a: "Yes, no contract. Cancel from the dashboard; the service stays active until the end of the current billing period." },
        { q: 'Which POS systems are supported?',                  a: 'Foodics, Zid, Salla, Rewaa, and Odoo today. If you use something else, contact us and we\'ll add it for you.' },
        { q: 'Is my data safe?',                                  a: "Everything is encrypted, stored on Supabase, and we never sell or share your data with any third party." },
      ],
    },
    comparison: {
      badge: 'Why Waya?',
      title: 'What if loyalty programs weren\'t just for the big chains?',
      without: {
        header: 'Without Waya',
        items: [
          'Spend on ads without knowing who came back',
          'Customers leave for chains that reward them',
          'Can\'t tell a regular from a one-time visitor',
          'Need a developer or months to build something',
          'Seasons pass while you\'re too busy',
          'Every customer walks away and you can\'t bring them back',
        ],
      },
      with: {
        header: 'With Waya',
        items: [
          'Customers return — because they have a reason to',
          'Compete with chains using a loyalty system at their level',
          'Know every customer by name and habit',
          'Launch your program in minutes — no code needed',
          'Ramadan & Eid campaigns ready with one click',
          'Reach your customer before they disappear',
        ],
      },
    },
    socialProof: {
      title: 'Numbers that speak',
      subtitle: 'From the first month, merchants saw the difference.',
      items: [
        { value: '+477', label: 'Registered stores', desc: 'Merchants who chose Waya to manage customer loyalty' },
        { value: '+32%', label: 'Increase in repeat visits', desc: 'Customers return more after activating the program' },
        { value: '+18%', label: 'Rise in average ticket', desc: 'Higher spending from rewarded customers' },
      ],
    },
    pricing: {
      badge: 'Pricing',
      title: 'Clear pricing. No surprises. Measurable ROI.',
      foundingBanner: 'Completely FREE for 2 months for founding businesses',
      foundingSub: 'Start at zero cost — only pay when you see results',
      monthly: {
        label: 'Monthly Plan',
        price: '75',
        unit: 'SAR / month',
        note: 'No commitment — cancel anytime',
      },
      annual: {
        label: 'Annual Plan',
        badge: '50% OFF',
        price: '37',
        oldPrice: '75',
        unit: 'SAR / month',
        note: 'Billed 450 SAR/year — save 450 SAR',
      },
      features: [
        'Unlimited campaigns',
        'Smart customer notifications',
        'Full dashboard',
        'Analytics & reports',
        'Built-in referral loop',
        'Ramadan & Eid templates',
        'Arabic support team',
      ],
      cta: 'Start Now',
    },
    cta: {
      title: 'Your next customer could be the last visit — or the first relationship.',
      subtitle: 'Start free. No card. No commitment. See the difference from week one.',
      btn: 'Start Your Free Trial',
    },
    explainer: {
      badge: 'What is Waya?',
      problem: {
        label: 'The problem',
        text: 'A customer walks in, loves you, and disappears. You have no way to bring them back.',
      },
      waya: {
        label: 'Waya',
        text: 'A digital loyalty card that lives in your customer\'s phone — no app required.',
      },
      how: {
        label: 'How it works',
        text: 'Each visit earns points. Points turn into a reward. The reward brings them back.',
      },
    },
    cardTypes: {
      badge: 'How It Works',
      title: 'How does the card work?',
      steps: [
        { num: '01', title: 'Step One', desc: 'Point your phone camera at the QR code at the counter.' },
        { num: '02', title: 'Step Two', desc: 'Quick signup in seconds — no app download required.' },
        { num: '03', title: 'Step Three', desc: 'Add the card straight to Apple Wallet or Google Wallet.' },
      ],
      typesTitle: 'Card Types',
      tabs: [
        { key: 'stamp', label: 'Stamps' },
        { key: 'points', label: 'Points' },
        { key: 'cashback', label: 'Cashback' },
        { key: 'subscription', label: 'Subscription' },
        { key: 'discount', label: 'Discount' },
        { key: 'gift', label: 'Gift' },
        { key: 'membership', label: 'Membership' },
      ],
      details: {
        stamp: { title: 'Stamp Card', desc: 'Customers collect stamps each visit — when complete, they get a reward on their next visit.' },
        points: { title: 'Points Card', desc: 'Every receipt turns into points customers redeem on rewards they actually love.' },
        cashback: { title: 'Cashback Card', desc: 'Part of each bill returns as balance for the customer to spend on their next visit.' },
        subscription: { title: 'Subscription Card', desc: 'Monthly or yearly subscription with fixed perks — recurring revenue and guaranteed loyalty.' },
        discount: { title: 'Discount Card', desc: 'Fixed member discount every visit — no complicated promos.' },
        gift: { title: 'Gift Card', desc: 'Gift balance or a product to a friend with one tap — delivered straight to their phone.' },
        membership: { title: 'Membership Card', desc: 'Digital VIP membership that identifies your top customers and gives them priority.' },
      },
    },
    whoWeServe: {
      badge: 'Who We Serve',
      title: 'Who we serve',
      cta: 'Contact us to learn how we can serve your business',
      items: [
        { emoji: '🍽️', label: 'Restaurants' },
        { emoji: '💅', label: 'Nail & Beauty Centers' },
        { emoji: '💆', label: 'Massage Centers' },
        { emoji: '☕', label: 'Cafés & Coffee Shops' },
        { emoji: '🚘', label: 'Car Washes' },
        { emoji: '🏥', label: 'Clinics & Medical Centers' },
        { emoji: '💇', label: 'Hair Salons' },
        { emoji: '🏋️', label: 'Gyms & Fitness' },
        { emoji: '🛍️', label: 'Retail Stores' },
        { emoji: '➕', label: 'And many more' },
      ],
    },
    posIntegrations: {
      badge: 'Easier governance!',
      title1: 'We integrate with the most popular',
      title2: 'POS Systems',
      subtitle: '',
      ctaQuestion: 'Using an unsupported POS system?',
      ctaBtn: 'Contact us — we\'re ready to integrate',
      logos: [
        { name: 'Foodics', src: '/Foodics_id-xUyauWo_0.svg' },
        { name: 'Odoo', src: '/Odoo_id34J-r875_0.svg' },
        { name: 'Zid' },
        { name: 'Salla' },
        { name: 'Rewaa' },
        { name: 'Marn' },
        { name: 'Lightspeed' },
      ],
    },
    partners: {
      badge: 'We work with you',
      title: 'Join our partners',
      logos: ['dIPd', 'DRIVE', 'Nawa', 'hjeen', 'BAC', 'MORFi', 'IRIS', 'Bocelli', 'OAKBERRY'],
    },
    pricingFounding: {
      badge: 'Pricing',
      title: 'Founding Plan',
      subtitle: 'One plan with everything — tailored for new business owners.',
      price: '85',
      sar: 'SAR',
      perMonth: 'per month',
      recommended: 'Current offer',
      freeTrial: 'First 2 months free',
      featuresTitle: 'Includes',
      features: [
        'First 2 months free',
        'Unlimited cards',
        'Custom card design',
        'Unlimited customers',
        'Full dashboard',
        'Import customers from Excel',
      ],
      soonTitle: 'Coming soon',
      soonFeatures: [
        'Unlimited notifications',
        'Popular POS integrations',
      ],
      cta: 'Subscribe Now',
    },
    pricingTiers: {
      badge: 'Pricing Plans',
      title: 'Explore our plans',
      subtitle: "Don't worry about setup — we'll prepare your full account including design and deliver it to you.",
      monthly: 'Monthly',
      annual: 'Annual — 25% off',
      recommended: 'Recommended',
      annualLabel: 'Annual cost',
      perMonth: 'SAR / month',
      sar: 'SAR',
      ctaSubscribe: 'Subscribe Now',
      ctaTrial: 'Try it free for 2 weeks',
      plans: [
        {
          key: 'basic',
          name: 'Basic Plan',
          monthly: 75,
          annualMonthly: 56,
          annualTotal: 675,
          desc: "Don't worry about setup — we'll prepare your full account including design and deliver it to you.",
          features: [
            { label: 'Loyalty program', on: true },
            { label: 'Unlimited customers', on: true },
            { label: 'Unlimited notifications', on: true },
            { label: 'Branch links', on: true },
            { label: 'Location welcome', on: true },
            { label: '1 sub-account', on: true },
            { label: '1 extra field', on: true },
            { label: 'POS integration', on: false },
            { label: 'Extra card', on: false },
            { label: 'Prepaid cards', on: false },
          ],
        },
        {
          key: 'standard',
          name: 'Standard Plan',
          monthly: 165,
          annualMonthly: 124,
          annualTotal: 1485,
          recommended: true,
          desc: 'The best fit for most businesses — everything you need to run a pro loyalty program.',
          features: [
            { label: 'Loyalty program', on: true },
            { label: 'Unlimited customers', on: true },
            { label: 'Unlimited notifications', on: true },
            { label: 'Branch links', on: true },
            { label: 'Location welcome', on: true },
            { label: '2 extra cards', on: true },
            { label: '5 sub-accounts', on: true },
            { label: '3 extra fields', on: true },
            { label: 'POS integration', on: true },
            { label: 'Prepaid cards', on: false },
          ],
        },
        {
          key: 'pro',
          name: 'Professional Plan',
          monthly: 315,
          annualMonthly: 236,
          annualTotal: 2835,
          desc: 'No limits — for larger businesses and chains ready to scale.',
          features: [
            { label: 'Loyalty program', on: true },
            { label: 'Unlimited customers', on: true },
            { label: 'Unlimited notifications', on: true },
            { label: 'Branch links', on: true },
            { label: 'Location welcome', on: true },
            { label: 'Unlimited cards', on: true },
            { label: 'Unlimited sub-accounts', on: true },
            { label: 'Unlimited extra fields', on: true },
            { label: 'POS integration', on: true },
            { label: 'Prepaid cards', on: true },
          ],
        },
      ],
    },
    footer: {
      copy: '2026 Waya.',
      links: { privacy: 'Privacy', terms: 'Terms' },
      contact: 'Contact Us',
      email: 'hello@trywaya.com',
      whatsapp: 'WhatsApp',
    },
  },
}

/* ─── Apple-style scroll-reveal with blur ─── */
function Reveal({ children, delay = 0, direction = 'up', className = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 40 : direction === 'down' ? -40 : 0,
      x: direction === 'right' ? -40 : direction === 'left' ? 40 : 0,
      filter: 'blur(10px)',
    },
    visible: {
      opacity: 1, y: 0, x: 0, filter: 'blur(0px)',
      transition: {
        duration: 0.8,
        delay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <motion.div ref={ref} className={className} initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={variants}>
      {children}
    </motion.div>
  )
}

/* ─── Apple-style text reveal (word by word) ─── */
function TextReveal({ children, delay = 0, className = '' }) {
  if (typeof children !== 'string') {
    return <Reveal delay={delay} className={className}>{children}</Reveal>
  }

  const words = children.split(' ')

  return (
    <span className={className} style={{ display: 'inline' }}>
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            // Arabic glyphs extend above/below the line-box; pad the clip-rect
            // and offset with negative margin so layout isn't perturbed.
            paddingTop: '0.25em',
            paddingBottom: '0.15em',
            marginTop: '-0.25em',
            marginBottom: '-0.15em',
            verticalAlign: 'baseline',
          }}
        >
          <motion.span
            style={{ display: 'inline-block' }}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: delay + i * 0.04,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  )
}

/* ─── Counting number animation ─── */
function CountUp({ value, duration = 2, delay = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(value)
  const hasRun = useRef(false)

  useEffect(() => {
    if (!isInView || hasRun.current) return
    hasRun.current = true

    const numericMatch = value.match(/^([^0-9]*)([\d,.]+)(.*)$/)
    if (!numericMatch) { setDisplay(value); return }

    const prefix = numericMatch[1]
    const numStr = numericMatch[2]
    const suffix = numericMatch[3]
    const target = parseFloat(numStr.replace(/,/g, ''))
    if (isNaN(target)) { setDisplay(value); return }
    const hasCommas = numStr.includes(',')
    const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0

    const startTime = performance.now() + delay * 1000
    const animate = (now) => {
      const elapsed = Math.max(0, now - startTime)
      const progress = Math.min(elapsed / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      const current = eased * target
      let formatted = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString()
      if (hasCommas) formatted = Number(formatted).toLocaleString()
      setDisplay(`${prefix}${formatted}${suffix}`)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isInView, value, duration, delay])

  return <span ref={ref}>{display}</span>
}

/* ─── Magnetic hover button ─── */
function MagneticWrap({ children, strength = 0.3 }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleMove = (e) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left - rect.width / 2) * strength
    const y = (e.clientY - rect.top - rect.height / 2) * strength
    setPos({ x, y })
  }

  const handleLeave = () => setPos({ x: 0, y: 0 })

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.5 }}
      style={{ display: 'inline-block' }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Parallax scroll layer ─── */
function ParallaxLayer({ children, speed = 0.5, className = '' }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, speed * -100])

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  )
}

/* ─── Logo ─── */
function Logo({ size = 34 }) {
  return <img src="/Arabic Letters Midjourney (1).svg" alt="وايا" style={{ height: size, width: 'auto' }} />
}

/* ─── Icons ─── */
function CheckIcon({ color = '#10B981' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M16.5 5.5L7.5 14.5L3.5 10.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M13 5L5 13M5 5L13 13" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function StoreIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function QRIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function SarSymbol({ size = '0.9em', style, className }) {
  return (
    <svg
      viewBox="0 0 1124.14 1256.39"
      width={size}
      height={size}
      fill="currentColor"
      style={{ display: 'inline-block', verticalAlign: '-0.08em', ...style }}
      className={className}
      role="img"
      aria-label="SAR"
    >
      <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>
      <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/>
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

const featureIcons = { bell: <BellIcon />, chart: <ChartIcon />, share: <ShareIcon />, calendar: <CalendarIcon /> }

/* ─── Nav Auth Buttons ─── */
function NavAuthButtons({ t }) {
  const { user, signOut } = useAuth()
  if (user) {
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
    return (
      <div className="nav-auth">
        <span className="nav-greeting">{t.nav.hi}, {name}</span>
        <button onClick={() => navigate('/billing')} className="nav-auth-btn nav-login-btn">{t.nav.subscription}</button>
        <button onClick={() => navigate('/dashboard')} className="nav-auth-btn nav-signup-btn">{t.nav.dashboard}</button>
        <button onClick={async () => { await signOut(); navigate('/') }} className="nav-auth-btn nav-logout-btn">{t.nav.logout}</button>
      </div>
    )
  }
  return (
    <div className="nav-auth">
      <button onClick={() => navigate('/login')} className="nav-auth-btn nav-login-btn">{t.nav.login}</button>
      <button onClick={() => navigate('/signup')} className="nav-auth-btn nav-signup-btn">{t.nav.signup}</button>
    </div>
  )
}

function MobileAuthButtons({ t, closeMenu }) {
  const { user, signOut } = useAuth()
  if (user) {
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
    return (
      <>
        <span className="mobile-drawer-greeting">{t.nav.hi}, {name}</span>
        <button onClick={() => { navigate('/dashboard'); closeMenu() }} className="mobile-drawer-auth">{t.nav.dashboard}</button>
        <button onClick={() => { navigate('/billing'); closeMenu() }} className="mobile-drawer-cta">{t.nav.subscription}</button>
        <button onClick={async () => { await signOut(); navigate('/'); closeMenu() }} className="mobile-drawer-auth">{t.nav.logout}</button>
      </>
    )
  }
  return (
    <>
      <button onClick={() => { navigate('/login'); closeMenu() }} className="mobile-drawer-auth">{t.nav.login}</button>
      <button onClick={() => { navigate('/signup'); closeMenu() }} className="mobile-drawer-cta">{t.nav.signup}</button>
    </>
  )
}

/* ─── Navbar ─── */
function Navbar({ lang, setLang, theme, setTheme, t }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close mobile menu on scroll or link click
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const closeMenu = () => setMobileOpen(false)

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -40, opacity: 0, filter: 'blur(10px)' }}
      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="nav-pill">
        <a
          href="/"
          className="nav-logo"
          onClick={(e) => {
            e.preventDefault()
            navigate('/')
          }}
          aria-label="Waya home"
        >
          <Logo size={72} />
        </a>
        <div className="nav-links">
          <a href="#why">{t.nav.why}</a>
          <a href="#how">{t.nav.how}</a>
          <a href="#pricing">{t.nav.pricing}</a>
          <a href="#faq">{t.nav.faq}</a>
        </div>
        <div className="nav-left-group">
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="lang-toggle" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <GlobeIcon />
            <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
          <NavAuthButtons t={t} />
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-drawer"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <a href="#why" onClick={closeMenu}>{t.nav.why}</a>
            <a href="#how" onClick={closeMenu}>{t.nav.how}</a>
            <a href="#pricing" onClick={closeMenu}>{t.nav.pricing}</a>
            <a href="#faq" onClick={closeMenu}>{t.nav.faq}</a>
            <MobileAuthButtons t={t} closeMenu={closeMenu} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

/* ─── Signup Form (shared between Hero and CTA) ─── */
function SignupForm({ t, id }) {
  // Used to be a 3-field lead-capture form; replaced with a direct CTA
  // that takes visitors straight to /signup. Keeping the same component
  // name + className hooks so existing layout / animation code still works.
  return (
    <div className="hero-form" id={id}>
      <button
        type="button"
        className="hero-btn"
        onClick={() => navigate('/signup')}
      >
        {t.hero.btn}
      </button>

      <a href="https://wa.me/966509076104" target="_blank" rel="noopener noreferrer" className="hero-whatsapp-btn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        <span>{t.hero.whatsapp}</span>
      </a>
    </div>
  )
}

/* ─── Hero ─── */
function Hero({ t }) {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, -120])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.6], [1, 0.95])

  return (
    <section className="hero" ref={heroRef}>
      <motion.div className="hero-glow" animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="hero-glow-2" animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />

      <motion.div className="hero-inner" style={{ y, opacity, scale }}>
        <motion.div
          className="hero-image-side"
          initial={{ opacity: 0, x: -60, filter: 'blur(20px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-image-container">
            <motion.img
              src="/hero.png"
              alt="وايا"
              className="hero-image"
              initial={{ scale: 1.15, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="floating-bubble floating-bubble-1"
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
              transition={{ opacity: { delay: 1.2, duration: 0.5 }, scale: { delay: 1.2, duration: 0.5, type: 'spring' }, y: { delay: 1.7, duration: 3.5, repeat: Infinity, ease: 'easeInOut' } }}
            >
              <img src="/icon-monitoring.svg" alt="" width="24" height="24" />
            </motion.div>
            <motion.div
              className="floating-bubble floating-bubble-2"
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: [0, 10, 0] }}
              transition={{ opacity: { delay: 1.4, duration: 0.5 }, scale: { delay: 1.4, duration: 0.5, type: 'spring' }, y: { delay: 1.9, duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
            >
              <img src="/icon-favorite.svg" alt="" width="24" height="24" />
            </motion.div>
            <motion.div
              className="floating-bubble floating-bubble-3"
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
              transition={{ opacity: { delay: 1.6, duration: 0.5 }, scale: { delay: 1.6, duration: 0.5, type: 'spring' }, y: { delay: 2.1, duration: 4.5, repeat: Infinity, ease: 'easeInOut' } }}
            >
              <img src="/icon-leaderboard.svg" alt="" width="24" height="24" />
            </motion.div>
          </div>
        </motion.div>

        <div className="hero-text-side">
          <motion.h1 className="hero-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.01 }}>
            <span className="text-cream"><TextReveal delay={0.1}>{t.hero.title1}</TextReveal> </span>
            <span className="text-green hero-gradient-text"><TextReveal delay={0.3}>{t.hero.title2}</TextReveal></span>
          </motion.h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            className="hero-explainer-grid"
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero-explainer-card hero-explainer-problem">
              <span className="hero-explainer-icon" aria-hidden>❓</span>
              <span className="hero-explainer-label">{t.explainer.problem.label}</span>
              <p className="hero-explainer-text">{t.explainer.problem.text}</p>
            </div>
            <div className="hero-explainer-card hero-explainer-waya">
              <span className="hero-explainer-icon" aria-hidden>💚</span>
              <span className="hero-explainer-label">{t.explainer.waya.label}</span>
              <p className="hero-explainer-text">{t.explainer.waya.text}</p>
            </div>
            <div className="hero-explainer-card hero-explainer-how">
              <span className="hero-explainer-icon" aria-hidden>→</span>
              <span className="hero-explainer-label">{t.explainer.how.label}</span>
              <p className="hero-explainer-text">{t.explainer.how.text}</p>
            </div>
          </motion.div>

          <motion.div
            className="hero-free-badge"
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.hero.freeTrial}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <SignupForm t={t} id="hero-signup" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

/* ─── Stats Bar ─── */
function StatsBar({ t }) {
  return (
    <section className="stats-bar-section">
      <div className="stats-bar-inner">
        {t.stats.map((stat, i) => (
          <Reveal key={i} delay={i * 0.12}>
            <div className="stats-bar-item">
              <span className="stats-bar-value">
                <CountUp value={stat.value} duration={2.5} delay={i * 0.15} />
              </span>
              <span className="stats-bar-label">{stat.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── Step Icons for How It Works ─── */
function DownloadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

function PrintIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
    </svg>
  )
}

function ScanIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7V2h5"/><path d="M17 2h5v5"/><path d="M22 17v5h-5"/><path d="M7 22H2v-5"/><rect x="7" y="7" width="10" height="10" rx="1"/>
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  )
}

/* ─── How It Works ─── */
function HowItWorks({ t }) {
  const stepIcons = [
    <DownloadIcon key={0} />,
    <PrintIcon key={1} />,
    <QRIcon key={2} />,
    <ScanIcon key={3} />,
    <GiftIcon key={4} />,
  ]

  return (
    <section className="section" id="how">
      <Reveal>
        <div className="section-badge">{t.how.badge}</div>
        <h2 className="section-title">{t.how.title}</h2>
        <p className="section-subtitle">{t.how.subtitle}</p>
      </Reveal>

      <div className="steps-grid steps-grid-5">
        {t.how.steps.map((step, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <motion.div
              className="step-card"
              whileHover={{ y: -10, boxShadow: '0 25px 60px rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <motion.div className="step-icon" whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                {stepIcons[i]}
              </motion.div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
              <span className="step-number">{i + 1}</span>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── Features + Dashboard ─── */
function Features({ t }) {
  return (
    <section className="section" id="features">
      <Reveal>
        <h2 className="section-title">{t.features.title}</h2>
        <p className="section-subtitle">{t.features.subtitle}</p>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="dashboard-card">
          <div className="dashboard-header">
            <span className="dashboard-label">{t.features.dashboard}</span>
          </div>
          <div className="stats-grid">
            {t.features.dashStats.map((stat, i) => (
              <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}>
                <div className="stat-card-header">
                  <span className="stat-card-label">{stat.label}</span>
                  <span className="stat-card-change">{stat.change}</span>
                </div>
                <span className="stat-card-value">{stat.value}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="features-grid">
        {t.features.items.map((feat, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <motion.div
              className="feature-card"
              whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.25)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <motion.div className="feature-icon" whileHover={{ scale: 1.12 }} transition={{ type: 'spring', stiffness: 400, damping: 12 }}>
                {featureIcons[feat.icon]}
              </motion.div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── Audience Industry Icons ─── */
const audienceIcons = {
  coffee: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="audience-icon">
      <path d="M12 18h32v4a20 20 0 01-20 20h-2A10 10 0 0112 32V18z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M44 22h4a6 6 0 010 12h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 50h26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M22 10c0-2 2-4 0-6M28 10c0-2 2-4 0-6M34 10c0-2 2-4 0-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  restaurant: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="audience-icon">
      <path d="M18 8v16c0 4 4 8 8 8h2v24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 20h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 8v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M42 8v48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M42 8c0 12-6 14-6 24h12c0-10-6-12-6-24z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  salon: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="audience-icon">
      <path d="M20 12c8 6 6 16 14 20s16-2 16-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 12c-4 14 2 22 14 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
      <circle cx="16" cy="44" r="8" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M16 52v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M44 28l6 6M44 34l6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),
  barbershop: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="audience-icon">
      <rect x="22" y="6" width="20" height="52" rx="10" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M22 16c10 8 10 16 20 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M22 24c10 8 10 16 20 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M22 8c10 8 10 16 20 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
      <circle cx="32" cy="10" r="2" fill="currentColor" opacity="0.3"/>
      <circle cx="32" cy="54" r="2" fill="currentColor" opacity="0.3"/>
    </svg>
  ),
  laundry: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="audience-icon">
      <rect x="12" y="6" width="40" height="52" rx="4" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="32" cy="36" r="12" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M26 34c2-3 6-3 8 0s6 3 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <line x1="18" y1="18" x2="46" y2="18" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="20" cy="12" r="2" fill="currentColor" opacity="0.4"/>
      <circle cx="26" cy="12" r="2" fill="currentColor" opacity="0.4"/>
    </svg>
  ),
  retailer: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="audience-icon">
      <path d="M8 24h48l-4-14H12L8 24z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 24v28h48V24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="24" y="38" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M16 24c0 4 3.6 7 8 7s8-3 8-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <path d="M32 24c0 4 3.6 7 8 7s8-3 8-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),
}

/* ─── Who Is Waya For ─── */
function Audience({ t }) {
  const iconKeys = ['coffee', 'restaurant', 'salon', 'barbershop', 'laundry', 'retailer']
  return (
    <section className="section audience-section">
      <Reveal>
        <div className="section-badge">{t.audience.badge}</div>
        <h2 className="section-title">{t.audience.title}</h2>
        <p className="section-subtitle">{t.audience.subtitle}</p>
      </Reveal>

      <div className="audience-grid">
        {t.audience.items.map((item, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <motion.div
              className="audience-card"
              whileHover={{ y: -10, scale: 1.04, boxShadow: '0 20px 50px rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.35)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            >
              <motion.div className="audience-icon-wrap" whileHover={{ scale: 1.15, rotate: -5 }} transition={{ type: 'spring', stiffness: 400, damping: 12 }}>
                {audienceIcons[iconKeys[i]]}
              </motion.div>
              <span className="audience-label">{item.label}</span>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── Product Demo / Showcase ─── */
function DemoMetricIcon({ type }) {
  if (type === 'users') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )
  if (type === 'repeat') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
  )
  if (type === 'gift') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
  )
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  )
}

function ProductDemo({ t }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % t.demo.steps.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [t.demo.steps.length])

  return (
    <section className="section demo-section" id="demo">
      <Reveal>
        <div className="section-badge">{t.demo.badge}</div>
        <h2 className="section-title">{t.demo.title}</h2>
        <p className="section-subtitle">{t.demo.subtitle}</p>
      </Reveal>

      <div className="demo-layout">
        {/* Interactive Steps */}
        <Reveal delay={0.1} direction="right">
          <div className="demo-steps-panel">
            {t.demo.steps.map((step, i) => (
              <motion.div
                key={i}
                className={`demo-step ${activeStep === i ? 'demo-step-active' : ''}`}
                onClick={() => setActiveStep(i)}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="demo-step-num">{i + 1}</div>
                <div className="demo-step-content">
                  <h4 className="demo-step-label">{step.label}</h4>
                  <AnimatePresence mode="wait">
                    {activeStep === i && (
                      <motion.p
                        className="demo-step-desc"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {step.desc}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                {activeStep === i && <motion.div className="demo-step-bar" layoutId="demoBar" />}
              </motion.div>
            ))}
          </div>
        </Reveal>

        {/* Dashboard Preview */}
        <Reveal delay={0.2} direction="left">
          <div className="demo-preview">
            <div className="demo-preview-header">
              <div className="demo-preview-dots">
                <span /><span /><span />
              </div>
              <span className="demo-preview-title">{t.demo.dashboardTitle}</span>
            </div>

            <div className="demo-metrics-grid">
              {t.demo.metrics.map((metric, i) => (
                <motion.div
                  key={i}
                  className="demo-metric-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <div className="demo-metric-icon">
                    <DemoMetricIcon type={metric.icon} />
                  </div>
                  <span className="demo-metric-value">{metric.value}</span>
                  <span className="demo-metric-label">{metric.label}</span>
                  <span className="demo-metric-trend">{metric.trend}</span>
                </motion.div>
              ))}
            </div>

            {/* Customer Journey Flow */}
            <div className="demo-journey">
              <span className="demo-journey-title">{t.demo.customerJourney}</span>
              <div className="demo-journey-flow">
                {t.demo.journeySteps.map((step, i) => (
                  <motion.div
                    key={i}
                    className="demo-journey-step"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                  >
                    <span className="demo-journey-num">{i + 1}</span>
                    <span className="demo-journey-label">{step}</span>
                    {i < t.demo.journeySteps.length - 1 && (
                      <svg className="demo-journey-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5"><polyline points="9 18 15 12 9 6"/></svg>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.3}>
        <div className="demo-cta-wrap">
          <a href="#cta" className="demo-cta-btn">{t.demo.cta}</a>
        </div>
      </Reveal>
    </section>
  )
}

/* ─── Wallet Cards Showcase ─── */
function WalletCards({ t }) {
  const cards = [
    { src: '/Apple Wallet Pass coffee.svg', alt: 'Coffee loyalty card' },
    { src: '/Apple Wallet Pass salon.svg', alt: 'Salon loyalty card' },
    { src: '/Apple Wallet Pass Kit Coupon.png', alt: 'Coupon card' },
  ]

  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })
  const rotations = [-6, 0, 6]

  return (
    <section className="section wallet-section" id="how" ref={sectionRef}>
      <Reveal>
        <h2 className="section-title">{t.walletCards.title}</h2>
        <p className="section-subtitle">{t.walletCards.subtitle}</p>
      </Reveal>

      <div className="wallet-cards-row" style={{ perspective: '1200px' }}>
        {cards.map((card, i) => (
          <motion.div
            key={i}
            className="wallet-card-wrap"
            initial={{ opacity: 0, y: 80, rotateY: -15, scale: 0.85 }}
            animate={isInView ? { opacity: 1, y: 0, rotateY: rotations[i], scale: 1 } : {}}
            transition={{
              duration: 1,
              delay: 0.2 + i * 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ y: -16, rotateY: 0, scale: 1.05, boxShadow: '0 30px 80px rgba(16,185,129,0.12)' }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <img src={card.src} alt={card.alt} className="wallet-card-img" />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/* ─── Why Waya ─── */
function WhyWaya({ t, lang }) {
  const w = t.whyWaya
  return (
    <section className="section why-waya-section" id="why">
      <Reveal>
        <div className="section-badge">{w.badge}</div>
        <div className="why-waya-logo">
          <Logo size={140} />
        </div>
        <h2 className="section-title">{w.title}</h2>
        <p className="section-subtitle">{w.subtitle}</p>
      </Reveal>
      <div className="why-waya-grid">
        {w.points.map((p, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <motion.div
              className="why-waya-card"
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.35)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <div className="why-waya-num">{i + 1}</div>
              <h3 className="why-waya-card-title">{p.title}</h3>
              <p className="why-waya-card-desc">{p.desc}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── FAQ ─── */
function FAQ({ t, lang }) {
  const f = t.faq
  const [openIdx, setOpenIdx] = useState(0)
  return (
    <section className="section faq-section" id="faq">
      <Reveal>
        <div className="section-badge">{f.badge}</div>
        <h2 className="section-title">{f.title}</h2>
      </Reveal>
      <div className="faq-list">
        {f.items.map((item, i) => {
          const open = openIdx === i
          return (
            <Reveal key={i} delay={i * 0.05}>
              <div className={`faq-item${open ? ' faq-item-open' : ''}`}>
                <button
                  type="button"
                  className="faq-q"
                  onClick={() => setOpenIdx(open ? -1 : i)}
                  aria-expanded={open}
                >
                  <span>{item.q}</span>
                  <svg className="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      className="faq-a"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

/* ─── ROI Calculator ─── */
function Calculator({ t, lang }) {
  const [customers, setCustomers] = useState(300)
  const [avgOrder, setAvgOrder] = useState(50)

  // Based on Waya stats: +32% repeat visits, +18% avg ticket increase
  const repeatRate = 0.25 // baseline: 25% of customers revisit
  const wayaRepeatRate = 0.25 * 1.32 // +32% with Waya
  const wayaAvgOrder = avgOrder * 1.18 // +18% avg ticket with Waya

  const baseMonthlyRevenue = customers * avgOrder
  const baseRepeatRevenue = Math.round(customers * repeatRate) * avgOrder
  const withWayaRepeatRevenue = Math.round(customers * wayaRepeatRate) * wayaAvgOrder
  const totalWithout = baseMonthlyRevenue + baseRepeatRevenue
  const totalWith = baseMonthlyRevenue + withWayaRepeatRevenue
  const extraRevenue = Math.round(totalWith - totalWithout)
  const wayaCost = 85
  const netProfit = extraRevenue - wayaCost
  const roiMultiple = (extraRevenue / wayaCost).toFixed(1)

  // Always use English digits, even in Arabic mode — per product decision
  // to keep numbers readable in one script across the site.
  const fmt = (n) => n.toLocaleString('en-US')

  return (
    <section className="section calculator-section" id="calculator">
      <Reveal>
        <div className="section-badge">{t.calculator.badge}</div>
        <h2 className="section-title">{t.calculator.title}</h2>
        <p className="section-subtitle">{t.calculator.subtitle}</p>
      </Reveal>

      <Reveal delay={0.15} className="calc-reveal-wrap">
        <div className="calc-container">
          {/* Sliders */}
          <div className="calc-sliders">
            <div className="calc-slider-group">
              <div className="calc-slider-header">
                <label>{t.calculator.customersLabel}</label>
                <span className="calc-slider-value">{fmt(customers)}</span>
              </div>
              <input
                type="range"
                min="50"
                max="200000"
                step="50"
                value={customers}
                onChange={(e) => setCustomers(Number(e.target.value))}
                className="calc-range"
              />
              <div className="calc-range-labels">
                <span>50</span>
                <span>200,000</span>
              </div>
            </div>

            <div className="calc-slider-group">
              <div className="calc-slider-header">
                <label>{t.calculator.avgOrderLabel}</label>
                <span className="calc-slider-value">{fmt(avgOrder)} <SarSymbol /></span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={avgOrder}
                onChange={(e) => setAvgOrder(Number(e.target.value))}
                className="calc-range"
              />
              <div className="calc-range-labels">
                <span>10</span>
                <span>500</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="calc-results">
            <div className="calc-comparison">
              <div className="calc-col calc-col-without" style={{ background: 'var(--calc-without-bg)', borderRadius: 'var(--radius-sm)' }}>
                <h4>{t.calculator.withoutTitle}</h4>
                <div className="calc-big-number">
                  <span className="calc-amount">{fmt(Math.round(totalWithout))}</span>
                  <span className="calc-unit"><SarSymbol /> {t.calculator.perMonth}</span>
                </div>
                <div className="calc-detail">
                  <span>{t.calculator.repeatVisits}</span>
                  <span>{Math.round(repeatRate * 100)}%</span>
                </div>
                <div className="calc-detail">
                  <span>{t.calculator.avgTicket}</span>
                  <span>{fmt(avgOrder)} <SarSymbol /></span>
                </div>
              </div>

              <div className="calc-vs">VS</div>

              <div className="calc-col calc-col-with" style={{ background: 'var(--calc-with-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--green)', boxShadow: '0 0 30px var(--green-glow)' }}>
                <h4>{t.calculator.withTitle}</h4>
                <div className="calc-big-number calc-big-green">
                  <span className="calc-amount">{fmt(Math.round(totalWith))}</span>
                  <span className="calc-unit"><SarSymbol /> {t.calculator.perMonth}</span>
                </div>
                <div className="calc-detail">
                  <span>{t.calculator.repeatVisits}</span>
                  <span className="calc-highlight">{Math.round(wayaRepeatRate * 100)}%</span>
                </div>
                <div className="calc-detail">
                  <span>{t.calculator.avgTicket}</span>
                  <span className="calc-highlight">{fmt(Math.round(wayaAvgOrder))} <SarSymbol /></span>
                </div>
              </div>
            </div>

            {/* Bottom summary bar */}
            <div className="calc-summary">
              <div className="calc-summary-item">
                <span className="calc-summary-label">{t.calculator.extraRevenue}</span>
                <span className="calc-summary-value calc-green">+{fmt(extraRevenue)} <SarSymbol /></span>
              </div>
              <div className="calc-summary-divider" />
              <div className="calc-summary-item">
                <span className="calc-summary-label">{t.calculator.wayaCost}</span>
                <span className="calc-summary-value">-{fmt(wayaCost)} <SarSymbol /></span>
              </div>
              <div className="calc-summary-divider" />
              <div className="calc-summary-item">
                <span className="calc-summary-label">{t.calculator.netProfit}</span>
                <span className="calc-summary-value calc-green-big">+{fmt(netProfit)} <SarSymbol /></span>
              </div>
              <div className="calc-summary-divider" />
              <div className="calc-summary-item">
                <span className="calc-summary-label">{t.calculator.roi}</span>
                <span className="calc-summary-value calc-green-big">{roiMultiple}{t.calculator.xReturn}</span>
              </div>
            </div>

            {/* CTA after calculator */}
            <div className="calc-cta-wrap">
              <a href="#cta" className="calc-cta-btn">
                {t.calculator.cta}
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ─── Comparison ─── */
function Comparison({ t }) {
  return (
    <section className="section section-alt">
      <Reveal>
        <div className="section-badge">{t.comparison.badge}</div>
        <h2 className="section-title">{t.comparison.title}</h2>
      </Reveal>

      <div className="comparison-grid">
        <Reveal delay={0.1} direction="right">
          <div className="comparison-card comparison-with">
            <div className="comparison-header comparison-header-with">
              <h3>{t.comparison.with.header}</h3>
            </div>
            <ul className="comparison-list">
              {t.comparison.with.items.map((item, i) => (
                <li key={i} className="comparison-item-with">
                  <div className="comparison-check-icon"><CheckIcon color="#10B981" /></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.2} direction="left">
          <div className="comparison-card comparison-without">
            <div className="comparison-header comparison-header-without">
              <h3>{t.comparison.without.header}</h3>
            </div>
            <ul className="comparison-list">
              {t.comparison.without.items.map((item, i) => (
                <li key={i} className="comparison-item-without">
                  <div className="comparison-x-icon"><XIcon /></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─── Social Proof ─── */
function SocialProof({ t }) {
  return (
    <section className="section social-proof-section">
      <Reveal>
        <h2 className="section-title">{t.socialProof.title}</h2>
        <p className="section-subtitle">{t.socialProof.subtitle}</p>
      </Reveal>

      <div className="social-proof-grid">
        {t.socialProof.items.map((item, i) => (
          <Reveal key={i} delay={i * 0.12}>
            <motion.div
              className="social-proof-card"
              whileHover={{ y: -10, boxShadow: '0 20px 50px rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.25)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <span className="social-proof-value">
                <CountUp value={item.value} duration={2} delay={i * 0.2} />
              </span>
              <span className="social-proof-label">{item.label}</span>
              <p className="social-proof-desc">{item.desc}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── Pricing ─── */
// Tier catalog lives alongside the server-side `plans` table (SAR, 20% annual).
const PRICING_TIERS = [
  {
    id: 'tier1', monthly: 85, annual: 816,
    titleAr: 'باقة التأسيس', titleEn: 'Founding Plan',
    featuresAr: [
      'اشتراك أول شهرين مجاناً',
      'عدد بطاقات غير محدود',
      'تصميم بطاقات مخصّص',
      'عدد عملاء غير محدود',
      'لوحة تحكم كاملة',
      'استيراد بيانات العملاء من Excel',
    ],
    featuresEn: [
      'First 2 months free',
      'Unlimited cards',
      'Custom card design',
      'Unlimited customers',
      'Full dashboard',
      'Import customers from Excel',
    ],
  },
  {
    id: 'tier2', monthly: 150, annual: 1440, featured: true,
    titleAr: 'النمو', titleEn: 'Growth',
    badgeAr: 'الأكثر شيوعاً', badgeEn: 'Most popular',
    featuresAr: ['برامج ولاء غير محدودة', 'حتى 2,000 عميل', 'معمل البطاقات', 'تحليلات متقدمة', 'دعم عبر واتساب'],
    featuresEn: ['Unlimited loyalty programs', 'Up to 2,000 customers', 'Pass designer lab', 'Advanced analytics', 'WhatsApp support'],
  },
  {
    id: 'tier3', monthly: 300, annual: 2880,
    titleAr: 'الاحتراف', titleEn: 'Pro',
    featuresAr: ['كل مميزات خطة النمو', 'عملاء غير محدودين', 'حملات مخصصة للمواسم', 'API للمطورين', 'دعم مخصص وذو أولوية'],
    featuresEn: ['Everything in Growth', 'Unlimited customers', 'Seasonal campaigns', 'Developer API', 'Priority dedicated support'],
  },
]

function Pricing({ t, lang }) {
  const { user } = useAuth()
  const isAr = lang === 'ar'

  const goCheckout = () => {
    const target = `/billing?plan=tier1_monthly`
    if (user) navigate(target)
    else navigate(`/signup?next=${encodeURIComponent(target)}`)
  }

  const founding = PRICING_TIERS[0]
  const title = isAr ? founding.titleAr : founding.titleEn
  const features = isAr ? founding.featuresAr : founding.featuresEn
  const price = founding.monthly
  const recommended = isAr ? '✨ العرض الحالي' : '✨ Current offer'
  const freeTrial = isAr ? 'اشتراك أول شهرين مجاناً' : 'First 2 months free'
  const featuresTitle = isAr ? 'الباقة تحتوي على' : 'Includes'
  const soonTitle = isAr ? 'قريباً' : 'Coming soon'
  const soonFeatures = isAr
    ? ['ميزة الإشعارات اللامحدودة', 'دعم منصات الكاشير المعروفة']
    : ['Unlimited notifications', 'Popular POS integrations']
  const cta = isAr ? 'اشترك الآن' : 'Subscribe Now'

  return (
    <section className="section" id="pricing">
      <Reveal>
        <div className="section-badge">{t.pricing.badge}</div>
        <h2 className="section-title">{title}</h2>
      </Reveal>

      <Reveal delay={0.1}>
        <motion.div
          className="founding-plan-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -6 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="founding-plan-badge">{recommended}</div>
          <div className="founding-plan-free">{freeTrial}</div>

          <div className="founding-plan-price">
            <span className="founding-plan-amount">{price}</span>
            <div className="founding-plan-unit">
              <span className="founding-plan-sar">{isAr ? 'ر.س' : 'SAR'}</span>
              <span className="founding-plan-per">{isAr ? 'شهرياً' : 'per month'}</span>
            </div>
          </div>

          <div className="founding-plan-divider" />

          <span className="founding-plan-features-title">{featuresTitle}</span>
          <ul className="founding-plan-features">
            {features.map((f, i) => (
              <li key={i}>
                <span className="founding-plan-check"><CheckIcon color="#ffffff" /></span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="founding-plan-soon">
            <span className="founding-plan-soon-label">{soonTitle}</span>
            <ul className="founding-plan-soon-list">
              {soonFeatures.map((f, i) => (
                <li key={i}>
                  <span className="founding-plan-soon-dot">●</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <motion.button
            className="founding-plan-cta"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={goCheckout}
          >
            {cta}
          </motion.button>
        </motion.div>
      </Reveal>
    </section>
  )
}

/* ─── CTA ─── */
function CTA({ t }) {
  return (
    <section className="cta-section" id="cta">
      <motion.div className="cta-glow" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
      <Reveal>
        <h2 className="cta-title">{t.cta.title}</h2>
      </Reveal>
      <Reveal delay={0.15}>
        <p className="cta-subtitle">{t.cta.subtitle}</p>
      </Reveal>
      <Reveal delay={0.2}>
        <motion.div
          className="hero-free-badge"
          style={{ marginBottom: 16 }}
          animate={{ boxShadow: ['0 0 0 0 rgba(16,185,129,0)', '0 0 20px 4px rgba(16,185,129,0.15)', '0 0 0 0 rgba(16,185,129,0)'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {t.hero.freeTrial}
        </motion.div>
      </Reveal>
      <Reveal delay={0.3}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <SignupForm t={t} id="cta-signup" />
        </div>
      </Reveal>
    </section>
  )
}

/* ─── WhatsApp Icon (small) ─── */
function WhatsAppIconSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

/* ─── Email Icon ─── */
function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4l-10 8L2 4"/>
    </svg>
  )
}

/* ─── Footer ─── */
function Footer({ t, lang = 'ar' }) {
  const isAr = lang === 'ar'
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand-col">
          <Logo size={40} />
          <p className="footer-tagline">
            {isAr ? 'برنامج ولاء رقمي للمتاجر الصغيرة.' : 'A digital loyalty program for small businesses.'}
          </p>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">{isAr ? 'الشركة' : 'Company'}</h4>
          <a href="/privacy">{t.footer.links.privacy}</a>
          <a href="/terms">{t.footer.links.terms}</a>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">{isAr ? 'تواصل' : 'Contact'}</h4>
          <a href="https://wa.me/966509076104" target="_blank" rel="noopener noreferrer" className="footer-col-link">
            <WhatsAppIconSmall />
            <span>{t.footer.whatsapp}</span>
          </a>
          <a href="mailto:hello@trywaya.com" className="footer-col-link">
            <EmailIcon />
            <span>hello@trywaya.com</span>
          </a>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">{isAr ? 'تابعنا' : 'Follow'}</h4>
          <a href="https://x.com/trywaya" target="_blank" rel="noopener noreferrer" className="footer-col-link" aria-label="X / Twitter @trywaya">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.75l-5.29-6.93L4.4 22H1.14l8.02-9.17L1 2h6.9l4.78 6.32L18.244 2Zm-2.37 18h1.86L7.28 4h-1.96l10.555 16Z"/></svg>
            <span>@trywaya</span>
          </a>
          <a href="https://instagram.com/trywaya" target="_blank" rel="noopener noreferrer" className="footer-col-link" aria-label="Instagram @trywaya">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            <span>@trywaya</span>
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-copy">© {year} Waya · {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
      </div>
    </footer>
  )
}

/* ─── Smooth scroll ─── */
function useSmoothScroll() {
  useEffect(() => {
    const handler = (e) => {
      const target = e.target.closest('a[href^="#"]')
      if (!target) return
      e.preventDefault()
      const el = document.querySelector(target.getAttribute('href'))
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])
}

/* ─── Privacy Policy Page ─── */
function PrivacyPage({ lang, setLang, theme, setTheme, t }) {
  const isAr = lang === 'ar'
  return (
    <div className={`app ${lang === 'en' ? 'ltr-mode' : ''}`}>
      <Navbar lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />
      <section className="legal-page">
        <div className="legal-hero">
          <span className="legal-hero-badge">{isAr ? 'قانوني' : 'Legal'}</span>
          <h1 className="legal-title">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>
          <p className="legal-date">{isAr ? 'آخر تحديث: أبريل 2026' : 'Last updated: April 2026'}</p>
        </div>

        <h2>{isAr ? 'مقدمة' : 'Introduction'}</h2>
        <p>{isAr
          ? 'وايا ("نحن"، "لنا") تلتزم بحماية خصوصية مستخدميها. توضح هذه السياسة كيف نجمع ونستخدم ونحمي بياناتك الشخصية عند استخدام خدماتنا.'
          : 'Waya ("we", "us") is committed to protecting the privacy of its users. This policy explains how we collect, use, and protect your personal data when you use our services.'
        }</p>

        <h2>{isAr ? 'البيانات التي نجمعها' : 'Data We Collect'}</h2>
        <p>{isAr
          ? 'نجمع المعلومات التالية: اسم المتجر، رقم الجوال أو البريد الإلكتروني، نوع النشاط التجاري، وبيانات استخدام برنامج الولاء (عدد الزيارات، النقاط، المكافآت). لا نجمع أي بيانات مالية أو بيانات بطاقات ائتمان.'
          : 'We collect the following information: store name, phone number or email, business type, and loyalty program usage data (visits, points, rewards). We do not collect any financial data or credit card information.'
        }</p>

        <h2>{isAr ? 'كيف نستخدم بياناتك' : 'How We Use Your Data'}</h2>
        <p>{isAr
          ? 'نستخدم بياناتك لتشغيل خدمة برنامج الولاء، إرسال الإشعارات المتعلقة بالمكافآت، تحسين خدماتنا، والتواصل معك بخصوص حسابك. لن نبيع أو نشارك بياناتك مع أطراف ثالثة لأغراض تسويقية.'
          : 'We use your data to operate the loyalty program service, send reward-related notifications, improve our services, and communicate with you about your account. We will never sell or share your data with third parties for marketing purposes.'
        }</p>

        <h2>{isAr ? 'حماية البيانات' : 'Data Protection'}</h2>
        <p>{isAr
          ? 'نستخدم تشفير SSL لحماية جميع البيانات المنقولة. بياناتك مخزنة بشكل آمن على خوادم محمية. نلتزم بأفضل ممارسات أمن المعلومات لحماية بياناتك.'
          : 'We use SSL encryption to protect all transmitted data. Your data is stored securely on protected servers. We follow information security best practices to protect your data.'
        }</p>

        <h2>{isAr ? 'حقوقك' : 'Your Rights'}</h2>
        <p>{isAr
          ? 'يحق لك طلب الوصول إلى بياناتك الشخصية، تصحيحها، أو حذفها في أي وقت. يمكنك التواصل معنا عبر hello@trywaya.com لممارسة هذه الحقوق.'
          : 'You have the right to request access to, correction of, or deletion of your personal data at any time. You can contact us at hello@trywaya.com to exercise these rights.'
        }</p>

        <h2>{isAr ? 'التواصل' : 'Contact'}</h2>
        <p>{isAr
          ? 'لأي استفسارات حول سياسة الخصوصية، تواصل معنا على hello@trywaya.com أو عبر واتساب على الرقم +966509076104.'
          : 'For any questions about this privacy policy, contact us at hello@trywaya.com or via WhatsApp at +966509076104.'
        }</p>

        <div className="legal-back">
          <a href="/">{isAr ? '← الرجوع للرئيسية' : '← Back to Home'}</a>
        </div>
      </section>
      <Footer t={t} lang={lang} />
    </div>
  )
}

/* ─── Terms Page ─── */
function TermsPage({ lang, setLang, theme, setTheme, t }) {
  const isAr = lang === 'ar'
  return (
    <div className={`app ${lang === 'en' ? 'ltr-mode' : ''}`}>
      <Navbar lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />
      <section className="legal-page">
        <div className="legal-hero">
          <span className="legal-hero-badge">{isAr ? 'قانوني' : 'Legal'}</span>
          <h1 className="legal-title">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</h1>
          <p className="legal-date">{isAr ? 'آخر تحديث: أبريل 2026' : 'Last updated: April 2026'}</p>
        </div>

        <h2>{isAr ? 'الخدمة' : 'The Service'}</h2>
        <p>{isAr
          ? 'وايا هي منصة برامج ولاء رقمية تتيح للمتاجر إنشاء وإدارة برامج مكافآت لعملائها. باستخدامك للخدمة، فإنك توافق على هذه الشروط.'
          : 'Waya is a digital loyalty platform that enables stores to create and manage reward programs for their customers. By using the service, you agree to these terms.'
        }</p>

        <h2>{isAr ? 'الحساب والتسجيل' : 'Account & Registration'}</h2>
        <p>{isAr
          ? 'أنت مسؤول عن الحفاظ على سرية حسابك وكلمة المرور. يجب أن تكون المعلومات المقدمة عند التسجيل دقيقة وحديثة. يجب أن يكون عمرك 18 سنة أو أكثر لاستخدام الخدمة.'
          : 'You are responsible for maintaining the confidentiality of your account and password. Information provided during registration must be accurate and current. You must be 18 years or older to use the service.'
        }</p>

        <h2>{isAr ? 'الاشتراك والدفع' : 'Subscription & Payment'}</h2>
        <p>{isAr
          ? 'الخطة الشهرية بسعر 75 ر.س/شهر والخطة السنوية بسعر 37 ر.س/شهر (خصم 50%، تُفوتر سنوياً). أول شهرين مجاناً للمشاريع الجديدة. يمكنك إلغاء اشتراكك في أي وقت. بعد الإلغاء، ستستمر الخدمة حتى نهاية فترة الفوترة الحالية.'
          : 'The monthly plan is 75 SAR/month and the annual plan is 37 SAR/month (50% off, billed annually). First 2 months are completely FREE for founding businesses. You can cancel your subscription at any time. After cancellation, the service continues until the end of the current billing period.'
        }</p>

        <h2>{isAr ? 'الاستخدام المقبول' : 'Acceptable Use'}</h2>
        <p>{isAr
          ? 'يجب استخدام وايا لأغراض تجارية مشروعة فقط. يُمنع استخدام الخدمة لأي نشاط غير قانوني أو مضلل. نحتفظ بحق تعليق أو إنهاء الحسابات التي تنتهك هذه الشروط.'
          : 'Waya must be used for legitimate business purposes only. Using the service for any illegal or misleading activity is prohibited. We reserve the right to suspend or terminate accounts that violate these terms.'
        }</p>

        <h2>{isAr ? 'الملكية الفكرية' : 'Intellectual Property'}</h2>
        <p>{isAr
          ? 'جميع محتويات وايا بما في ذلك العلامة التجارية والتصميم والبرمجيات هي ملكية خاصة لوايا. لا يجوز نسخ أو توزيع أي جزء من الخدمة بدون إذن كتابي مسبق.'
          : 'All Waya content including branding, design, and software is proprietary to Waya. No part of the service may be copied or distributed without prior written permission.'
        }</p>

        <h2>{isAr ? 'تحديد المسؤولية' : 'Limitation of Liability'}</h2>
        <p>{isAr
          ? 'وايا تُقدم الخدمة "كما هي". لا نتحمل مسؤولية أي خسائر غير مباشرة ناتجة عن استخدام الخدمة. مسؤوليتنا الإجمالية لا تتجاوز المبلغ المدفوع خلال الاثني عشر شهراً السابقة.'
          : 'Waya provides the service "as is". We are not liable for any indirect losses resulting from the use of the service. Our total liability does not exceed the amount paid during the preceding twelve months.'
        }</p>

        <h2>{isAr ? 'التواصل' : 'Contact'}</h2>
        <p>{isAr
          ? 'لأي استفسارات حول الشروط والأحكام، تواصل معنا على hello@trywaya.com أو عبر واتساب على الرقم +966509076104.'
          : 'For any questions about these terms, contact us at hello@trywaya.com or via WhatsApp at +966509076104.'
        }</p>

        <div className="legal-back">
          <a href="/">{isAr ? '← الرجوع للرئيسية' : '← Back to Home'}</a>
        </div>
      </section>
      <Footer t={t} lang={lang} />
    </div>
  )
}

/* ─── Google Icon ─── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.38.07 2.34.74 3.17.8 1.2-.24 2.36-.93 3.63-.84 1.54.12 2.7.72 3.44 1.82-3.15 1.9-2.4 5.77.42 6.9-.57 1.52-1.3 3.01-2.66 4.2zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  )
}

/* ─── Login Page ─── */
function LoginPage({ t, lang, setLang, theme, setTheme }) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const a = t.auth

  useEffect(() => {
    if (!user) return
    supabase.from('shops').select('id').eq('user_id', user.id).single()
      .then(({ data }) => navigate(data ? '/dashboard' : '/setup'))
  }, [user])

  if (user) {
    return (
      <div className="auth-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', color: '#888' }}>{a.logging || 'Redirecting…'}</div>
        </div>
      </div>
    )
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) { setError(a.errEmpty); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (err) { setError(a.errInvalid); setLoading(false) }
  }

  const handleGoogle = async () => {
    setError('')
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/login' } })
  }

  const handleApple = async () => {
    setError('')
    await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin + '/login' } })
  }

  const handleForgot = async () => {
    if (!email.trim()) { setError(a.errEmailFirst); return }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/reset-password' })
    if (!err) { setError(''); setResetSent(true) } else setError(err.message)
  }

  return (
    <div className="auth-page">
      <div className="auth-top-bar">
        <button onClick={() => navigate('/')} className="auth-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={lang === 'ar' ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}/></svg>
          {a.back}
        </button>
        <div className="auth-top-actions">
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="lang-toggle" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <GlobeIcon /><span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </div>

      <motion.div className="auth-card" initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        <motion.div className="auth-brand" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}><Logo size={100} /></motion.div>
        <motion.h1 className="auth-title" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>{a.loginTitle}</motion.h1>
        <motion.p className="auth-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>{a.loginSub}</motion.p>

        <div className="auth-oauth-row">
          <motion.button onClick={handleGoogle} className="auth-google-btn" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <GoogleIcon /><span>{a.googleBtn}</span>
          </motion.button>
          <motion.button onClick={handleApple} className="auth-apple-btn" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <AppleIcon /><span>{a.appleBtn}</span>
          </motion.button>
        </div>

        <div className="auth-divider"><span>{a.or}</span></div>

        <form onSubmit={handleLogin} className="auth-form">
          <motion.div className="auth-field" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
            <label>{a.email}</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder={a.emailPh} dir="ltr" />
          </motion.div>
          <motion.div className="auth-field" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45, duration: 0.4 }}>
            <label>{a.password}</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder={a.passwordPh} dir="ltr" />
          </motion.div>
          <button type="button" onClick={handleForgot} className="auth-forgot">{a.forgot}</button>
          <AnimatePresence>
            {error && <motion.p className="auth-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.p>}
            {resetSent && <motion.p className="auth-success" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{a.resetSent}</motion.p>}
          </AnimatePresence>
          <motion.button type="submit" disabled={loading} className="auth-submit-btn" whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(16,185,129,0.25)' }} whileTap={{ scale: 0.97 }}>
            {loading ? a.logging : a.loginBtn}
          </motion.button>
        </form>

        <motion.p className="auth-switch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}>{a.noAccount} <button onClick={() => navigate('/signup')}>{a.goSignup}</button></motion.p>
      </motion.div>
    </div>
  )
}

/* ─── Signup Page ─── */
function SignupPage({ t, lang, setLang, theme, setTheme }) {
  const { user } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const a = t.auth

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data: ownedShop } = await supabase.from('shops').select('id').eq('user_id', user.id).maybeSingle()
      if (ownedShop) { navigate('/dashboard'); return }
      const { data: member } = await supabase.from('shop_members').select('id').eq('user_id', user.id).maybeSingle()
      navigate(member ? '/dashboard' : '/setup')
    })()
  }, [user])

  if (user) {
    return (
      <div className="auth-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', color: '#888' }}>{a.logging || 'Redirecting…'}</div>
        </div>
      </div>
    )
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) { setError(a.errName); return }
    if (!email.trim() || !email.includes('@')) { setError(a.errEmail); return }
    if (password.length < 6) { setError(a.errPassword); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin + '/login' },
    })
    if (err) { setError(err.message); setLoading(false) }
    else { setSuccess(true); setLoading(false) }
  }

  const handleGoogle = async () => {
    setError('')
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/login' } })
  }

  const handleApple = async () => {
    setError('')
    await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin + '/login' } })
  }

  if (success) {
    return (
      <div className="auth-page">
        <motion.div className="auth-card" style={{ textAlign: 'center' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
          <h1 className="auth-title">{a.successTitle}</h1>
          <p className="auth-subtitle" style={{ marginBottom: 8 }}>{a.successMsg}</p>
          <p style={{ color: '#10b981', fontWeight: 600, direction: 'ltr', fontSize: '0.95rem' }}>{email}</p>
          <button onClick={() => navigate('/login')} className="auth-submit-btn" style={{ marginTop: 28 }}>{a.goLogin}</button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-top-bar">
        <button onClick={() => navigate('/')} className="auth-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={lang === 'ar' ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}/></svg>
          {a.back}
        </button>
        <div className="auth-top-actions">
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="lang-toggle" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <GlobeIcon /><span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </div>

      <motion.div className="auth-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="auth-brand"><Logo size={100} /></div>
        <h1 className="auth-title">{a.signupTitle}</h1>
        <p className="auth-subtitle">{a.signupSub}</p>

        <div className="auth-oauth-row">
          <button onClick={handleGoogle} className="auth-google-btn">
            <GoogleIcon /><span>{a.googleSignup}</span>
          </button>
          <button onClick={handleApple} className="auth-apple-btn">
            <AppleIcon /><span>{a.appleSignup}</span>
          </button>
        </div>

        <div className="auth-divider"><span>{a.or}</span></div>

        <form onSubmit={handleSignup} className="auth-form">
          <div className="auth-field">
            <label>{a.name}</label>
            <input type="text" value={fullName} onChange={e => { setFullName(e.target.value); setError('') }}
              placeholder={a.namePh} />
          </div>
          <div className="auth-field">
            <label>{a.email}</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder={a.emailPh} dir="ltr" />
          </div>
          <div className="auth-field">
            <label>{a.password}</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder={a.passwordPh} dir="ltr" />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? a.signing : a.signupBtn}
          </button>
        </form>

        <p className="auth-switch">{a.hasAccount} <button onClick={() => navigate('/login')}>{a.goLogin}</button></p>
      </motion.div>
    </div>
  )
}

/* ─── Demo Fake Data ─── */
const demoData = {
  stats: [
    { key: 'customers', value: '1,247', change: '+12%' },
    { key: 'visits', value: '67%', change: '+8%' },
    { key: 'revenue', value: '14.2K', change: '+22%' },
    { key: 'rewards', value: '3,891', change: '+34%' },
  ],
}

/* ─── Shop Setup Page (onboarding — no loyalty) ─── */
function SetupPage({ t, lang, setLang, theme, setTheme }) {
  const { user } = useAuth()
  const s = t.setup
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [instagram, setInstagram] = useState('')
  const [twitter, setTwitter] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Sub-accounts should never see the setup form — bounce them to /dashboard.
  // Also catches owners who somehow land here despite already having a shop.
  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data: ownedShop } = await supabase.from('shops').select('id').eq('user_id', user.id).maybeSingle()
      if (ownedShop) { navigate('/dashboard'); return }
      const { data: member } = await supabase.from('shop_members').select('id').eq('user_id', user.id).maybeSingle()
      if (member) { navigate('/dashboard'); return }
    })()
  }, [user])

  const handleLogo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Max 2MB'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError(s.errName); return }
    if (!type) { setError(s.errType); return }
    setLoading(true); setError('')

    let logo_url = null
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `${user.id}/logo.${ext}`
      const { error: upErr } = await supabase.storage.from('shop-logos').upload(path, logoFile, { upsert: true })
      if (!upErr) {
        const { data } = supabase.storage.from('shop-logos').getPublicUrl(path)
        logo_url = data.publicUrl
      }
    }

    const { error: dbErr } = await supabase.from('shops').insert({
      user_id: user.id, name: name.trim(), type,
      phone: phone.trim() || null, address: address.trim() || null,
      social_instagram: instagram.trim() || null, social_twitter: twitter.trim() || null,
      logo_url,
    })

    if (dbErr) { setError(dbErr.message); setLoading(false) }
    else { navigate('/dashboard') }
  }

  return (
    <div className="auth-page">
      <div className="auth-top-bar">
        <div className="auth-brand"><Logo size={100} /></div>
        <div className="auth-top-actions">
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="lang-toggle" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <GlobeIcon /><span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </div>

      <motion.div className="setup-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="auth-title">{s.title}</h1>
        <p className="auth-subtitle">{s.subtitle}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>{s.shopName}</label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }} placeholder={s.shopNamePh} />
          </div>
          <div className="auth-field">
            <label>{s.shopType}</label>
            <select value={type} onChange={e => { setType(e.target.value); setError('') }} className="setup-select">
              <option value="">{s.shopTypePh}</option>
              {s.types.map(tp => <option key={tp} value={tp}>{tp}</option>)}
            </select>
          </div>

          <div className="setup-logo-field">
            <label>{s.logo}</label>
            <div className="setup-logo-row">
              {logoPreview ? <img src={logoPreview} alt="" className="setup-logo-preview" /> : <div className="setup-logo-placeholder"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>}
              <div>
                <label className="setup-logo-btn">{s.logoUpload}<input type="file" accept="image/png,image/jpeg" onChange={handleLogo} hidden /></label>
                <p className="setup-logo-hint">{s.logoHint}</p>
              </div>
            </div>
          </div>

          <div className="setup-row">
            <div className="auth-field"><label>{s.phone}</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={s.phonePh} dir="ltr" /></div>
            <div className="auth-field"><label>{s.address}</label><input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder={s.addressPh} /></div>
          </div>

          <div className="setup-row">
            <div className="auth-field"><label>{s.instagram}</label><input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@username" dir="ltr" /></div>
            <div className="auth-field"><label>{s.twitter}</label><input type="text" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@username" dir="ltr" /></div>
          </div>

          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading} className="auth-submit-btn">{loading ? s.saving : s.submit}</button>
        </form>
      </motion.div>
    </div>
  )
}

/* ─── Dashboard (Demo View with Sidebar) ─── */
/* ─── Google Wallet Icon ─── */
function GoogleWalletIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M19.74 7.33L12 12.78l-7.74-5.45A1.98 1.98 0 016 6h12c.74 0 1.38.4 1.74 1.33z" fill="#4285F4"/>
      <path d="M12 12.78l7.74-5.45c.16.42.26.88.26 1.34v6.66c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V8.67c0-.46.1-.92.26-1.34L12 12.78z" fill="#34A853"/>
      <path d="M4.26 7.33L12 12.78V18H6c-1.1 0-2-.9-2-2V8.67c0-.46.1-.92.26-1.34z" fill="#FBBC04"/>
      <path d="M19.74 7.33c.16.42.26.88.26 1.34V16c0 1.1-.9 2-2 2h-6v-5.22l7.74-5.45z" fill="#EA4335"/>
    </svg>
  )
}

/* ─── Apple Wallet Icon ─── */
function AppleWalletIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.41-1.09-.47-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.41C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.50-3.74 4.25z"/>
    </svg>
  )
}

/* ─── Customer-Facing Wallet Page ─── */
function WalletPage({ lang, setLang, theme, setTheme }) {
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [walletUrl, setWalletUrl] = useState(null)
  const [appleBlobUrl, setAppleBlobUrl] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const shopId = window.location.pathname.split('/wallet/')[1]

  useEffect(() => {
    if (!shopId) { setError('Invalid link'); setLoading(false); return }
    supabase.from('shops').select('*').eq('id', shopId).single()
      .then(({ data, error: err }) => {
        if (err || !data) { setError(lang === 'ar' ? 'المتجر غير موجود' : 'Shop not found'); }
        else { setShop(data) }
        setLoading(false)
      })
  }, [shopId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !phone) return
    if (!isValidKsaPhone(phone)) {
      setError(lang === 'ar' ? KSA_PHONE_ERR_AR : KSA_PHONE_ERR_EN)
      return
    }
    setGenerating(true)
    try {
      const body = JSON.stringify({ shop_id: shopId, customer_name: name, customer_phone: phone })

      // Fire Google + Apple in parallel
      const [googleRes, appleRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/functions/v1/google-wallet-public`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }).then(r => r.json()).catch(e => ({ success: false, error: e.message })),

        fetch(`${SUPABASE_URL}/functions/v1/apple-wallet-public`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }).then(async r => {
          if (!r.ok) return { success: false }
          const blob = await r.blob()
          return { success: true, blobUrl: URL.createObjectURL(blob) }
        }).catch(() => ({ success: false })),
      ])

      if (googleRes.success) setWalletUrl(googleRes.saveUrl)
      if (appleRes.success) setAppleBlobUrl(appleRes.blobUrl)
      if (googleRes.success || appleRes.success) setSubmitted(true)
      else setError(googleRes.error || 'Failed to generate pass')
    } catch (err) {
      setError(err.message)
    }
    setGenerating(false)
  }

  if (loading) return <div className="auth-page"><div className="dash-loading"><Logo size={72} /></div></div>
  if (error && !shop) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <Logo size={40} />
        <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    </div>
  )

  return (
    <div className={`auth-page ${lang === 'en' ? 'ltr-mode' : ''}`}>
      <motion.div className="auth-card wallet-customer-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="wallet-customer-header">
          {shop.logo_url ? <img src={shop.logo_url} alt="" className="wallet-shop-logo" /> : <Logo size={44} />}
          <h1 className="wallet-shop-name">{shop.name}</h1>
          <p className="wallet-shop-type">{shop.type}</p>
        </div>

        {!submitted ? (
          <form className="auth-form" onSubmit={handleSubmit} style={{ gap: 16 }}>
            <p className="wallet-invite-text">
              {lang === 'ar'
                ? `انضم لبرنامج ولاء ${shop.name} وأضف بطاقتك إلى محفظة قوقل`
                : `Join ${shop.name}'s loyalty program and add your card to Google Wallet`}
            </p>
            <div className="auth-field">
              <label>{lang === 'ar' ? 'اسمك' : 'Your Name'}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={lang === 'ar' ? 'أحمد علي' : 'Ahmed Ali'} required />
            </div>
            <div className="auth-field">
              <label>{lang === 'ar' ? 'رقم جوالك' : 'Your Phone'}</label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => setPhone(handlePhoneChange(e.target.value))}
                placeholder="05XXXXXXXX"
                dir="ltr"
                maxLength={13}
                required
                aria-invalid={phone.length > 0 && !isValidKsaPhone(phone) ? 'true' : 'false'}
                style={phone.length > 0 && !isValidKsaPhone(phone) ? { borderColor: '#e11d48' } : undefined}
              />
              <small style={{ display: 'block', marginTop: 4, fontSize: 12, color: phone.length > 0 && !isValidKsaPhone(phone) ? '#e11d48' : '#6b7280' }}>
                {phone.length > 0 && !isValidKsaPhone(phone)
                  ? (lang === 'ar' ? KSA_PHONE_ERR_AR : KSA_PHONE_ERR_EN)
                  : (lang === 'ar' ? KSA_PHONE_HINT_AR : KSA_PHONE_HINT_EN)}
              </small>
            </div>
            <button type="submit" className="wallet-add-btn-full" disabled={generating}>
              <GoogleWalletIcon />
              {generating
                ? (lang === 'ar' ? 'جاري الإنشاء...' : 'Generating...')
                : (lang === 'ar' ? 'أضف إلى محفظة قوقل' : 'Add to Google Wallet')}
            </button>
            {error && <p className="auth-error">{error}</p>}
          </form>
        ) : (
          <motion.div className="wallet-done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="wallet-done-check">✓</div>
            <p>{lang === 'ar' ? 'تم إنشاء بطاقتك!' : 'Your card is ready!'}</p>
            {walletUrl && (
              <a href={walletUrl} target="_blank" rel="noopener noreferrer" className="wallet-add-btn-google">
                <img src="https://developers.google.com/static/wallet/images/web/en_add_to_google_wallet_wallet-button.png" alt="Add to Google Wallet" style={{ height: 52 }} />
              </a>
            )}
            {appleBlobUrl && (
              <a
                href={appleBlobUrl}
                download={`${shop.name.replace(/[^\w]/g, '_')}.pkpass`}
                className="wallet-add-btn-apple"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12, background: '#000', color: '#fff', padding: '12px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}
              >
                <AppleWalletIcon />
                {lang === 'ar' ? 'أضف إلى Apple Wallet' : 'Add to Apple Wallet'}
              </a>
            )}
            <p className="wallet-reward-info">
              {lang === 'ar'
                ? `اجمع ${shop.reward_threshold || 10} نقاط واحصل على مكافأة`
                : `Collect ${shop.reward_threshold || 10} points and earn a reward`}
            </p>
          </motion.div>
        )}

        <div className="wallet-powered-by">
          <span>{lang === 'ar' ? 'مدعوم من' : 'Powered by'}</span>
          <Logo size={16} />
          <span>Waya</span>
        </div>
      </motion.div>
    </div>
  )
}

function DesignerTab({ shop, lang }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [createNew, setCreateNew] = useState(false)

  const reload = () => supabase.from('loyalty_programs').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }).then(({ data }) => setPrograms(data || []))

  useEffect(() => {
    if (!shop?.id) return
    reload().then(() => setLoading(false))
  }, [shop?.id])

  if (createNew) {
    return (
      <PassDesignerPage
        shop={shop}
        lang={lang}
        onBack={() => { setCreateNew(false); reload() }}
        onCreated={(saved) => { setCreateNew(false); setSelected(saved); reload() }}
      />
    )
  }

  if (selected) {
    return (
      <PassDesignerPage
        program={selected}
        shop={shop}
        lang={lang}
        onBack={() => { setSelected(null); reload() }}
      />
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }} dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h1 className="dash-title" style={{ margin: 0 }}>{T('Pass Designer', 'مصمم البطاقة')}</h1>
        <button className="lw-btn primary" onClick={() => setCreateNew(true)}>+ {T('New Card', 'بطاقة جديدة')}</button>
      </div>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>{T('Create a new card or select one to customize.', 'أنشئ بطاقة جديدة أو اختر واحدة لتخصيصها.')}</p>
      {loading && <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>{T('Loading…', 'جارٍ التحميل…')}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {programs.map(p => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              background: '#fff', border: '1.5px solid #e5e8ec', borderRadius: 14,
              cursor: 'pointer', textAlign: 'inherit', transition: 'all .15s',
              borderInlineStartWidth: 4, borderInlineStartColor: p.card_color || '#10B981',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = p.card_color || '#10B981'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.06)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e8ec'; e.currentTarget.style.borderInlineStartColor = p.card_color || '#10B981'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 10, background: p.card_color || '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.text_color || '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
              {(p.name || 'W').charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ fontSize: 15, display: 'block' }}>{p.name}</strong>
              <span style={{ fontSize: 12, color: '#888' }}>{p.loyalty_type === 'stamp' ? T('Stamp Card', 'بطاقة أختام') : p.loyalty_type === 'points' ? T('Points', 'نقاط') : p.loyalty_type === 'tiered' ? T('Tiered', 'مستويات') : T('Coupon', 'كوبون')}</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, transform: isAr ? 'scaleX(-1)' : undefined }}><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
      </div>
    </div>
  )
}

function CustomersModal({ shop, lang, onClose }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase.rpc('shop_customers', { _shop_id: shop.id })
      if (cancelled) return
      if (error) console.error('shop_customers', error)
      setRows(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    if (shop?.id) load()
    return () => { cancelled = true }
  }, [shop?.id])

  const filtered = rows.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return (r.customer_name || '').toLowerCase().includes(q) || (r.customer_phone || '').includes(q)
  })

  const fmtDate = (iso) => {
    if (!iso) return T('Never', 'لم يزر بعد')
    const d = new Date(iso)
    return d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const exportCsv = () => {
    const headers = [
      T('Name', 'الاسم'),
      T('Phone', 'الهاتف'),
      T('Program', 'البرنامج'),
      T('Stamps', 'الأختام'),
      T('Points', 'النقاط'),
      T('Tier', 'المستوى'),
      T('Rewards available', 'مكافآت جاهزة'),
      T('Rewards used', 'مكافآت مستبدلة'),
      T('Last visit', 'آخر زيارة'),
    ]
    const esc = (v) => {
      const s = v == null ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const body = filtered.map(r => [
      r.customer_name || '',
      r.customer_phone || '',
      r.loyalty_programs?.name || '',
      r.stamps ?? 0,
      r.points ?? 0,
      r.tier || '',
      r.rewards_balance ?? 0,
      r.rewards_used ?? 0,
      r.last_visit_at ? new Date(r.last_visit_at).toISOString().slice(0, 10) : '',
    ].map(esc).join(','))
    const csv = '\uFEFF' + [headers.map(esc).join(','), ...body].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    const slug = (shop?.name || 'waya').replace(/[^\w-]+/g, '-').toLowerCase()
    a.href = url
    a.download = `${slug}-customers-${stamp}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <motion.div
      className="customers-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <motion.div
        className="customers-modal"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="customers-modal-head">
          <div>
            <h2>{T('Customers', 'العملاء')}</h2>
            <span className="customers-modal-count">
              {loading ? '…' : `${filtered.length} ${T(filtered.length === 1 ? 'customer' : 'customers', 'عميل')}`}
            </span>
          </div>
          <div className="customers-modal-actions">
            <button
              className="customers-modal-export"
              onClick={exportCsv}
              disabled={loading || filtered.length === 0}
              aria-label={T('Export to Excel', 'تصدير إلى إكسل')}
              title={T('Export to Excel (.csv)', 'تصدير إلى إكسل (.csv)')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>{T('Export', 'تصدير')}</span>
            </button>
            <button className="customers-modal-close" onClick={onClose} aria-label={T('Close', 'إغلاق')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div className="customers-modal-search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={T('Search by name or phone', 'بحث بالاسم أو الهاتف')}
          />
        </div>
        <div className="customers-modal-body">
          {loading && <div className="customers-modal-empty">{T('Loading…', 'جارٍ التحميل…')}</div>}
          {!loading && filtered.length === 0 && (
            <div className="customers-modal-empty">
              {rows.length === 0
                ? T('No customers yet. Share your QR code to start enrolling.', 'لا يوجد عملاء بعد. شارك رمز QR لتبدأ.')
                : T('No matches.', 'لا توجد نتائج.')}
            </div>
          )}
          {!loading && filtered.map(r => {
            const program = r.loyalty_programs
            const isStamp = program?.loyalty_type === 'stamp'
            const progress = isStamp
              ? `${r.stamps || 0}/${program?.stamps_required || 10} ${T('stamps', 'ختم')}`
              : `${r.points || 0} ${T('points', 'نقطة')}`
            const rewardsHave = r.rewards_balance || 0
            const rewardsUsed = r.rewards_used || 0
            return (
              <div key={r.id} className="customers-row">
                <div className="customers-row-main">
                  <strong>{r.customer_name || T('Member', 'عضو')}</strong>
                  <span className="customers-row-phone">{r.customer_phone || '—'}</span>
                </div>
                <div className="customers-row-stats">
                  <span className="customers-stat">
                    <span className="customers-stat-value">{rewardsHave}</span>
                    <span className="customers-stat-label">{T('Rewards available', 'مكافآت جاهزة')}</span>
                  </span>
                  <span className="customers-stat">
                    <span className="customers-stat-value">{rewardsUsed}</span>
                    <span className="customers-stat-label">{T('Rewards used', 'مكافآت مستبدلة')}</span>
                  </span>
                </div>
                <div className="customers-row-meta">
                  {program?.name && <span className="customers-row-program">{program.name}</span>}
                  <span>{progress}</span>
                  {r.tier && <span className="customers-row-tier">{r.tier}</span>}
                  <span className="customers-row-date">{T('Last visit', 'آخر زيارة')}: {fmtDate(r.last_visit_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

function DashboardPage({ t, lang, setLang, theme, setTheme }) {
  const { user, signOut, loading: authLoading } = useAuth()
  const { isAdmin: isPlatformAdmin } = useIsPlatformAdmin()
  const d = t.dashboard
  const [shop, setShop] = useState(null)
  const [memberRole, setMemberRole] = useState(null)  // null = owner; 'cashier' | 'branch_manager' = sub-account
  const [activeTab, setActiveTab] = useState(() => {
    const p = window.location.pathname
    if (p === '/data') return 'data'
    if (p === '/settings') return 'settings'
    const h = window.location.hash.slice(1)
    if (['home', 'data', 'settings', 'scan', 'designer', 'notifications', 'guide'].includes(h)) return h
    return 'home'
  })
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Mirror activeTab into the URL so refresh restores the same tab.
  useEffect(() => {
    let url
    if (activeTab === 'data') url = '/data'
    else if (activeTab === 'settings') url = '/settings'
    else if (activeTab === 'home') url = '/dashboard'
    else url = `/dashboard#${activeTab}`
    if (window.location.pathname + window.location.hash !== url) {
      window.history.replaceState({}, '', url)
    }
  }, [activeTab])

  // Keep activeTab in sync with browser back/forward and manual hash edits.
  useEffect(() => {
    const sync = () => {
      const p = window.location.pathname
      const h = window.location.hash.slice(1)
      if (p === '/data') setActiveTab('data')
      else if (p === '/settings') setActiveTab('settings')
      else if (h && ['home', 'scan', 'designer', 'notifications', 'guide'].includes(h)) setActiveTab(h)
      else setActiveTab('home')
    }
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])
  const [loadingShop, setLoadingShop] = useState(true)
  const [showCustomers, setShowCustomers] = useState(false)
  const [programs, setPrograms] = useState([])
  const [programsLoaded, setProgramsLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      // Try owner first
      const { data: ownedShop } = await supabase.from('shops').select('*').eq('user_id', user.id).maybeSingle()
      if (ownedShop) {
        setShop(ownedShop)
        setMemberRole(null)
        setLoadingShop(false)
        return
      }
      // Try sub-account member — load the shop they belong to
      const { data: member } = await supabase
        .from('shop_members')
        .select('role, shop_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!member) { navigate('/setup'); return }
      const { data: memberShop } = await supabase.from('shops').select('*').eq('id', member.shop_id).maybeSingle()
      if (!memberShop) { navigate('/setup'); return }
      setShop(memberShop)
      setMemberRole(member.role)
      setActiveTab('scan')   // sub-accounts land on Scan & Redeem directly
      setLoadingShop(false)
    })()
  }, [user])

  useEffect(() => {
    if (!shop?.id) return
    let cancelled = false
    supabase
      .from('loyalty_programs')
      .select('id, name, loyalty_type, stamps_required, card_color, created_at')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return
        setPrograms(data || [])
        setProgramsLoaded(true)
      })
    return () => { cancelled = true }
  }, [shop?.id, activeTab])

  const stats = useShopStats({ shopId: shop?.id })

  // Guard: if a member somehow ends up on a restricted tab, snap them back to Scan.
  // MUST stay above early returns — Rules of Hooks.
  useEffect(() => {
    if (memberRole && activeTab !== 'scan' && activeTab !== 'guide') setActiveTab('scan')
  }, [memberRole, activeTab])

  if (loadingShop) return <div className="auth-page"><div className="dash-loading"><Logo size={72} /></div></div>
  if (!shop) return null

  const handleLogout = async () => { await signOut(); navigate('/') }
  const shopName = shop.name || 'متجرك'

  const allMenuItems = [
    { id: 'home', label: d.navHome, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg> },
    { id: 'scan', label: d.navScan, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3z"/><path d="M20 14h1M14 20h3M20 20h1"/></svg> },
    { id: 'designer', label: d.navDesigner, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
    // Notifications is admin-only — filtered out below for non-admins.
    { id: 'notifications', adminOnly: true, label: lang === 'ar' ? 'الإشعارات' : 'Notifications', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> },
    { id: 'settings', label: d.navSettings, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
    { id: 'guide', href: '/guide', label: lang === 'ar' ? 'دليل الموظفين' : 'Staff Guide', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><path d="M8 7h8M8 11h6"/></svg> },
  ]

  // Sub-accounts see only Scan & Redeem + the staff guide. Everything else is owner-only.
  // Admin-only items (e.g. notifications) are filtered for non-platform-admins.
  const menuItems = memberRole
    ? allMenuItems.filter((i) => i.id === 'scan' || i.id === 'guide')
    : allMenuItems.filter((i) => !i.adminOnly || isPlatformAdmin === true)

  // Bounce non-admins off the notifications hash so #notifications can't be reached via URL.
  useEffect(() => {
    if (activeTab === 'notifications' && isPlatformAdmin === false) setActiveTab('home')
  }, [activeTab, isPlatformAdmin])

  const statIcons = [
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5"><path d="M23 6l-9.5 9.5-5-5L1 18"/></svg>,
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  ]

  const chev = <svg className="sidebar-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>

  return (
    <div className={`dash-page has-sidebar ${lang === 'en' ? 'ltr-mode' : ''}${mobileNavOpen ? ' mobile-nav-open' : ''}`}>
      {/* Mobile top bar — shows on phones only via CSS */}
      <header className="dash-mobile-bar">
        <button
          type="button"
          className="dash-mobile-menu-btn"
          onClick={() => setMobileNavOpen(true)}
          aria-label={lang === 'ar' ? 'فتح القائمة' : 'Open menu'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div className="dash-mobile-brand"><Logo size={40} /></div>
        <div className="dash-mobile-spacer" />
      </header>

      {/* Drawer overlay — click to close */}
      <div
        className="dash-mobile-overlay"
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />

      {/* Persistent Sidebar (doubles as a mobile drawer) */}
      <aside className={`sidebar sidebar-persistent${mobileNavOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand"><Logo size={72} /></div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="sidebar-shop-block">
          {shop.logo_url ? <img src={shop.logo_url} alt="" className="sidebar-logo" /> : <div className="sidebar-logo-ph"><Logo size={20} /></div>}
          <div className="sidebar-shop-info"><div className="sidebar-shop-name">{shopName}</div><div className="sidebar-shop-type">{shop.type}</div></div>
        </div>
        <div className="sidebar-menu">
          {menuItems.map((item, i) => (
            <motion.button key={item.id} className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => { if (item.href) { window.open(item.href, '_blank', 'noopener'); setMobileNavOpen(false); return } setActiveTab(item.id); setMobileNavOpen(false) }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
              {chev}
            </motion.button>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-footer-toggles">
            <button
              className="sidebar-toggle-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={lang === 'ar' ? 'تبديل الوضع' : 'Toggle theme'}
              title={lang === 'ar' ? 'تبديل الوضع' : 'Toggle theme'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              className="sidebar-toggle-btn"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              aria-label={lang === 'ar' ? 'تغيير اللغة' : 'Switch language'}
              title={lang === 'ar' ? 'English' : 'عربي'}
            >
              <GlobeIcon /><span className="sidebar-toggle-label">{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
          </div>
          {isPlatformAdmin && (
            <button className="sidebar-item sidebar-admin-link" onClick={() => navigate('/admin/metrics')}>
              <span className="sidebar-item-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h7v9H3z"/><path d="M14 3h7v5h-7z"/><path d="M14 12h7v9h-7z"/><path d="M3 16h7v5H3z"/></svg></span>
              <span className="sidebar-item-label">{lang === 'ar' ? 'لوحة المقاييس' : 'Admin Metrics'}</span>
            </button>
          )}
          <button className="sidebar-item sidebar-billing-link" onClick={() => navigate('/billing')}>
            <span className="sidebar-item-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h6"/></svg></span>
            <span className="sidebar-item-label">{lang === 'ar' ? 'الاشتراك' : 'Subscription'}</span>
          </button>
          <button className="sidebar-item sidebar-home-link" onClick={() => navigate('/')}>
            <span className="sidebar-item-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>
            <span className="sidebar-item-label">{d.visitSite}</span>
          </button>
          <button className="sidebar-item sidebar-logout" onClick={handleLogout}>
            <span className="sidebar-item-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></span>
            <span className="sidebar-item-label">{d.logout}</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="dash-content">
        {activeTab === 'home' && (
          <>
            <div className="dash-header">
              <h1 className="dash-title">{d.welcome}، {shopName}</h1>
            </div>

            {shop.account_status === 'on_trial' && shop.trial_ends_at && (() => {
              const ms = new Date(shop.trial_ends_at).getTime() - Date.now()
              const daysLeft = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
              return (
                <div className="dash-demo-banner">
                  {lang === 'ar'
                    ? `فترة تجريبية مجانية — متبقي ${daysLeft} يوم. اشترك الآن للاستمرار بعد انتهاء الفترة.`
                    : `Free trial — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left. Subscribe to keep going after it ends.`}
                </div>
              )
            })()}
            {shop.account_status === 'resubscribe_required' && (
              <div className="dash-demo-banner" style={{ background: 'linear-gradient(90deg, rgba(240,69,69,0.12), rgba(240,69,69,0.05))', borderColor: 'rgba(240,69,69,0.3)' }}>
                {lang === 'ar'
                  ? 'انتهت فترتك التجريبية — اشترك الآن للاستمرار في استخدام وايا.'
                  : 'Your free trial has ended — subscribe now to keep using Waya.'}
              </div>
            )}
            <div className="data-stats-grid">
              {(() => {
                const statsLoading = stats.loading || !shop?.id
                return ([
                  { key: 'customers', value: stats.customers },
                  { key: 'visits', value: `${stats.repeatRatePct}%` },
                  { key: 'revenue', value: stats.rewardsSent.toLocaleString('en-US') },
                  { key: 'rewards', value: stats.rewardsRedeemed.toLocaleString('en-US') },
                ]).map((s, i) => {
                  const clickable = s.key === 'customers'
                  return (
                    <motion.div
                      key={s.key}
                      className={`data-stat-card${clickable ? ' clickable' : ''}`}
                      role={clickable ? 'button' : undefined}
                      tabIndex={clickable ? 0 : undefined}
                      onClick={clickable ? () => setShowCustomers(true) : undefined}
                      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowCustomers(true) } } : undefined}
                      initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
                    >
                      <div className="data-stat-icon-wrap">{statIcons[i]}</div>
                      <div className="data-stat-value">
                        {statsLoading
                          ? <span style={{ opacity: 0.4 }}>—</span>
                          : <CountUp value={typeof s.value === 'number' ? s.value.toLocaleString('en-US') : s.value} duration={2} delay={i * 0.15} />}
                      </div>
                      <div className="data-stat-label">{d.statLabels[s.key]}</div>
                    </motion.div>
                  )
                })
              })()}
            </div>
            <AnimatePresence>
              {showCustomers && (
                <CustomersModal shop={shop} lang={lang} onClose={() => setShowCustomers(false)} />
              )}
            </AnimatePresence>

            {programsLoaded && programs.length === 0 && (
              <motion.section className="dash-card dash-cta-card" initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                <div className="dash-cta-content">
                  <h2 className="dash-cta-title">{d.createFirstCardTitle}</h2>
                  <p className="dash-cta-sub">{d.createFirstCardSub}</p>
                  <button className="lw-btn primary dash-cta-btn" onClick={() => setActiveTab('designer')}>
                    {d.createFirstCardCta}
                  </button>
                </div>
              </motion.section>
            )}

            {programsLoaded && programs.length > 0 && (
              <motion.section className="dash-card dash-cards-card" initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                <div className="dash-cards-head">
                  <h2>{lang === 'ar' ? 'بطاقاتي' : 'My cards'}</h2>
                  <button className="lw-btn dash-cards-new" onClick={() => setActiveTab('designer')}>
                    {lang === 'ar' ? '+ بطاقة جديدة' : '+ New card'}
                  </button>
                </div>
                <div className="dash-cards-list">
                  {programs.map((p) => {
                    const isStamp = p.loyalty_type !== 'points'
                    return (
                      <button
                        key={p.id}
                        className="dash-card-row"
                        onClick={() => setActiveTab('designer')}
                      >
                        <span className="dash-card-swatch" style={{ background: p.card_color || 'var(--green)' }} />
                        <span className="dash-card-info">
                          <span className="dash-card-name">{p.name || (lang === 'ar' ? 'بطاقة ولاء' : 'Loyalty card')}</span>
                          <span className="dash-card-meta">
                            {isStamp
                              ? `${lang === 'ar' ? 'أختام' : 'Stamps'} · ${p.stamps_required || 10}`
                              : (lang === 'ar' ? 'نقاط' : 'Points')}
                          </span>
                        </span>
                        <svg className="dash-card-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points={lang === 'ar' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'}/></svg>
                      </button>
                    )
                  })}
                </div>
              </motion.section>
            )}

          </>
        )}

        {activeTab === 'notifications' && isPlatformAdmin === true && (
          <Suspense fallback={<LazyFallback />}>
            <NotificationsTab lang={lang} shopName={shop?.name} />
          </Suspense>
        )}

        {activeTab === 'data' && (
          <>
            <h1 className="dash-title">{t.dataPage.title}</h1>
            <div className="data-stats-grid">
              {[
                { label: t.dataPage.customers, value: stats.customers.toLocaleString('en-US'), icon: '👥', color: '#10B981' },
                { label: t.dataPage.totalScans, value: stats.scans.toLocaleString('en-US'), icon: '📱', color: '#3B82F6' },
                { label: t.dataPage.rewardsRedeemed, value: stats.rewardsRedeemed.toLocaleString('en-US'), icon: '🎁', color: '#F59E0B' },
                { label: t.dataPage.totalPoints, value: stats.totalPoints.toLocaleString('en-US'), icon: '⭐', color: '#8B5CF6' },
              ].map((sc, i) => (
                <motion.div key={i} className="data-stat-card" initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}>
                  <div className="data-stat-icon" style={{ background: sc.color + '18', color: sc.color }}>{sc.icon}</div>
                  <div className="data-stat-value"><CountUp value={sc.value} duration={2} delay={i * 0.15} /></div>
                  <div className="data-stat-label">{sc.label}</div>
                </motion.div>
              ))}
            </div>
            <motion.div className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <div className="dash-empty"><p>{t.dataPage.moreComingSoon}</p></div>
            </motion.div>
          </>
        )}

        {activeTab === 'scan' && (
          <Suspense fallback={<LazyFallback />}>
            <ScanRedeemTab shop={shop} lang={lang} d={d} />
          </Suspense>
        )}

        {activeTab === 'designer' && (
          <Suspense fallback={<LazyFallback />}>
            <DesignerTab shop={shop} lang={lang} />
          </Suspense>
        )}

        {activeTab === 'settings' && (
          <>
            <h1 className="dash-title">{t.settingsPage.title}</h1>
            <MerchantProfileCard shop={shop} setShop={setShop} t={t} lang={lang} />
            <motion.div className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2>{t.settingsPage.account}</h2>
              <div className="settings-account-info">
                <p><strong>{t.settingsPage.email}:</strong> {user?.email}</p>
                <p><strong>{t.settingsPage.joined}:</strong> {new Date(user?.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </motion.div>
            <TeamCard shop={shop} lang={lang} />
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Team / sub-account card (Settings > Team) ─── */
function TeamCard({ shop, lang }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('cashier')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('shop_members')
      .select('id, name, role, user_id, created_at')
      .eq('shop_id', shop.id)
      .maybeSingle()
    setMember(data || null)
    setLoading(false)
  }

  useEffect(() => { if (shop?.id) load() }, [shop?.id])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const { data, error } = await supabase.functions.invoke('create-subaccount', {
      body: { name: name.trim(), email: email.trim(), password, role },
    })
    setBusy(false)
    if (error || !data?.success) {
      setMsg({ kind: 'err', text: data?.error || error?.message || 'Failed' })
      return
    }
    setName(''); setEmail(''); setPassword(''); setRole('cashier')
    setShowForm(false)
    setMsg({ kind: 'ok', text: T('Sub-account created.', 'تم إنشاء الحساب الفرعي.') })
    load()
  }

  const remove = async () => {
    if (!confirm(T('Remove this sub-account? The user will lose access.', 'إزالة هذا الحساب الفرعي؟'))) return
    setBusy(true); setMsg(null)
    const { data, error } = await supabase.functions.invoke('delete-subaccount', { body: {} })
    setBusy(false)
    if (error || !data?.success) {
      setMsg({ kind: 'err', text: data?.error || error?.message || 'Failed' })
      return
    }
    setMsg({ kind: 'ok', text: T('Sub-account removed.', 'تمت إزالة الحساب.') })
    load()
  }

  const roleLabel = (r) => r === 'branch_manager' ? T('Branch manager', 'مدير فرع') : T('Cashier', 'كاشير')

  return (
    <motion.div className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <h2>{T('Team', 'الفريق')}</h2>
      <p style={{ marginTop: -4, color: 'var(--muted, #6b7280)', fontSize: 13 }}>
        {T('Add one staff member who can log in to this shop. Roles are informational for now.',
           'أضف موظفاً واحداً لتسجيل الدخول إلى متجرك. الأدوار معلوماتية حالياً.')}
      </p>

      {loading && <p>{T('Loading…', 'جارٍ التحميل…')}</p>}

      {!loading && member && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{member.name}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{roleLabel(member.role)}</div>
            </div>
            <button type="button" onClick={remove} disabled={busy}
              style={{ padding: '6px 12px', border: '1px solid #dc2626', background: 'transparent', color: '#dc2626', borderRadius: 6, cursor: 'pointer' }}>
              {T('Remove', 'إزالة')}
            </button>
          </div>
        </div>
      )}

      {!loading && !member && !showForm && (
        <button type="button" onClick={() => setShowForm(true)}
          style={{ marginTop: 12, padding: '8px 16px', border: '1px solid #10B981', background: '#10B981', color: 'white', borderRadius: 6, cursor: 'pointer' }}>
          {T('+ Add sub-account', '+ إضافة حساب فرعي')}
        </button>
      )}

      {!loading && !member && showForm && (
        <form onSubmit={submit} style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{T('Name', 'الاسم')}</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{T('Email', 'البريد الإلكتروني')}</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{T('Password (min 8)', 'كلمة المرور (8 أحرف على الأقل)')}</span>
            <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{T('Role', 'الدور')}</span>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="cashier">{T('Cashier', 'كاشير')}</option>
              <option value="branch_manager">{T('Branch manager', 'مدير فرع')}</option>
            </select>
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={busy}
              style={{ padding: '8px 16px', border: 'none', background: '#10B981', color: 'white', borderRadius: 6, cursor: busy ? 'wait' : 'pointer' }}>
              {busy ? T('Creating…', 'جارٍ الإنشاء…') : T('Create', 'إنشاء')}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setMsg(null) }}
              style={{ padding: '8px 16px', border: '1px solid #d1d5db', background: 'transparent', borderRadius: 6, cursor: 'pointer' }}>
              {T('Cancel', 'إلغاء')}
            </button>
          </div>
        </form>
      )}

      {msg && (
        <p style={{ marginTop: 10, color: msg.kind === 'err' ? '#dc2626' : '#059669', fontSize: 13 }}>
          {msg.text}
        </p>
      )}
    </motion.div>
  )
}

/* ─── Merchant profile card (Settings > Business Info) ─── */
function MerchantProfileCard({ shop, setShop, t, lang }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)
  const [name, setName] = useState(shop.name || '')
  const [crNumber, setCrNumber] = useState(shop.cr_number || '')
  const [phone, setPhone] = useState(shop.phone || '')
  const [address, setAddress] = useState(shop.address || '')
  const [shopType, setShopType] = useState(shop.type || '')
  const [locations, setLocations] = useState(Array.isArray(shop.locations) ? shop.locations : [])
  const [logoUrl, setLogoUrl] = useState(shop.logo_url || null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleLogoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert(isAr ? 'الحجم أكبر من 2MB' : 'File too large (max 2MB)'); return }
    if (!file.type.startsWith('image/')) return
    setLogoUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${shop.id}/logo.${ext}`
    const { error: uploadErr } = await supabase.storage.from('shop-logos').upload(path, file, { upsert: true })
    if (uploadErr) { console.error(uploadErr); setLogoUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(path)
    const timestamped = publicUrl + '?t=' + Date.now()
    setLogoUrl(timestamped)
    await supabase.from('shops').update({ logo_url: timestamped }).eq('id', shop.id)
    shop.logo_url = timestamped
    setShop({ ...shop, logo_url: timestamped })
    setLogoUploading(false)
  }

  const addLocation = () => setLocations([...locations, { name: '', latitude: '', longitude: '', relevant_text: '' }])
  const removeLocation = (i) => setLocations(locations.filter((_, idx) => idx !== i))
  const updateLocation = (i, field, value) => {
    const copy = [...locations]
    copy[i] = { ...copy[i], [field]: field === 'latitude' || field === 'longitude' ? (value === '' ? '' : Number(value)) : value }
    setLocations(copy)
  }

  const useCurrent = (i) => {
    if (!navigator.geolocation) { alert(T('Geolocation not supported', 'تحديد الموقع غير مدعوم')); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => updateLocation(i, 'latitude', pos.coords.latitude) || updateLocation(i, 'longitude', pos.coords.longitude) || setLocations((prev) => {
        const copy = [...prev]
        copy[i] = { ...copy[i], latitude: Number(pos.coords.latitude.toFixed(6)), longitude: Number(pos.coords.longitude.toFixed(6)) }
        return copy
      }),
      (err) => alert(T('Could not get location: ', 'تعذّر تحديد الموقع: ') + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const save = async () => {
    setSaving(true); setMsg(null)
    const cleanLocations = locations
      .filter((l) => l.latitude !== '' && l.longitude !== '' && !isNaN(Number(l.latitude)) && !isNaN(Number(l.longitude)))
      .map((l) => ({
        name: (l.name || '').trim(),
        latitude: Number(l.latitude),
        longitude: Number(l.longitude),
        relevant_text: (l.relevant_text || '').trim() || null,
      }))
    const { data, error } = await supabase.from('shops').update({
      name: name.trim(),
      cr_number: crNumber.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      type: shopType || null,
      locations: cleanLocations,
    }).eq('id', shop.id).select().single()
    setSaving(false)
    if (error) { setMsg({ type: 'err', text: error.message }); return }
    setShop(data)
    setLocations(cleanLocations)
    setMsg({ type: 'ok', text: T('Saved', 'تم الحفظ') })
    setTimeout(() => setMsg(null), 2500)
  }

  return (
    <motion.div className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <h2>{t.settingsPage.shopInfo}</h2>
      <div className="auth-form" style={{ gap: 18 }}>
        <div className="auth-field">
          <label>{T('Shop Logo', 'شعار المتجر')}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 72, height: 72, borderRadius: 14, border: '2px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f9fafb', flexShrink: 0 }}>
              {logoUrl ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28, color: '#d1d5db' }}>+</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="auth-btn" style={{ cursor: 'pointer', fontSize: 13, padding: '6px 16px', textAlign: 'center', opacity: logoUploading ? 0.6 : 1 }}>
                {logoUploading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'تغيير الشعار' : 'Change Logo')}
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} disabled={logoUploading} />
              </label>
              <small style={{ color: '#6b7280' }}>{T('PNG or JPG, max 2MB', 'PNG أو JPG، أقصى حجم 2 ميقا')}</small>
            </div>
          </div>
        </div>
        <div className="auth-field">
          <label>{T('Business name', 'اسم النشاط')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="auth-field">
          <label>{T('Commercial Registration (CR) number', 'رقم السجل التجاري')}</label>
          <input type="text" value={crNumber} onChange={(e) => setCrNumber(e.target.value)} dir="ltr" placeholder="1010XXXXXX" />
          <small style={{ color: '#6b7280' }}>{T('Used for invoices and verification', 'يُستخدم للفواتير والتحقق')}</small>
        </div>
        <div className="auth-field">
          <label>{t.setup.shopType}</label>
          <select value={shopType} onChange={(e) => setShopType(e.target.value)} className="setup-select">
            <option value="">—</option>
            {t.setup.types.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
          </select>
        </div>
        <div className="setup-row">
          <div className="auth-field"><label>{t.setup.phone}</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" /></div>
          <div className="auth-field"><label>{t.setup.address}</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        </div>

        <div className="mp-locations">
          <div className="mp-loc-header">
            <h3 style={{ margin: 0 }}>{T('Locations', 'المواقع')}</h3>
            <small style={{ color: '#6b7280' }}>
              {T('Wallet passes surface on the lock screen when customers are nearby.', 'تظهر البطاقة على شاشة قفل العميل عندما يكون قريباً من أحد مواقعك.')}
            </small>
          </div>
          {locations.length === 0 && (
            <p style={{ color: '#6b7280', fontSize: 13 }}>{T('No locations yet. Add at least one to enable nearby lock-screen notifications.', 'لم تُضف أي مواقع بعد. أضف موقعاً واحداً على الأقل لتفعيل الإشعارات القريبة على شاشة القفل.')}</p>
          )}
          {locations.map((loc, i) => (
            <div key={i} className="mp-loc-row">
              <input className="mp-loc-name" type="text" placeholder={T('Branch name (e.g. Main store)', 'اسم الفرع (مثال: الفرع الرئيسي)')} value={loc.name || ''} onChange={(e) => updateLocation(i, 'name', e.target.value)} />
              <input className="mp-loc-coord" type="number" step="any" placeholder="Lat" value={loc.latitude ?? ''} onChange={(e) => updateLocation(i, 'latitude', e.target.value)} dir="ltr" />
              <input className="mp-loc-coord" type="number" step="any" placeholder="Lng" value={loc.longitude ?? ''} onChange={(e) => updateLocation(i, 'longitude', e.target.value)} dir="ltr" />
              <input className="mp-loc-rel" type="text" placeholder={T('Lock-screen text (e.g. Welcome back!)', 'نص الشاشة (مثال: أهلاً بعودتك!)')} value={loc.relevant_text || ''} onChange={(e) => updateLocation(i, 'relevant_text', e.target.value)} />
              <button type="button" className="mp-loc-btn" onClick={() => useCurrent(i)} title={T('Use my current location', 'استخدم موقعي الحالي')}>📍</button>
              <button type="button" className="mp-loc-btn mp-loc-del" onClick={() => removeLocation(i)}>×</button>
            </div>
          ))}
          <button type="button" className="mp-loc-add" onClick={addLocation}>+ {T('Add location', 'إضافة موقع')}</button>
        </div>

        {msg && <div className={msg.type === 'ok' ? 'mp-ok' : 'mp-err'}>{msg.text}</div>}
        <button className="auth-submit-btn" onClick={save} disabled={saving}>
          {saving ? T('Saving…', 'جارٍ الحفظ…') : t.settingsPage.save}
        </button>
      </div>
    </motion.div>
  )
}

/* ─── DataPage, LoyaltyPage, SettingsPage now handled inside DashboardPage tabs ─── */
function DataPage(props) { return <DashboardPage {...props} /> }
function SettingsPage(props) { return <DashboardPage {...props} /> }

/* ─── Reset Password Page ─── */
function ResetPasswordPage({ t, lang, setLang, theme, setTheme }) {
  const a = t.auth
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Check if session already established from hash (race condition fix)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async (e) => {
    e.preventDefault()
    if (password.length < 6) { setError(a.errPassword); return }
    if (password !== confirm) { setError(a.resetErrMatch); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false) }
    else setDone(true)
  }

  const topBar = (
    <div className="auth-top-bar">
      <button onClick={() => navigate('/')} className="auth-back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={lang === 'ar' ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}/></svg>
        {a.back}
      </button>
      <div className="auth-top-actions">
        <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <button className="lang-toggle" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
          <GlobeIcon /><span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
        </button>
      </div>
    </div>
  )

  if (done) {
    return (
      <div className="auth-page">
        {topBar}
        <motion.div className="auth-card" style={{ textAlign: 'center' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 className="auth-title">{a.resetSuccess}</h1>
          <p className="auth-subtitle">{a.resetSuccessMsg}</p>
          <button onClick={() => navigate('/login')} className="auth-submit-btn" style={{ marginTop: 24 }}>{a.goLogin}</button>
        </motion.div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="auth-page">
        {topBar}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ textAlign: 'center', color: '#888' }}>...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      {topBar}
      <motion.div className="auth-card" initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        <motion.div className="auth-brand" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}><Logo size={100} /></motion.div>
        <motion.h1 className="auth-title" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>{a.resetTitle}</motion.h1>
        <motion.p className="auth-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>{a.resetSub}</motion.p>
        <form onSubmit={handleReset} className="auth-form">
          <motion.div className="auth-field" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <label>{a.resetNewPass}</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder={a.resetNewPassPh} dir="ltr" autoFocus />
          </motion.div>
          <motion.div className="auth-field" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
            <label>{a.resetConfirmPass}</label>
            <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }}
              placeholder={a.resetNewPassPh} dir="ltr" />
          </motion.div>
          <AnimatePresence>{error && <motion.p className="auth-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.p>}</AnimatePresence>
          <motion.button type="submit" disabled={loading} className="auth-submit-btn" whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(16,185,129,0.25)' }} whileTap={{ scale: 0.97 }}>
            {loading ? a.resetSaving : a.resetBtn}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}

/* ─── Auth Redirect (redirects logged-in users away from landing/login/signup) ─── */
function AuthRedirect({ children }) {
  const { user, loading } = useAuth()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) { setChecked(true); return }
    const path = window.location.pathname
    if (path === '/' || path === '/login' || path === '/signup') {
      ;(async () => {
        const { data: ownedShop } = await supabase.from('shops').select('id').eq('user_id', user.id).maybeSingle()
        if (ownedShop) { navigate('/dashboard'); return }
        const { data: member } = await supabase.from('shop_members').select('id').eq('user_id', user.id).maybeSingle()
        navigate(member ? '/dashboard' : '/setup')
      })()
    } else {
      setChecked(true)
    }
  }, [user, loading])

  if (loading || !checked) return null
  return children || null
}

/* ─── Programs Page Wrapper (loads shop, renders <ProgramsList />) ─── */
function ProgramsPageWrapper({ lang, setLang, theme, setTheme, t }) {
  const { user, loading } = useAuth()
  const [shop, setShop] = useState(null)
  const [err, setErr] = useState(null)
  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/login'); return }
    supabase.from('shops').select('*').eq('user_id', user.id).single()
      .then(({ data, error }) => {
        if (error) { setErr(error.message); return }
        if (!data) { navigate('/setup'); return }
        setShop(data)
      })
  }, [user, loading])
  if (loading || !shop) return <div style={{padding:60,textAlign:'center'}}>{err || 'Loading…'}</div>
  return (
    <Suspense fallback={<LazyFallback />}>
      <ProgramsList shop={shop} lang={lang} />
    </Suspense>
  )
}

/* ─── Admin gate: single source of truth is the public.platform_admins table ─── */
function useIsPlatformAdmin() {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(null)
  useEffect(() => {
    if (authLoading) return
    if (!user) { setIsAdmin(false); return }
    let cancelled = false
    supabase.rpc('is_platform_admin').then(({ data, error }) => {
      if (cancelled) return
      setIsAdmin(!error && data === true)
    })
    return () => { cancelled = true }
  }, [user, authLoading])
  return { isAdmin, loading: authLoading || isAdmin === null }
}

/* ─── Admin Metrics Dashboard (auto-refresh every 15 min; customers every 30s) ─── */
function AdminMetricsPage({ lang, setLang, theme, setTheme, t }) {
  const { user, loading } = useAuth()
  const { isAdmin, loading: adminLoading } = useIsPlatformAdmin()
  const isAr = lang === 'ar'
  const [metrics, setMetrics] = useState(null)
  const [err, setErr] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  const REFRESH_MS = 15 * 60 * 1000

  const [customers, setCustomers] = useState([])
  const [customersFetching, setCustomersFetching] = useState(false)
  const [customersLastRefresh, setCustomersLastRefresh] = useState(null)
  const [customersErr, setCustomersErr] = useState(null)
  const [shopFilter, setShopFilter] = useState('all')
  const CUSTOMERS_REFRESH_MS = 30 * 1000

  const load = async () => {
    setFetching(true)
    const { data, error } = await supabase.rpc('platform_metrics')
    if (error) { setErr(error.message); setMetrics(null); setFetching(false); return }
    setMetrics(data)
    setLastRefresh(new Date())
    setErr(null)
    setFetching(false)
  }

  const loadCustomers = async () => {
    setCustomersFetching(true)
    const { data, error } = await supabase.rpc('platform_customers_list')
    if (error) { setCustomersErr(error.message); setCustomersFetching(false); return }
    setCustomers(data || [])
    setCustomersLastRefresh(new Date())
    setCustomersErr(null)
    setCustomersFetching(false)
  }

  useEffect(() => {
    if (!user || !isAdmin) return
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [user, isAdmin])

  useEffect(() => {
    if (!user || !isAdmin) return
    loadCustomers()
    const id = setInterval(loadCustomers, CUSTOMERS_REFRESH_MS)
    return () => clearInterval(id)
  }, [user, isAdmin])

  if (loading || adminLoading) return <div className="auth-page"><div className="dash-loading"><Logo size={72} /></div></div>
  if (!user || !isAdmin) {
    return (
      <div className="auth-page" style={{ padding: 40, textAlign: 'center' }}>
        <h2>{isAr ? 'غير مصرّح' : 'Not authorized'}</h2>
        <p style={{ color: 'var(--muted)' }}>
          {isAr ? 'هذه الصفحة للمسؤولين فقط.' : 'This page is for admins only.'}
        </p>
      </div>
    )
  }

  const M = metrics || {}
  const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'))
  const card = (label, value, sub) => (
    <div className="admin-metric-card">
      <div className="admin-metric-label">{label}</div>
      <div className="admin-metric-value">{fmt(value)}</div>
      {sub != null && <div className="admin-metric-sub">{sub}</div>}
    </div>
  )

  const shopOptions = (() => {
    const map = new Map()
    for (const row of customers) {
      if (row.shop_id && !map.has(row.shop_id)) map.set(row.shop_id, row.business_name || '(unnamed)')
    }
    return Array.from(map.entries()).sort((a, b) => (a[1] || '').localeCompare(b[1] || ''))
  })()

  const filteredCustomers = shopFilter === 'all'
    ? customers
    : customers.filter(r => r.shop_id === shopFilter)

  const fmtDt = (iso) => {
    if (!iso) return '—'
    const dt = new Date(iso)
    return dt.toLocaleString(isAr ? 'ar-SA' : 'en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const downloadCsv = () => {
    const headers = ['business_name', 'owner_email', 'program_name', 'customer_name', 'customer_phone', 'stamps', 'points', 'rewards_balance', 'last_visit_at', 'created_at']
    const esc = (v) => {
      if (v == null) return ''
      const s = String(v)
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = filteredCustomers.map(r => headers.map(h => esc(r[h])).join(','))
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    const suffix = shopFilter === 'all' ? 'all' : (shopOptions.find(([id]) => id === shopFilter)?.[1] || shopFilter).replace(/\s+/g, '_')
    a.download = `waya-customers-${suffix}-${stamp}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`app ${lang === 'en' ? 'ltr-mode' : ''}`}>
      <Navbar lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />
      <section className="admin-metrics-page">
        <div className="admin-metrics-head">
          <div>
            <h1>{isAr ? 'لوحة المقاييس' : 'Platform Metrics'}</h1>
            <p className="admin-metrics-sub">
              {isAr
                ? `يحدّث تلقائياً كل 15 دقيقة${lastRefresh ? ` · آخر تحديث ${lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}`
                : `Auto-refresh every 15 min${lastRefresh ? ` · last updated ${lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}`}
            </p>
          </div>
          <button className="lw-btn" onClick={load} disabled={fetching}>
            {fetching ? (isAr ? 'جاري التحديث…' : 'Refreshing…') : (isAr ? 'تحديث الآن' : 'Refresh now')}
          </button>
        </div>

        {err && (
          <div className="admin-metric-error">{err}</div>
        )}

        <div className="admin-metrics-grid">
          {card(isAr ? 'المتاجر'         : 'Businesses',       M.shops_total,      isAr ? `${fmt(M.shops_active)} نشطة · ${fmt(M.shops_with_cards)} أصدرت بطاقات` : `${fmt(M.shops_active)} active · ${fmt(M.shops_with_cards)} have cards`)}
          {card(isAr ? 'تسجيلات الدخول' : 'Signups',          M.users_total,      isAr ? `+${fmt(M.users_7d)} هذا الأسبوع · +${fmt(M.users_24h)} اليوم` : `+${fmt(M.users_7d)} this week · +${fmt(M.users_24h)} today`)}
          {card(isAr ? 'العملاء (بطاقات)' : 'Customers (cards)', M.cards_total,      isAr ? `+${fmt(M.cards_7d)} هذا الأسبوع · +${fmt(M.cards_24h)} اليوم` : `+${fmt(M.cards_7d)} this week · +${fmt(M.cards_24h)} today`)}
          {card(isAr ? 'الزيارات'         : 'Visits (stamps)',  M.visits_total,     isAr ? `+${fmt(M.visits_7d)} هذا الأسبوع · +${fmt(M.visits_24h)} اليوم` : `+${fmt(M.visits_7d)} this week · +${fmt(M.visits_24h)} today`)}
          {card(isAr ? 'المكافآت المستبدلة' : 'Rewards redeemed', M.rewards_redeemed, isAr ? `+${fmt(M.rewards_redeemed_7d)} هذا الأسبوع` : `+${fmt(M.rewards_redeemed_7d)} this week`)}
          {card(isAr ? 'إجمالي المكافآت الممنوحة' : 'Total rewards earned', M.rewards_earned_total, isAr ? 'مستبدلة + جاهزة' : 'redeemed + unredeemed')}
        </div>

        {M.last_activity_at && (
          <div className="admin-metrics-foot">
            {isAr ? 'آخر نشاط' : 'Last activity'}: {new Date(M.last_activity_at).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
          </div>
        )}

        <div className="admin-customers-section">
          <div className="admin-customers-head">
            <div>
              <h2>{isAr ? 'العملاء' : 'Customers'}</h2>
              <p className="admin-metrics-sub">
                {isAr
                  ? `يحدّث كل 30 ثانية${customersLastRefresh ? ` · آخر تحديث ${customersLastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}`
                  : `Live · refreshes every 30s${customersLastRefresh ? ` · last updated ${customersLastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}`}
              </p>
            </div>
            <div className="admin-customers-controls">
              <select
                className="admin-customers-select"
                value={shopFilter}
                onChange={(e) => setShopFilter(e.target.value)}
                aria-label={isAr ? 'اختر متجر' : 'Filter by business'}
              >
                <option value="all">{isAr ? `جميع المتاجر (${shopOptions.length})` : `All businesses (${shopOptions.length})`}</option>
                {shopOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <button className="lw-btn lw-btn-secondary" onClick={loadCustomers} disabled={customersFetching}>
                {customersFetching ? (isAr ? '…' : '…') : (isAr ? 'تحديث' : 'Refresh')}
              </button>
              <button className="lw-btn" onClick={downloadCsv} disabled={filteredCustomers.length === 0}>
                {isAr ? 'تنزيل CSV' : 'Download CSV'}
              </button>
            </div>
          </div>

          {customersErr && <div className="admin-metric-error">{customersErr}</div>}

          <div className="admin-customers-count">
            {isAr
              ? `${fmt(filteredCustomers.length)} عميل`
              : `${fmt(filteredCustomers.length)} ${filteredCustomers.length === 1 ? 'customer' : 'customers'}`}
          </div>

          <div className="admin-customers-table-wrap">
            <table className="admin-customers-table">
              <thead>
                <tr>
                  <th>{isAr ? 'المتجر' : 'Business'}</th>
                  <th>{isAr ? 'البرنامج' : 'Program'}</th>
                  <th>{isAr ? 'الاسم' : 'Name'}</th>
                  <th>{isAr ? 'الجوال' : 'Phone'}</th>
                  <th style={{ textAlign: 'end' }}>{isAr ? 'الأختام' : 'Stamps'}</th>
                  <th style={{ textAlign: 'end' }}>{isAr ? 'النقاط' : 'Points'}</th>
                  <th>{isAr ? 'آخر زيارة' : 'Last visit'}</th>
                  <th>{isAr ? 'تاريخ الانضمام' : 'Joined'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr><td colSpan={8} className="admin-customers-empty">
                    {isAr ? 'لا يوجد عملاء' : 'No customers to show'}
                  </td></tr>
                ) : filteredCustomers.map(r => (
                  <tr key={r.customer_pass_id}>
                    <td>{r.business_name || '—'}</td>
                    <td>{r.program_name || '—'}</td>
                    <td>{r.customer_name || '—'}</td>
                    <td dir="ltr" style={{ textAlign: isAr ? 'end' : 'start' }}>{r.customer_phone || '—'}</td>
                    <td style={{ textAlign: 'end' }}>{fmt(r.stamps)}</td>
                    <td style={{ textAlign: 'end' }}>{fmt(r.points)}</td>
                    <td>{fmtDt(r.last_visit_at)}</td>
                    <td>{fmtDt(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

function AdminEventsPage({ lang, setLang, theme, setTheme }) {
  const { user, loading } = useAuth()
  const { isAdmin, loading: adminLoading } = useIsPlatformAdmin()
  const [shops, setShops] = useState([])
  const [selectedShopId, setSelectedShopId] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (loading || adminLoading) return
    if (!user) { navigate('/login'); return }
    if (!isAdmin) { setErr('Not authorized'); return }
    supabase.from('shops').select('id, name').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { setErr(error.message); return }
        setShops(data || [])
        if (data && data[0]) setSelectedShopId(data[0].id)
      })
  }, [user, loading, isAdmin, adminLoading])

  if (loading || adminLoading) return <div style={{ padding: 60, textAlign: 'center' }}>Loading…</div>
  if (err) return <div style={{ padding: 60, textAlign: 'center', color: '#b91c1c' }}>{err}</div>
  if (!user) return null

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 8 }}>Admin · Events</h1>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: 20 }}>
        Signed in as <strong>{user.email}</strong>
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <label style={{ fontSize: '0.85rem', color: '#555' }}>Shop:</label>
        <select
          value={selectedShopId || ''}
          onChange={(e) => setSelectedShopId(e.target.value)}
          style={{ padding: '8px 10px', border: '1px solid #e5e5e8', borderRadius: 8 }}
        >
          {shops.map((s) => (
            <option key={s.id} value={s.id}>{s.name || s.id.slice(0, 8)}</option>
          ))}
        </select>
        <span style={{ fontSize: '0.8rem', color: '#888' }}>
          ({shops.length} shop{shops.length === 1 ? '' : 's'})
        </span>
      </div>
      {selectedShopId && (
        <Suspense fallback={<LazyFallback />}>
          <EventsPanel shopId={selectedShopId} lang={lang} />
        </Suspense>
      )}
    </div>
  )
}

/* ─── App ─── */
export default function App() {
  const [lang, setLang] = useState('ar')
  const [theme, setTheme] = useState('light')
  const [page, setPage] = useState(null)
  const t = content[lang]

  useSmoothScroll()

  const routePath = (p) => {
    if (p === '/privacy') return 'privacy'
    if (p === '/terms') return 'terms'
    if (p === '/login') return 'login'
    if (p === '/signup') return 'signup'
    if (p === '/setup') return 'setup'
    if (p === '/dashboard') return 'dashboard'
    if (p === '/data') return 'data'
    if (p === '/settings') return 'settings'
    if (p === '/guide') return 'guide'
    if (p === '/billing') return 'billing'
    if (p === '/billing/return') return 'billing-return'
    if (p === '/billing/cancel') return 'billing-cancel'
    if (p === '/admin/events') return 'admin-events'
    if (p === '/admin/metrics') return 'admin-metrics'
    if (p === '/reset-password') return 'reset-password'
    if (p === '/programs' || p.startsWith('/programs/')) return 'programs'
    if (p.startsWith('/w/')) return 'enroll'
    if (p.startsWith('/wallet/')) return 'wallet'
    return 'home'
  }

  // Simple path-based routing
  useEffect(() => {
    const path = window.location.pathname
    setPage(routePath(path))

    const handlePopState = () => {
      setPage(routePath(window.location.pathname))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  if (page === null) return null

  if (page === 'privacy') return <AuthProvider><PrivacyPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'terms') return <AuthProvider><TermsPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'login') return <AuthProvider><LoginPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'signup') return <AuthProvider><SignupPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'reset-password') return <AuthProvider><ResetPasswordPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'setup') return <AuthProvider><SetupPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'dashboard') return <AuthProvider><DashboardPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'data') return <AuthProvider><DataPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'settings') return <AuthProvider><SettingsPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'wallet') return <WalletPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />
  if (page === 'enroll') return <Suspense fallback={<LazyFallback />}><WalletEnrollPage lang={lang} /></Suspense>
  if (page === 'programs') return <AuthProvider><ProgramsPageWrapper lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'billing') return <AuthProvider><Suspense fallback={<LazyFallback />}><BillingPage lang={lang} /></Suspense></AuthProvider>
  if (page === 'billing-return') return <AuthProvider><Suspense fallback={<LazyFallback />}><BillingReturnPage lang={lang} /></Suspense></AuthProvider>
  if (page === 'billing-cancel') return <AuthProvider><Suspense fallback={<LazyFallback />}><BillingCancelPage lang={lang} /></Suspense></AuthProvider>
  if (page === 'admin-events') return <AuthProvider><AdminEventsPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} /></AuthProvider>
  if (page === 'admin-metrics') return <AuthProvider><AdminMetricsPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'guide') return <Suspense fallback={<LazyFallback />}><GuidePage /></Suspense>

  return (
    <AuthProvider>
      <AuthRedirect>
        <div className={`app ${lang === 'en' ? 'ltr-mode' : ''}`}>
          <Navbar lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />
          <Hero t={t} />
          <WhyWaya t={t} lang={lang} />
          <WhoWeServe t={t} />
          <WalletCards t={t} />
          <PosIntegrations t={t} />
          <SocialProof t={t} />
          <Calculator t={t} lang={lang} />
          <Pricing t={t} lang={lang} />
          <FAQ t={t} lang={lang} />
          <CTA t={t} />
          <Footer t={t} lang={lang} />
        </div>
      </AuthRedirect>
    </AuthProvider>
  )
}
