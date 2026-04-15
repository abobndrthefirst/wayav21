import { useEffect, useRef, useState, createContext, useContext, lazy, Suspense } from 'react'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
// Analytics loaded via script tag in index.html
import './styles.css'
import './components/loyalty-wizard.css'
import './components/notifications-panel.css'

// Lazy-load the heavy merchant + customer flows so the marketing landing
// page doesn't ship a LoyaltyWizard / WalletEnrollPage bundle it never uses.
const ProgramsList = lazy(() => import('./components/ProgramsList'))
const WalletEnrollPage = lazy(() => import('./components/WalletEnrollPage'))
const EventsPanel = lazy(() => import('./components/EventsPanel'))
const NotificationsPanel = lazy(() => import('./components/NotificationsPanel'))

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

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => { await supabase.auth.signOut() }

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
    nav: { cta: 'ابدأ مجاناً', pricing: 'الأسعار', features: 'المميزات', how: 'كيف يعمل', login: 'دخول', signup: 'سجّل', logout: 'خروج', hi: 'مرحباً' },
    auth: {
      loginTitle: 'تسجيل الدخول', loginSub: 'ادخل لحسابك وابدأ تدير برنامج الولاء',
      signupTitle: 'إنشاء حساب', signupSub: 'سجّل الحين وابدأ أسبوعك المجاني',
      email: 'الإيميل', password: 'كلمة المرور', name: 'الاسم الكامل',
      emailPh: 'name@example.com', passwordPh: 'ادخل كلمة المرور', namePh: 'مثلاً: أحمد علي',
      loginBtn: 'دخول', signupBtn: 'أنشئ حسابي', googleBtn: 'الدخول عبر Google', googleSignup: 'التسجيل عبر Google',
      or: 'أو', forgot: 'نسيت كلمة المرور؟', back: 'الرئيسية',
      noAccount: 'ما عندك حساب؟', hasAccount: 'عندك حساب؟', goSignup: 'سجّل الحين', goLogin: 'سجّل دخول',
      errInvalid: 'الإيميل أو كلمة المرور غلط', errEmpty: 'ادخل الإيميل وكلمة المرور',
      errName: 'ادخل اسمك', errEmail: 'ادخل إيميل صحيح', errPassword: 'كلمة المرور لازم ٦ أحرف على الأقل',
      logging: 'جاري الدخول...', signing: 'جاري التسجيل...',
      successTitle: 'تم التسجيل!', successMsg: 'تفقد إيميلك وفعّل حسابك عشان تقدر تدخل.',
      errEmailFirst: 'ادخل إيميلك أولاً', resetSent: 'تم إرسال رابط إعادة التعيين على إيميلك',
    },
    setup: {
      title: 'أعدّ متجرك', subtitle: 'أكمل معلومات متجرك عشان تبدأ',
      shopName: 'اسم المتجر', shopNamePh: 'مثلاً: كوفي لاونج',
      shopType: 'نوع النشاط', shopTypePh: 'اختر نوع النشاط',
      types: ['مقهى', 'مطعم', 'صالون', 'بقالة', 'ملابس', 'إلكترونيات', 'أخرى'],
      phone: 'رقم الجوال', phonePh: '05xxxxxxxx',
      address: 'العنوان', addressPh: 'مثلاً: الرياض، حي النخيل',
      instagram: 'انستقرام', twitter: 'تويتر',
      logo: 'شعار المتجر', logoUpload: 'اختر صورة', logoHint: 'PNG أو JPG، أقصى حجم ٢ ميقا',
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
      navHome: 'الرئيسية', navData: 'البيانات', navLoyalty: 'برنامج الولاء', navCards: 'بطاقات الولاء', navSettings: 'الإعدادات',
      visitSite: 'زيارة الموقع',
      demoBanner: 'هذا عرض تجريبي — سنتواصل معك قريباً لتفعيل حسابك. في هذه الأثناء، استكشف لوحة التحكم!',
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
      title1: 'عميلك اللي يرجع',
      title2: 'يسوى أكثر من عشرة جدد',
      subtitle: 'وايا يحوّل زيارة وحدة إلى علاقة طويلة. برنامج ولاء جاهز، يشتغل من أول يوم — بدون جهاز مخصص، بدون تعقيد، وبدون ما تحتاج فريق تقني.',
      freeTrial: 'اول أسبوعين مجاناً — بدون أي التزام — جربها بنفسك',
      inputPlaceholder: 'إيميلك أو رقم جوالك',
      storeNamePlaceholder: 'اسم متجرك',
      industryPlaceholder: 'نوع النشاط',
      industries: ['مطعم', 'كافيه', 'صالون', 'مغسلة', 'حلويات', 'بقالة', 'ملابس', 'أخرى'],
      btn: 'ابدأ تجربتك المجانية',
      whatsapp: 'تواصل معنا عبر واتساب',
      successMsg: 'تم التسجيل بنجاح! بنتواصل معك قريباً',
      errorMsg: 'يرجى تعبئة جميع الحقول',
    },
    stats: [
      { value: '٥–٢٥x', label: 'تكلفة اكتساب العميل الجديد مقارنة بالاحتفاظ بالحالي' },
      { value: '+١٨٪', label: 'زيادة في الإنفاق من العملاء المسجّلين ببرامج ولاء' },
      { value: '٦٠–٧٠٪', label: 'احتمال الشراء من عميل حالي، مقابل ٥–٢٠٪ من عميل جديد' },
      { value: '٤.٨x', label: 'إنفاق أعلى من العملاء اللي يحسّون بارتباط عاطفي بالعلامة' },
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
        { label: 'ارتفاع الإيرادات', value: '١٤.٢ك ر.س', change: '+٢٢%' },
        { label: 'زيارات متكررة', value: '٦٧%', change: '+٨%' },
        { label: 'مكافآت مرسلة', value: '٣,٨٩١', change: '+٣٤%' },
        { label: 'عملاء نشطين', value: '١,٢٤٧', change: '+١٢%' },
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
        { icon: 'users', value: '١,٢٤٧', label: 'عميل نشط', trend: '+١٢٪' },
        { icon: 'repeat', value: '٦٧٪', label: 'زيارات متكررة', trend: '+٨٪' },
        { icon: 'gift', value: '٣,٨٩١', label: 'مكافأة مرسلة', trend: '+٣٤٪' },
        { icon: 'sar', value: '١٤.٢ك', label: 'إيرادات إضافية', trend: '+٢٢٪' },
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
        { value: '+٤٧٧', label: 'محل مسجّل', desc: 'تجار اختاروا وايا لإدارة ولاء عملائهم' },
        { value: '+٣٢٪', label: 'زيادة في الزيارات المتكررة', desc: 'عملاء يرجعون أكثر بعد تفعيل البرنامج' },
        { value: '+١٨٪', label: 'ارتفاع في متوسط الفاتورة', desc: 'إنفاق أعلى من العملاء المكافَئين' },
      ],
    },
    pricing: {
      badge: 'الأسعار',
      title: 'سعر واضح. بدون مفاجآت. وعائد تحسبه.',
      monthly: {
        label: 'الخطة الشهرية',
        price: '٧٥',
        unit: 'ر.س / شهر',
        note: 'بدون التزام — الغي بأي وقت',
      },
      annual: {
        label: 'الخطة السنوية',
        badge: 'الأكثر توفيراً',
        price: '٥٥',
        unit: 'ر.س / شهر',
        note: 'يُفوتر ١،٤٢٨ ر.س سنوياً — توفير ٣٥٨ ر.س',
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
    footer: {
      copy: '٢٠٢٦ وايا.',
      links: { privacy: 'الخصوصية', terms: 'الشروط' },
      contact: 'تواصل معنا',
      email: 'hello@trywaya.com',
      whatsapp: 'واتساب',
    },
  },
  en: {
    nav: { cta: 'Start Free', pricing: 'Pricing', features: 'Features', how: 'How It Works', login: 'Log In', signup: 'Sign Up', logout: 'Log Out', hi: 'Hi' },
    auth: {
      loginTitle: 'Log In', loginSub: 'Sign in to manage your loyalty program',
      signupTitle: 'Create Account', signupSub: 'Sign up and start your free trial',
      email: 'Email', password: 'Password', name: 'Full name',
      emailPh: 'name@example.com', passwordPh: 'Enter your password', namePh: 'e.g. Ahmed Ali',
      loginBtn: 'Log In', signupBtn: 'Create My Account', googleBtn: 'Continue with Google', googleSignup: 'Sign up with Google',
      or: 'or', forgot: 'Forgot password?', back: 'Home',
      noAccount: "Don't have an account?", hasAccount: 'Already have an account?', goSignup: 'Sign up', goLogin: 'Log in',
      errInvalid: 'Invalid email or password', errEmpty: 'Please enter email and password',
      errName: 'Enter your name', errEmail: 'Enter a valid email', errPassword: 'Password must be at least 6 characters',
      logging: 'Logging in...', signing: 'Creating account...',
      successTitle: 'Account created!', successMsg: 'Check your email and confirm your account to get started.',
      errEmailFirst: 'Enter your email first', resetSent: 'Password reset link sent to your email',
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
      navHome: 'Home', navData: 'Analytics', navLoyalty: 'Loyalty Program', navCards: 'Loyalty Cards', navSettings: 'Settings',
      visitSite: 'Visit Website',
      demoBanner: "This is a demo view — we'll contact you soon to activate your account. Meanwhile, explore the dashboard!",
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
      title1: 'A returning customer',
      title2: 'is worth more than ten new ones',
      subtitle: 'Waya turns a single visit into a lasting relationship. A ready-made loyalty program that works from day one — no extra device, no complexity, and no tech team needed.',
      freeTrial: 'First 2 weeks free — no commitment at all — try it yourself',
      inputPlaceholder: 'Your email or phone number',
      storeNamePlaceholder: 'Your store name',
      industryPlaceholder: 'Industry',
      industries: ['Restaurant', 'Café', 'Salon', 'Laundry', 'Bakery', 'Grocery', 'Clothing', 'Other'],
      btn: 'Start Your Free Trial',
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
      monthly: {
        label: 'Monthly Plan',
        price: '75',
        unit: 'SAR / month',
        note: 'No commitment — cancel anytime',
      },
      annual: {
        label: 'Annual Plan',
        badge: 'Best Value',
        price: '55',
        unit: 'SAR / month',
        note: 'Billed 1,428 SAR/year — save 358 SAR',
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
    footer: {
      copy: '2026 Waya.',
      links: { privacy: 'Privacy', terms: 'Terms' },
      contact: 'Contact Us',
      email: 'hello@trywaya.com',
      whatsapp: 'WhatsApp',
    },
  },
}

/* ─── Reusable scroll-reveal wrapper ─── */
function Reveal({ children, delay = 0, direction = 'up', className = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 60 : direction === 'down' ? -60 : 0,
      x: direction === 'right' ? -60 : direction === 'left' ? 60 : 0,
      scale: 0.97,
    },
    visible: {
      opacity: 1, y: 0, x: 0, scale: 1,
      transition: { duration: 0.9, delay, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  }

  return (
    <motion.div ref={ref} className={className} initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={variants}>
      {children}
    </motion.div>
  )
}

/* ─── Logo ─── */
function Logo({ size = 34 }) {
  return <img src="/waya-logo.png" alt="وايا" style={{ width: size, height: 'auto' }} />
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
        <button onClick={async () => { await signOut(); navigate('/'); closeMenu() }} className="mobile-drawer-cta">{t.nav.logout}</button>
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
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="nav-pill">
        <div className="nav-logo">
          <Logo size={52} />
        </div>
        <div className="nav-links">
          <a href="#how">{t.nav.how}</a>
          <a href="#features">{t.nav.features}</a>
          <a href="#pricing">{t.nav.pricing}</a>
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
            <a href="#how" onClick={closeMenu}>{t.nav.how}</a>
            <a href="#features" onClick={closeMenu}>{t.nav.features}</a>
            <a href="#pricing" onClick={closeMenu}>{t.nav.pricing}</a>
            <MobileAuthButtons t={t} closeMenu={closeMenu} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

/* ─── Signup Form (shared between Hero and CTA) ─── */
function SignupForm({ t, id }) {
  const [contact, setContact] = useState('')
  const [storeName, setStoreName] = useState('')
  const [industry, setIndustry] = useState('')
  const [status, setStatus] = useState(null) // null | 'sending' | 'success' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!contact.trim() || !storeName.trim() || !industry) {
      setStatus('error')
      setTimeout(() => setStatus(null), 3000)
      return
    }
    setStatus('sending')
    const ok = await submitLead({ contact: contact.trim(), store_name: storeName.trim(), industry })
    if (ok) {
      setStatus('success')
      setContact('')
      setStoreName('')
      setIndustry('')
    } else {
      setStatus('error')
      setTimeout(() => setStatus(null), 3000)
    }
  }

  return (
    <form className="hero-form" id={id} onSubmit={handleSubmit}>
      <div className="hero-input-wrap">
        <input type="text" placeholder={t.hero.inputPlaceholder} className="hero-input" value={contact} onChange={(e) => setContact(e.target.value)} />
      </div>
      <div className="hero-input-wrap">
        <input type="text" placeholder={t.hero.storeNamePlaceholder} className="hero-input" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
      </div>
      <div className="hero-input-wrap">
        <select className="hero-input hero-select" value={industry} onChange={(e) => setIndustry(e.target.value)}>
          <option value="" disabled>{t.hero.industryPlaceholder}</option>
          {t.hero.industries.map((ind, i) => (
            <option key={i} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {status === 'success' ? (
        <motion.div className="form-success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M16.5 5.5L7.5 14.5L3.5 10.5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>{t.hero.successMsg}</span>
        </motion.div>
      ) : (
        <>
          <button type="submit" className="hero-btn" disabled={status === 'sending'}>
            {status === 'sending' ? '...' : t.hero.btn}
          </button>
          {status === 'error' && (
            <motion.p className="form-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{t.hero.errorMsg}</motion.p>
          )}
        </>
      )}

      <a href="https://wa.me/966509076104" target="_blank" rel="noopener noreferrer" className="hero-whatsapp-btn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        <span>{t.hero.whatsapp}</span>
      </a>
    </form>
  )
}

/* ─── Hero ─── */
function Hero({ t }) {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 0.3], [0, -60])
  const opacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])

  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="hero-glow-2" />

      <motion.div className="hero-inner" style={{ y, opacity }}>
        <Reveal delay={0.2} direction="right" className="hero-image-side">
          <div className="hero-image-container">
            <motion.img
              src="/hero.png"
              alt="وايا"
              className="hero-image"
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
            <motion.div className="floating-bubble floating-bubble-1" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <img src="/icon-monitoring.svg" alt="" width="24" height="24" />
            </motion.div>
            <motion.div className="floating-bubble floating-bubble-2" animate={{ y: [0, 8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
              <img src="/icon-favorite.svg" alt="" width="24" height="24" />
            </motion.div>
            <motion.div className="floating-bubble floating-bubble-3" animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
              <img src="/icon-leaderboard.svg" alt="" width="24" height="24" />
            </motion.div>
          </div>
        </Reveal>

        <div className="hero-text-side">
          <Reveal>
            <h1 className="hero-title">
              <span className="text-cream">{t.hero.title1} </span>
              <span className="text-green">{t.hero.title2}</span>
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="hero-subtitle">{t.hero.subtitle}</p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="hero-free-badge">{t.hero.freeTrial}</div>
          </Reveal>
          <Reveal delay={0.3}>
            <SignupForm t={t} id="hero-signup" />
          </Reveal>
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
          <Reveal key={i} delay={i * 0.1}>
            <div className="stats-bar-item">
              <span className="stats-bar-value">{stat.value}</span>
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
          <Reveal key={i} delay={i * 0.12}>
            <motion.div className="step-card" whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(16,185,129,0.06)' }} transition={{ duration: 0.3 }}>
              <div className="step-icon">{stepIcons[i]}</div>
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
            <motion.div className="feature-card" whileHover={{ y: -6 }} transition={{ duration: 0.3 }}>
              <div className="feature-icon">{featureIcons[feat.icon]}</div>
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
          <Reveal key={i} delay={i * 0.1}>
            <motion.div
              className="audience-card"
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ duration: 0.3 }}
            >
              <div className="audience-icon-wrap">
                {audienceIcons[iconKeys[i]]}
              </div>
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

  return (
    <section className="section wallet-section">
      <Reveal>
        <h2 className="section-title">{t.walletCards.title}</h2>
        <p className="section-subtitle">{t.walletCards.subtitle}</p>
      </Reveal>

      <div className="wallet-cards-row">
        {cards.map((card, i) => (
          <Reveal key={i} delay={i * 0.15}>
            <motion.div
              className="wallet-card-wrap"
              whileHover={{ y: -12, rotateY: 5, scale: 1.03 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <img src={card.src} alt={card.alt} className="wallet-card-img" />
            </motion.div>
          </Reveal>
        ))}
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
  const wayaCost = 75
  const netProfit = extraRevenue - wayaCost
  const roiMultiple = (extraRevenue / wayaCost).toFixed(1)

  const fmt = (n) => {
    if (lang === 'ar') {
      return n.toLocaleString('ar-SA')
    }
    return n.toLocaleString('en-US')
  }

  return (
    <section className="section calculator-section" id="calculator">
      <Reveal>
        <div className="section-badge">{t.calculator.badge}</div>
        <h2 className="section-title">{t.calculator.title}</h2>
        <p className="section-subtitle">{t.calculator.subtitle}</p>
      </Reveal>

      <Reveal delay={0.15}>
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
                <span className="calc-slider-value">{fmt(avgOrder)} {t.calculator.currency}</span>
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
                  <span className="calc-unit">{t.calculator.currency} {t.calculator.perMonth}</span>
                </div>
                <div className="calc-detail">
                  <span>{t.calculator.repeatVisits}</span>
                  <span>{Math.round(repeatRate * 100)}%</span>
                </div>
                <div className="calc-detail">
                  <span>{t.calculator.avgTicket}</span>
                  <span>{fmt(avgOrder)} {t.calculator.currency}</span>
                </div>
              </div>

              <div className="calc-vs">VS</div>

              <div className="calc-col calc-col-with" style={{ background: 'var(--calc-with-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--green)', boxShadow: '0 0 30px var(--green-glow)' }}>
                <h4>{t.calculator.withTitle}</h4>
                <div className="calc-big-number calc-big-green">
                  <span className="calc-amount">{fmt(Math.round(totalWith))}</span>
                  <span className="calc-unit">{t.calculator.currency} {t.calculator.perMonth}</span>
                </div>
                <div className="calc-detail">
                  <span>{t.calculator.repeatVisits}</span>
                  <span className="calc-highlight">{Math.round(wayaRepeatRate * 100)}%</span>
                </div>
                <div className="calc-detail">
                  <span>{t.calculator.avgTicket}</span>
                  <span className="calc-highlight">{fmt(Math.round(wayaAvgOrder))} {t.calculator.currency}</span>
                </div>
              </div>
            </div>

            {/* Bottom summary bar */}
            <div className="calc-summary">
              <div className="calc-summary-item">
                <span className="calc-summary-label">{t.calculator.extraRevenue}</span>
                <span className="calc-summary-value calc-green">+{fmt(extraRevenue)} {t.calculator.currency}</span>
              </div>
              <div className="calc-summary-divider" />
              <div className="calc-summary-item">
                <span className="calc-summary-label">{t.calculator.wayaCost}</span>
                <span className="calc-summary-value">-{fmt(wayaCost)} {t.calculator.currency}</span>
              </div>
              <div className="calc-summary-divider" />
              <div className="calc-summary-item">
                <span className="calc-summary-label">{t.calculator.netProfit}</span>
                <span className="calc-summary-value calc-green-big">+{fmt(netProfit)} {t.calculator.currency}</span>
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
          <Reveal key={i} delay={i * 0.15}>
            <motion.div className="social-proof-card" whileHover={{ y: -6 }} transition={{ duration: 0.3 }}>
              <span className="social-proof-value">{item.value}</span>
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
function Pricing({ t }) {
  const [annual, setAnnual] = useState(false)

  return (
    <section className="section" id="pricing">
      <Reveal>
        <div className="section-badge">{t.pricing.badge}</div>
        <h2 className="section-title">{t.pricing.title}</h2>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="pricing-cards">
          <motion.div className={`pricing-card ${!annual ? 'pricing-active' : ''}`} onClick={() => setAnnual(false)} whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
            <span className="pricing-plan-label">{t.pricing.monthly.label}</span>
            <div className="pricing-amount">
              <span className="price">{t.pricing.monthly.price}</span>
              <span className="price-label">{t.pricing.monthly.unit}</span>
            </div>
            <p className="price-note">{t.pricing.monthly.note}</p>
            <ul className="pricing-features">
              {t.pricing.features.map((f, i) => (
                <li key={i}><CheckIcon color="#10B981" /> <span>{f}</span></li>
              ))}
            </ul>
            <a href="#cta" className="pricing-cta-link">
              <motion.button className="pricing-cta" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {t.pricing.cta}
              </motion.button>
            </a>
          </motion.div>

          <motion.div className={`pricing-card ${annual ? 'pricing-active' : ''}`} onClick={() => setAnnual(true)} whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
            <div className="pricing-plan-label-row">
              <span className="pricing-plan-label">{t.pricing.annual.label}</span>
              <span className="save-badge">{t.pricing.annual.badge}</span>
            </div>
            <div className="pricing-amount">
              <span className="price">{t.pricing.annual.price}</span>
              <span className="price-label">{t.pricing.annual.unit}</span>
            </div>
            <p className="price-note">{t.pricing.annual.note}</p>
            <ul className="pricing-features">
              {t.pricing.features.map((f, i) => (
                <li key={i}><CheckIcon color="#10B981" /> <span>{f}</span></li>
              ))}
            </ul>
            <a href="#cta" className="pricing-cta-link">
              <motion.button className="pricing-cta" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {t.pricing.cta}
              </motion.button>
            </a>
          </motion.div>
        </div>
      </Reveal>
    </section>
  )
}

/* ─── CTA ─── */
function CTA({ t }) {
  return (
    <section className="cta-section" id="cta">
      <div className="cta-glow" />
      <Reveal>
        <h2 className="cta-title">{t.cta.title}</h2>
      </Reveal>
      <Reveal delay={0.15}>
        <p className="cta-subtitle">{t.cta.subtitle}</p>
      </Reveal>
      <Reveal delay={0.2}>
        <div className="hero-free-badge" style={{ marginBottom: 16 }}>{t.hero.freeTrial}</div>
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
function Footer({ t }) {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <Logo size={44} />
        </div>

        <div className="footer-center">
          <div className="footer-links">
            <a href="/privacy">{t.footer.links.privacy}</a>
            <a href="/terms">{t.footer.links.terms}</a>
          </div>
          <div className="footer-contact">
            <a href="https://wa.me/966509076104" target="_blank" rel="noopener noreferrer" className="footer-contact-link">
              <WhatsAppIconSmall />
              <span>{t.footer.whatsapp}</span>
            </a>
            <a href="mailto:hello@trywaya.com" className="footer-contact-link">
              <EmailIcon />
              <span>{t.footer.email}</span>
            </a>
          </div>
        </div>

        <p className="footer-copy">{t.footer.copy}</p>
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
        <h1 className="legal-title">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>
        <p className="legal-date">{isAr ? 'آخر تحديث: أبريل ٢٠٢٦' : 'Last updated: April 2026'}</p>

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
      <Footer t={t} />
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
        <h1 className="legal-title">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</h1>
        <p className="legal-date">{isAr ? 'آخر تحديث: أبريل ٢٠٢٦' : 'Last updated: April 2026'}</p>

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
          ? 'الخطة الشهرية بسعر ٧٥ ر.س/شهر والخطة السنوية بسعر ٥٥ ر.س/شهر (تُفوتر سنوياً). أول أسبوعين مجاناً. يمكنك إلغاء اشتراكك في أي وقت. بعد الإلغاء، ستستمر الخدمة حتى نهاية فترة الفوترة الحالية.'
          : 'The monthly plan is 75 SAR/month and the annual plan is 55 SAR/month (billed annually). First 2 weeks are free. You can cancel your subscription at any time. After cancellation, the service continues until the end of the current billing period.'
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
      <Footer t={t} />
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

/* ─── Login Page ─── */
function LoginPage({ t, lang, setLang, theme, setTheme }) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const a = t.auth

  useEffect(() => {
    if (!user) return
    supabase.from('shops').select('id').eq('user_id', user.id).single()
      .then(({ data }) => navigate(data ? '/dashboard' : '/setup'))
  }, [user])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) { setError(a.errEmpty); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (err) { setError(a.errInvalid); setLoading(false) }
  }

  const handleGoogle = async () => {
    setError('')
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  const handleForgot = async () => {
    if (!email.trim()) { setError(a.errEmailFirst); return }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/login' })
    if (!err) { setError(''); alert(a.resetSent) } else setError(err.message)
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
        <div className="auth-brand"><Logo size={56} /></div>
        <h1 className="auth-title">{a.loginTitle}</h1>
        <p className="auth-subtitle">{a.loginSub}</p>

        <button onClick={handleGoogle} className="auth-google-btn">
          <GoogleIcon /><span>{a.googleBtn}</span>
        </button>

        <div className="auth-divider"><span>{a.or}</span></div>

        <form onSubmit={handleLogin} className="auth-form">
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
          <button type="button" onClick={handleForgot} className="auth-forgot">{a.forgot}</button>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? a.logging : a.loginBtn}
          </button>
        </form>

        <p className="auth-switch">{a.noAccount} <button onClick={() => navigate('/signup')}>{a.goSignup}</button></p>
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
    supabase.from('shops').select('id').eq('user_id', user.id).single()
      .then(({ data }) => navigate(data ? '/dashboard' : '/setup'))
  }, [user])

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
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  if (success) {
    return (
      <div className="auth-page">
        <motion.div className="auth-card" style={{ textAlign: 'center' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h1 className="auth-title">{a.successTitle}</h1>
          <p className="auth-subtitle">{a.successMsg}</p>
          <button onClick={() => navigate('/login')} className="auth-submit-btn" style={{ marginTop: 24 }}>{a.goLogin}</button>
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
        <div className="auth-brand"><Logo size={56} /></div>
        <h1 className="auth-title">{a.signupTitle}</h1>
        <p className="auth-subtitle">{a.signupSub}</p>

        <button onClick={handleGoogle} className="auth-google-btn">
          <GoogleIcon /><span>{a.googleSignup}</span>
        </button>

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
  activity: [
    { id: 1, name: 'أحمد محمد', action: 'scan', points: 3, time: '2 min' },
    { id: 2, name: 'سارة علي', action: 'reward', points: 10, time: '15 min' },
    { id: 3, name: 'خالد عبدالله', action: 'scan', points: 3, time: '32 min' },
    { id: 4, name: 'نورة سعود', action: 'scan', points: 3, time: '1 hr' },
    { id: 5, name: 'فهد ناصر', action: 'reward', points: 10, time: '2 hr' },
    { id: 6, name: 'ريم خالد', action: 'scan', points: 3, time: '3 hr' },
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
        <div className="auth-brand"><Logo size={48} /></div>
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

/* ─── Loyalty Tab with Google Wallet + Apple Wallet ─── */
function LoyaltyTab({ t, lang, shop, user }) {
  const [walletUrl, setWalletUrl] = useState(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState(null)
  const [appleLoading, setAppleLoading] = useState(false)
  const [appleError, setAppleError] = useState(null)
  const [copied, setCopied] = useState(false)

  // Editable settings
  const [pointsPerVisit, setPointsPerVisit] = useState(shop.points_per_visit || 1)
  const [rewardThreshold, setRewardThreshold] = useState(shop.reward_threshold || 10)
  const [rewardDesc, setRewardDesc] = useState(shop.reward_description || '')
  const [cardColor, setCardColor] = useState(shop.card_color || '#10B981')
  const [logoUrl, setLogoUrl] = useState(shop.logo_url || null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [generated, setGenerated] = useState(false)

  const colorPresets = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#1a1a2e', '#6366F1', '#D97706']
  const walletLink = `https://www.trywaya.com/wallet/${shop.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(walletLink)}&color=${cardColor.replace('#', '')}&bgcolor=ffffff&margin=10`

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 1024 * 1024) { alert(lang === 'ar' ? 'الحجم أكبر من 1MB' : 'File too large (max 1MB)'); return }
    if (!file.type.startsWith('image/')) return

    setLogoUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${shop.id}/logo.${ext}`

    const { error: uploadErr } = await supabase.storage.from('shop-logos').upload(path, file, { upsert: true })
    if (uploadErr) { console.error(uploadErr); setLogoUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(path)
    setLogoUrl(publicUrl)
    await supabase.from('shops').update({ logo_url: publicUrl }).eq('id', shop.id)
    shop.logo_url = publicUrl
    setLogoUploading(false)
  }

  const handleSaveAndGenerate = async () => {
    setSaving(true)
    setSaveStatus(null)
    const { error } = await supabase.from('shops').update({
      points_per_visit: pointsPerVisit,
      reward_threshold: rewardThreshold,
      reward_description: rewardDesc,
      card_color: cardColor,
    }).eq('id', shop.id)

    if (!error) {
      shop.points_per_visit = pointsPerVisit
      shop.reward_threshold = rewardThreshold
      shop.reward_description = rewardDesc
      shop.card_color = cardColor
      setSaveStatus('saved')
      setGenerated(true)
      setTimeout(() => setSaveStatus(null), 2000)
    }
    setSaving(false)
  }

  const generateTestPass = async () => {
    setWalletLoading(true)
    setWalletError(null)
    setWalletUrl(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/google-wallet-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_id: shop.id, customer_name: user?.email?.split('@')[0] || 'Test', customer_phone: '0500000000' }),
      })
      const data = await res.json()
      if (data.success) { setWalletUrl(data.saveUrl) }
      else { setWalletError(data.error || t.loyaltyPage.walletError) }
    } catch (err) { setWalletError(err.message) }
    setWalletLoading(false)
  }

  const generateAppleTestPass = async () => {
    setAppleLoading(true)
    setAppleError(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/apple-wallet-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_id: shop.id, customer_name: user?.email?.split('@')[0] || 'Test', customer_phone: '0500000000' }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Failed to generate Apple Wallet pass')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${shop.name.replace(/[^\w]/g, '_')}.pkpass`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setAppleError(err.message)
    }
    setAppleLoading(false)
  }

  const copyCustomerLink = () => {
    navigator.clipboard.writeText(walletLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPDF = () => {
    const rewardText = rewardDesc || `Collect ${rewardThreshold} points for a reward`
    const rewardTextAr = rewardDesc || `اجمع ${rewardThreshold} نقطة واحصل على مكافأة`
    const logoImg = logoUrl ? `<img src="${logoUrl}" style="width:80px;height:80px;border-radius:20px;object-fit:cover;margin-bottom:12px;" crossorigin="anonymous"/>` : ''

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${shop.name} - Loyalty Card</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700;800&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans Arabic',sans-serif;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:40px}
.poster{width:600px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,0.08)}
.poster-header{background:${cardColor};padding:48px 40px 40px;text-align:center;color:#fff;position:relative;overflow:hidden}
.poster-header::after{content:'';position:absolute;top:-60%;right:-15%;width:250px;height:250px;border-radius:50%;background:rgba(255,255,255,0.08)}
.poster-logo{position:relative;z-index:1}
.poster-name{font-size:2rem;font-weight:800;margin-top:8px;position:relative;z-index:1}
.poster-issuer{font-size:0.9rem;opacity:0.8;margin-top:4px;position:relative;z-index:1}
.poster-body{padding:40px}
.poster-qr{text-align:center;margin-bottom:32px}
.poster-qr img{width:240px;height:240px;border-radius:12px;border:3px solid ${cardColor}20}
.poster-instructions{display:flex;flex-direction:column;gap:24px}
.poster-lang{text-align:center}
.poster-lang h3{font-size:1.1rem;color:#333;margin-bottom:8px}
.poster-steps{list-style:none;display:flex;justify-content:center;gap:16px;margin-top:12px}
.poster-step{display:flex;flex-direction:column;align-items:center;gap:6px;width:120px;text-align:center}
.poster-step-num{width:32px;height:32px;border-radius:50%;background:${cardColor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem}
.poster-step-text{font-size:0.8rem;color:#666;line-height:1.4}
.poster-reward{text-align:center;margin-top:24px;padding:16px 20px;background:${cardColor}10;border-radius:14px;border:1.5px solid ${cardColor}25}
.poster-reward p{color:${cardColor};font-weight:700;font-size:1rem}
.poster-divider{width:60%;margin:24px auto;border:none;border-top:1px solid #eee}
.poster-footer{text-align:center;padding:0 40px 32px;color:#aaa;font-size:0.75rem}
.poster-footer span{color:${cardColor};font-weight:600}
.ar{direction:rtl;font-family:'Noto Sans Arabic','Inter',sans-serif}
@media print{body{background:#fff;padding:0}.poster{box-shadow:none;width:100%;border-radius:0}}
</style></head><body>
<div class="poster">
  <div class="poster-header">
    <div class="poster-logo">${logoImg}</div>
    <div class="poster-name">${shop.name}</div>
    <div class="poster-issuer">Loyalty Program | برنامج الولاء</div>
  </div>
  <div class="poster-body">
    <div class="poster-qr"><img src="${qrUrl}" alt="QR Code"/></div>

    <div class="poster-instructions">
      <div class="poster-lang ar">
        <h3>امسح الكود وأضف بطاقة الولاء</h3>
        <ol class="poster-steps">
          <li class="poster-step"><div class="poster-step-num">١</div><div class="poster-step-text">امسح الكود بكاميرا جوالك</div></li>
          <li class="poster-step"><div class="poster-step-num">٢</div><div class="poster-step-text">أدخل اسمك ورقم جوالك</div></li>
          <li class="poster-step"><div class="poster-step-num">٣</div><div class="poster-step-text">أضف البطاقة لمحفظة قوقل</div></li>
        </ol>
      </div>

      <hr class="poster-divider"/>

      <div class="poster-lang">
        <h3>Scan & Add Your Loyalty Card</h3>
        <ol class="poster-steps">
          <li class="poster-step"><div class="poster-step-num">1</div><div class="poster-step-text">Scan the QR code with your phone</div></li>
          <li class="poster-step"><div class="poster-step-num">2</div><div class="poster-step-text">Enter your name & phone number</div></li>
          <li class="poster-step"><div class="poster-step-num">3</div><div class="poster-step-text">Add card to Google Wallet</div></li>
        </ol>
      </div>
    </div>

    <div class="poster-reward">
      <p class="ar">${rewardTextAr}</p>
      <p style="margin-top:4px;font-size:0.85rem;color:#666">${rewardText}</p>
    </div>
  </div>
  <div class="poster-footer">Powered by <span>Waya</span> — trywaya.com</div>
</div>
<script>setTimeout(()=>window.print(),500)<\/script>
</body></html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <>
      <h1 className="dash-title">{t.loyaltyPage.title}</h1>

      {/* Step 1: Card Design + Preview */}
      <motion.div className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="loyalty-step-header">
          <div className="loyalty-step-num">1</div>
          <h2>{t.loyaltyPage.cardDesign}</h2>
        </div>

        {/* Live Preview */}
        <div className="card-preview-wrap">
          <div className="card-preview" style={{ background: cardColor }}>
            <div className="card-preview-top">
              {logoUrl ? <img src={logoUrl} alt="" className="card-preview-logo" /> : <div className="card-preview-logo-ph"><Logo size={20} /></div>}
              <div className="card-preview-info">
                <div className="card-preview-name">{shop.name}</div>
                <div className="card-preview-issuer">Waya</div>
              </div>
            </div>
            <div className="card-preview-points">
              <div className="card-preview-pts-value">0</div>
              <div className="card-preview-pts-label">Points</div>
            </div>
            <div className="card-preview-reward">{rewardDesc || (lang === 'ar' ? `اجمع ${rewardThreshold} نقاط واحصل على مكافأة` : `Collect ${rewardThreshold} points for a reward`)}</div>
          </div>
        </div>

        <div className="auth-form" style={{ gap: 18, marginTop: 20 }}>
          {/* Logo Upload */}
          <div className="auth-field">
            <label>{t.loyaltyPage.cardLogo}</label>
            <div className="logo-upload-row">
              {logoUrl ? <img src={logoUrl} alt="" className="logo-upload-preview" /> : <div className="logo-upload-placeholder"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>}
              <div>
                <label className="logo-upload-btn">
                  {logoUploading ? '...' : t.loyaltyPage.cardLogoUpload}
                  <input type="file" accept="image/png,image/jpeg" onChange={handleLogoUpload} hidden disabled={logoUploading} />
                </label>
                <p className="logo-upload-hint">{t.loyaltyPage.cardLogoHint}</p>
              </div>
            </div>
          </div>

          {/* Color Picker */}
          <div className="auth-field">
            <label>{t.loyaltyPage.cardColor}</label>
            <div className="color-picker-row">
              {colorPresets.map(c => (
                <button key={c} className={`color-swatch ${cardColor === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setCardColor(c)} />
              ))}
              <label className="color-custom">
                <input type="color" value={cardColor} onChange={e => setCardColor(e.target.value)} />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </label>
            </div>
          </div>

          {/* Reward Settings inline */}
          <div className="setup-row">
            <div className="auth-field"><label>{t.loyaltyPage.pointsPerVisit}</label><input type="number" value={pointsPerVisit} onChange={e => setPointsPerVisit(Number(e.target.value))} /></div>
            <div className="auth-field"><label>{t.loyaltyPage.rewardAt}</label><div className="setup-reward-input"><input type="number" value={rewardThreshold} onChange={e => setRewardThreshold(Number(e.target.value))} /><span>{t.loyaltyPage.points}</span></div></div>
          </div>
          <div className="auth-field"><label>{t.loyaltyPage.rewardDesc}</label><input type="text" value={rewardDesc} onChange={e => setRewardDesc(e.target.value)} placeholder={t.loyaltyPage.rewardDescPh} /></div>

          <button className="auth-submit-btn loyalty-generate-btn" onClick={handleSaveAndGenerate} disabled={saving}>
            {saving ? t.loyaltyPage.saving : saveStatus === 'saved' ? t.loyaltyPage.saved : (lang === 'ar' ? 'حفظ وإنشاء الكود' : 'Save & Generate QR Code')}
          </button>
        </div>
      </motion.div>

      {/* Step 2: QR Code + Download (appears after generating) */}
      {generated && (
        <motion.div className="dash-card wallet-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="loyalty-step-header">
            <div className="loyalty-step-num">2</div>
            <h2>{lang === 'ar' ? 'كود العملاء' : 'Customer QR Code'}</h2>
          </div>

          {/* QR Code */}
          <div className="wallet-qr-section">
            <div className="wallet-qr-wrapper">
              <img src={qrUrl} alt="QR Code" className="wallet-qr-img" />
            </div>
            <p className="wallet-qr-hint">{lang === 'ar' ? 'العميل يمسح الكود ← يدخل بياناته ← يضيف البطاقة لمحفظة قوقل' : 'Customer scans → enters info → adds card to Google Wallet'}</p>
          </div>

          {/* Action buttons */}
          <div className="wallet-actions">
            <button className="wallet-download-btn" onClick={downloadPDF}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {lang === 'ar' ? 'تحميل ملصق للطباعة' : 'Download Printable Poster'}
            </button>

            <button className="wallet-test-btn" onClick={generateTestPass} disabled={walletLoading}>
              <GoogleWalletIcon />
              {walletLoading ? t.loyaltyPage.walletGenerating : (lang === 'ar' ? 'جرّب بنفسك' : 'Try it Yourself')}
            </button>

            <button
              className="wallet-test-btn wallet-test-btn-apple"
              onClick={generateAppleTestPass}
              disabled={appleLoading}
              style={{ background: '#000', color: '#fff' }}
            >
              <AppleWalletIcon />
              {appleLoading
                ? (lang === 'ar' ? 'جاري الإنشاء...' : 'Generating...')
                : (lang === 'ar' ? 'بطاقة Apple Wallet' : 'Try Apple Wallet')}
            </button>
          </div>

          {walletUrl && (
            <motion.div className="wallet-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <a href={walletUrl} target="_blank" rel="noopener noreferrer" className="wallet-add-btn">
                <img src="https://developers.google.com/static/wallet/images/web/en_add_to_google_wallet_wallet-button.png" alt="Add to Google Wallet" style={{ height: 48 }} />
              </a>
            </motion.div>
          )}

          {walletError && <div className="wallet-error">{walletError}</div>}
          {appleError && <div className="wallet-error">{appleError}</div>}

          {/* Share link */}
          <div className="wallet-customer-link">
            <label>{t.loyaltyPage.walletCustomerLink}</label>
            <div className="wallet-link-row">
              <input type="text" readOnly value={`trywaya.com/wallet/${shop.id}`} className="wallet-link-input" dir="ltr" />
              <button className="wallet-copy-btn" onClick={copyCustomerLink}>
                {copied ? t.loyaltyPage.walletCopied : t.loyaltyPage.walletCopyLink}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
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

  if (loading) return <div className="auth-page"><div className="dash-loading"><Logo size={40} /></div></div>
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
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05XXXXXXXX" dir="ltr" required />
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

function DashboardPage({ t, lang, setLang, theme, setTheme }) {
  const { user, signOut } = useAuth()
  const d = t.dashboard
  const [shop, setShop] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [loadingShop, setLoadingShop] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('shops').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (!data) { navigate('/setup'); return }
        setShop(data)
        setLoadingShop(false)
      })
  }, [user])

  if (loadingShop) return <div className="auth-page"><div className="dash-loading"><Logo size={40} /></div></div>
  if (!shop) return null

  const handleLogout = async () => { await signOut(); navigate('/') }
  const shopName = shop.name || 'متجرك'

  const menuItems = [
    { id: 'home', label: d.navHome, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg> },
    { id: 'data', label: d.navData, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { id: 'loyalty', label: d.navLoyalty, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> },
    { id: 'cards', label: d.navCards, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h4"/></svg> },
    { id: 'notifications', label: lang === 'ar' ? 'الإشعارات' : 'Notifications', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> },
    { id: 'settings', label: d.navSettings, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
  ]

  const statIcons = [
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5"><path d="M23 6l-9.5 9.5-5-5L1 18"/></svg>,
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  ]

  const chev = <svg className="sidebar-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>

  return (
    <div className={`dash-page has-sidebar ${lang === 'en' ? 'ltr-mode' : ''}`}>
      {/* Persistent Sidebar (LoyaPro-style) */}
      <aside className="sidebar sidebar-persistent">
        <div className="sidebar-header">
          <div className="sidebar-brand"><Logo size={36} /><span className="sidebar-brand-name">Waya</span></div>
        </div>
        <div className="sidebar-shop-block">
          {shop.logo_url ? <img src={shop.logo_url} alt="" className="sidebar-logo" /> : <div className="sidebar-logo-ph"><Logo size={20} /></div>}
          <div className="sidebar-shop-info"><div className="sidebar-shop-name">{shopName}</div><div className="sidebar-shop-type">{shop.type}</div></div>
        </div>
        <div className="sidebar-menu">
          {menuItems.map(item => (
            <button key={item.id} className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
              {chev}
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
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

      {/* Top nav */}
      <nav className="dash-nav">
        <div className="dash-nav-left">
          <div className="dash-nav-brand"><Logo size={40} /></div>
        </div>
        <div className="dash-nav-right">
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="lang-toggle" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <GlobeIcon /><span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </nav>

      {/* Demo banner */}
      <div className="demo-banner">
        <span>{d.demoBanner}</span>
      </div>

      {/* Content */}
      <div className="dash-content">
        {activeTab === 'home' && (
          <>
            <div className="dash-header">
              <h1 className="dash-title">{d.welcome}، {shopName}</h1>
            </div>

            <div className="data-stats-grid">
              {demoData.stats.map((s, i) => (
                <motion.div key={i} className="data-stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <div className="data-stat-icon-wrap">{statIcons[i]}</div>
                  <div className="data-stat-value">{s.value}</div>
                  <div className="data-stat-label">{d.statLabels[s.key]}</div>
                  <div className="data-stat-change">{s.change}</div>
                </motion.div>
              ))}
            </div>

            <motion.section className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2>{d.journey}</h2>
              <div className="dash-journey">
                {[d.step1, d.step2, d.step3, d.step4].map((label, i) => (
                  <div key={i} className="dash-journey-step">
                    <div className="dash-journey-num">{i + 1}</div>
                    <span className="dash-journey-label">{label}</span>
                    {i < 3 && <div className="dash-journey-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d={lang === 'ar' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}/></svg></div>}
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2>{d.activity}</h2>
              <div className="dash-activity-list">
                {demoData.activity.map(a => (
                  <div key={a.id} className="dash-activity-item">
                    <div className="dash-activity-badge">{a.action === 'reward' ? '🎁' : '📱'}</div>
                    <div className="dash-activity-info">
                      <span className="dash-activity-name">{a.name}</span>
                      <span className="dash-activity-action">{a.action === 'reward' ? d.reward : d.scan} · {a.points} {d.pointsEarned}</span>
                    </div>
                    <span className="dash-activity-time">{a.time}</span>
                  </div>
                ))}
              </div>
            </motion.section>

          </>
        )}

        {activeTab === 'notifications' && (
          <>
            <h1 className="dash-title">{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</h1>
            <p className="dash-subtitle" style={{ marginBottom: 16, color: 'var(--muted, #888)' }}>
              {lang === 'ar'
                ? 'أرسل رسالة لكل حاملي بطاقاتك مباشرة على محفظتهم.'
                : 'Broadcast a message straight to every cardholder’s wallet.'}
            </p>
            <Suspense fallback={<LazyFallback />}>
              <NotificationsPanel shopId={shop?.id} lang={lang} />
            </Suspense>
          </>
        )}

        {activeTab === 'data' && (
          <>
            <h1 className="dash-title">{t.dataPage.title}</h1>
            <div className="data-stats-grid">
              {[
                { label: t.dataPage.customers, value: '1,247', icon: '👥', color: '#10B981' },
                { label: t.dataPage.totalScans, value: '8,432', icon: '📱', color: '#3B82F6' },
                { label: t.dataPage.rewardsRedeemed, value: '3,891', icon: '🎁', color: '#F59E0B' },
                { label: t.dataPage.totalPoints, value: '25,296', icon: '⭐', color: '#8B5CF6' },
              ].map((sc, i) => (
                <motion.div key={i} className="data-stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <div className="data-stat-icon" style={{ background: sc.color + '18', color: sc.color }}>{sc.icon}</div>
                  <div className="data-stat-value">{sc.value}</div>
                  <div className="data-stat-label">{sc.label}</div>
                </motion.div>
              ))}
            </div>
            <motion.div className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <div className="dash-empty"><p>{t.dataPage.moreComingSoon}</p></div>
            </motion.div>
          </>
        )}

        {activeTab === 'loyalty' && (
          <LoyaltyTab t={t} lang={lang} shop={shop} user={user} />
        )}

        {activeTab === 'cards' && (
          <Suspense fallback={<LazyFallback />}>
            <ProgramsList shop={shop} lang={lang} />
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
                <p><strong>{t.settingsPage.joined}:</strong> {new Date(user?.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
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
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

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
function LoyaltyPage(props) { return <DashboardPage {...props} /> }
function SettingsPage(props) { return <DashboardPage {...props} /> }

/* ─── Auth Redirect (redirects logged-in users away from landing/login/signup) ─── */
function AuthRedirect() {
  const { user, loading } = useAuth()
  useEffect(() => {
    if (loading || !user) return
    const path = window.location.pathname
    if (path === '/' || path === '/login' || path === '/signup') {
      supabase.from('shops').select('id').eq('user_id', user.id).single()
        .then(({ data }) => navigate(data ? '/dashboard' : '/setup'))
    }
  }, [user, loading])
  return null
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

/* ─── Admin-only events viewer (gated by email allowlist) ─── */
const ADMIN_EMAILS = ['sultanhhaidar@gmail.com']

function AdminEventsPage({ lang, setLang, theme, setTheme }) {
  const { user, loading } = useAuth()
  const [shops, setShops] = useState([])
  const [selectedShopId, setSelectedShopId] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/login'); return }
    if (!ADMIN_EMAILS.includes((user.email || '').toLowerCase())) {
      setErr('Not authorized')
      return
    }
    supabase.from('shops').select('id, name').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { setErr(error.message); return }
        setShops(data || [])
        if (data && data[0]) setSelectedShopId(data[0].id)
      })
  }, [user, loading])

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>Loading…</div>
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
  const [page, setPage] = useState('home')
  const t = content[lang]

  useSmoothScroll()

  // Simple path-based routing
  useEffect(() => {
    const path = window.location.pathname
    const routePath = (p) => {
      if (p === '/privacy') return 'privacy'
      if (p === '/terms') return 'terms'
      if (p === '/login') return 'login'
      if (p === '/signup') return 'signup'
      if (p === '/setup') return 'setup'
      if (p === '/dashboard') return 'dashboard'
      if (p === '/data') return 'data'
      if (p === '/loyalty') return 'loyalty'
      if (p === '/settings') return 'settings'
      if (p === '/admin/events') return 'admin-events'
      if (p === '/programs' || p.startsWith('/programs/')) return 'programs'
      if (p.startsWith('/w/')) return 'enroll'
      if (p.startsWith('/wallet/')) return 'wallet'
      return 'home'
    }
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

  if (page === 'privacy') return <AuthProvider><PrivacyPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'terms') return <AuthProvider><TermsPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'login') return <AuthProvider><LoginPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'signup') return <AuthProvider><SignupPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'setup') return <AuthProvider><SetupPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'dashboard') return <AuthProvider><DashboardPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'data') return <AuthProvider><DataPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'loyalty') return <AuthProvider><LoyaltyPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'settings') return <AuthProvider><SettingsPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'wallet') return <WalletPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />
  if (page === 'enroll') return <Suspense fallback={<LazyFallback />}><WalletEnrollPage lang={lang} /></Suspense>
  if (page === 'programs') return <AuthProvider><ProgramsPageWrapper lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} /></AuthProvider>
  if (page === 'admin-events') return <AuthProvider><AdminEventsPage lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} /></AuthProvider>

  return (
    <AuthProvider>
      <AuthRedirect />
      <div className={`app ${lang === 'en' ? 'ltr-mode' : ''}`}>
        <Navbar lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />
        <Hero t={t} />
        <StatsBar t={t} />
        <HowItWorks t={t} />
        <Audience t={t} />
        <ProductDemo t={t} />
        <Features t={t} />
        <WalletCards t={t} />
        <Comparison t={t} />
        <SocialProof t={t} />
        <Calculator t={t} lang={lang} />
        <Pricing t={t} />
        <CTA t={t} />
        <Footer t={t} />
      </div>
    </AuthProvider>
  )
}
