import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { navigate } from '../App';
import { useSubscription } from '../lib/useSubscription';
import { createCheckout, StreamPayApiError } from '../lib/streampayClient';

// ─── Design tokens (matched to Home.tsx's `C`) ─────────────────────────────
const C = {
  green: '#10BA83',
  bg: '#12110f',
  bgCard: '#1c1b18',
  bgDark: '#0f0e0c',
  white: '#fffbff',
  muted: '#8a8a8a',
  subtle: '#6e6a63',
  priceDk: '#031410',
  priceM: '#1c1c17',
} as const;

const F = {
  heading: "'Almarai', sans-serif",
  body: "'Cairo', sans-serif",
  number: "'Inter', sans-serif",
} as const;

type Interval = 'monthly' | 'annual';

interface TierMeta {
  tier: 1 | 2 | 3;
  titleAr: string;
  titleEn: string;
  monthly: number;
  annual: number;
  featuredAr: string[];
  featuredEn: string[];
  badge?: string;
}

const TIERS: TierMeta[] = [
  {
    tier: 1,
    titleAr: 'البداية',
    titleEn: 'Starter',
    monthly: 80,
    annual: 768,
    featuredAr: [
      'برنامج ولاء واحد',
      'حتى ٢٠٠ عميل',
      'لوحة تحكم كاملة',
      'دعم عبر البريد',
    ],
    featuredEn: [
      '1 loyalty program',
      'Up to 200 customers',
      'Full dashboard access',
      'Email support',
    ],
  },
  {
    tier: 2,
    titleAr: 'النمو',
    titleEn: 'Growth',
    monthly: 150,
    annual: 1440,
    featuredAr: [
      'برامج ولاء غير محدودة',
      'حتى ٢٬٠٠٠ عميل',
      'معمل البطاقات (PassLab)',
      'تحليلات متقدمة',
      'دعم عبر واتساب',
    ],
    featuredEn: [
      'Unlimited loyalty programs',
      'Up to 2,000 customers',
      'Apple Wallet PassLab',
      'Advanced analytics',
      'WhatsApp support',
    ],
    badge: 'الأكثر شيوعاً',
  },
  {
    tier: 3,
    titleAr: 'الاحتراف',
    titleEn: 'Pro',
    monthly: 300,
    annual: 2880,
    featuredAr: [
      'كل مميزات خطة النمو',
      'عملاء غير محدودين',
      'حملات مخصصة للمواسم',
      'API للمطورين',
      'دعم مخصص وذو أولوية',
    ],
    featuredEn: [
      'Everything in Growth',
      'Unlimited customers',
      'Seasonal campaigns',
      'Developer API',
      'Priority dedicated support',
    ],
  },
];

function planId(tier: number, interval: Interval): string {
  return `tier${tier}_${interval}`;
}

function formatSar(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

function StatusBanner({
  status,
  planId: currentPlan,
  endsAt,
  lang,
}: {
  status: string;
  planId: string;
  endsAt: string | null;
  lang: 'ar' | 'en';
}) {
  const tone =
    status === 'active'
      ? { bg: 'rgba(16,186,131,0.12)', border: 'rgba(16,186,131,0.3)', text: C.green }
      : status === 'pending'
      ? { bg: 'rgba(255,200,50,0.12)', border: 'rgba(255,200,50,0.3)', text: '#ffc832' }
      : { bg: 'rgba(240,69,69,0.12)', border: 'rgba(240,69,69,0.3)', text: '#f04545' };

  const labelAr: Record<string, string> = {
    active: 'اشتراك نشط',
    pending: 'بانتظار إتمام الدفع',
    past_due: 'متأخر السداد',
    canceled: 'ملغي',
    failed: 'فشل',
    expired: 'منتهي',
  };
  const labelEn: Record<string, string> = {
    active: 'Active subscription',
    pending: 'Awaiting payment',
    past_due: 'Past due',
    canceled: 'Canceled',
    failed: 'Failed',
    expired: 'Expired',
  };
  const label = (lang === 'ar' ? labelAr : labelEn)[status] ?? status;

  return (
    <div
      className="w-full rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
      style={{ background: tone.bg, border: `1px solid ${tone.border}` }}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold" style={{ color: tone.text, fontFamily: F.body }}>
          {label}
        </span>
        <span className="text-sm" style={{ color: C.white, fontFamily: F.body }}>
          {currentPlan}
          {endsAt ? ` · ${lang === 'ar' ? 'ينتهي' : 'Ends'} ${new Date(endsAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB')}` : ''}
        </span>
      </div>
    </div>
  );
}

export default function Billing() {
  const { user, loading: authLoading } = useAuth();
  const { subscription, hasActive, loading: subLoading, refresh } = useSubscription();
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [interval, setInterval] = useState<Interval>('monthly');
  const [phone, setPhone] = useState('+9665');
  const [submitting, setSubmitting] = useState(false);
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preselect interval + tier from query string, if present.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planQ = params.get('plan');
    if (planQ) {
      const match = planQ.match(/^tier([1-3])_(monthly|annual)$/);
      if (match) {
        setSelectedTier(Number(match[1]) as 1 | 2 | 3);
        setInterval(match[2] as Interval);
      }
    }
  }, []);

  // Auth guard.
  useEffect(() => {
    if (!authLoading && !user) navigate('/login?next=/billing');
  }, [user, authLoading]);

  const phoneValid = /^\+9665[0-9]{8}$/.test(phone);
  const isRtl = lang === 'ar';
  const t = useMemo(
    () =>
      lang === 'ar'
        ? {
            title: 'الاشتراك',
            sub: 'اختر الخطة التي تناسب متجرك — ادفع شهرياً أو وفّر ٢٠٪ بالدفع السنوي.',
            monthly: 'شهري',
            annual: 'سنوي — خصم ٢٠٪',
            riyalMonth: 'ر.س / شهر',
            riyalYear: 'ر.س / سنة',
            phoneLabel: 'رقم الجوال (الاستخدام في فواتير ستريم باي)',
            phoneHint: '+966 5XX XX XXXX',
            cta: 'اذهب إلى الدفع',
            already: 'لديك اشتراك قائم — يمكنك إدارته من هنا.',
            back: '← الرئيسية',
          }
        : {
            title: 'Subscription',
            sub: 'Pick a plan that fits your shop — pay monthly or save 20% with annual billing.',
            monthly: 'Monthly',
            annual: 'Annual — save 20%',
            riyalMonth: 'SAR / month',
            riyalYear: 'SAR / year',
            phoneLabel: 'Phone number (used on StreamPay invoices)',
            phoneHint: '+966 5XX XX XXXX',
            cta: 'Continue to payment',
            already: 'You already have an active subscription — manage it below.',
            back: '← Home',
          },
    [lang],
  );

  async function start(tier: 1 | 2 | 3) {
    if (!phoneValid) {
      setError(isRtl ? 'رقم جوال غير صحيح' : 'Invalid phone');
      return;
    }
    setSelectedTier(tier);
    setSubmitting(true);
    setError(null);
    try {
      const res = await createCheckout({ plan_id: planId(tier, interval), phone });
      window.location.assign(res.checkout_url);
    } catch (e) {
      if (e instanceof StreamPayApiError && e.status === 409 && e.existingSubscriptionId) {
        await refresh();
        setError(
          isRtl
            ? 'لديك اشتراك قائم بالفعل.'
            : 'You already have a subscription in progress.',
        );
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: C.bg, color: C.muted, fontFamily: F.body }}
      >
        {isRtl ? 'جارٍ التحميل...' : 'Loading...'}
      </div>
    );
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen w-full"
      style={{ background: C.bg, color: C.white }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ background: 'rgba(18,17,15,0.85)', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-[1100px] mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-sm"
            style={{ color: C.muted, fontFamily: F.body }}
          >
            {t.back}
          </button>
          <button
            onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: C.white,
              fontFamily: F.body,
            }}
          >
            {isRtl ? 'EN' : 'عربي'}
          </button>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 md:py-14 flex flex-col gap-8">
        {/* Title */}
        <div className="flex flex-col gap-2">
          <h1
            className="font-bold text-3xl md:text-5xl tracking-[-1px]"
            style={{ color: C.white, fontFamily: F.heading }}
          >
            {t.title}
          </h1>
          <p className="text-base max-w-[560px]" style={{ color: C.muted, fontFamily: F.body }}>
            {t.sub}
          </p>
        </div>

        {/* Current subscription banner */}
        {!subLoading && subscription && (
          <StatusBanner
            status={subscription.status}
            planId={subscription.plan_id}
            endsAt={subscription.current_period_end}
            lang={lang}
          />
        )}

        {/* Toggle */}
        <div className="flex items-center gap-2 self-start rounded-full p-1"
             style={{ background: C.bgCard, border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['monthly', 'annual'] as const).map(opt => {
            const active = interval === opt;
            return (
              <button
                key={opt}
                onClick={() => setInterval(opt)}
                className="px-4 py-2 text-sm rounded-full transition-colors"
                style={{
                  background: active ? C.green : 'transparent',
                  color: active ? '#0a0a08' : C.white,
                  fontFamily: F.body,
                  fontWeight: active ? 700 : 500,
                }}
              >
                {opt === 'monthly' ? t.monthly : t.annual}
              </button>
            );
          })}
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map(tier => {
            const price = interval === 'monthly' ? tier.monthly : tier.annual;
            const unit = interval === 'monthly' ? t.riyalMonth : t.riyalYear;
            const features = isRtl ? tier.featuredAr : tier.featuredEn;
            const label = isRtl ? tier.titleAr : tier.titleEn;
            const isFeatured = tier.tier === 2;
            const isSelected = selectedTier === tier.tier;
            const cardBg = isFeatured ? C.priceDk : C.priceM;
            const cardBorder = isFeatured
              ? 'rgba(16,186,131,0.3)'
              : 'rgba(255,255,255,0.06)';

            return (
              <div
                key={tier.tier}
                className="rounded-3xl p-7 md:p-9 flex flex-col gap-6 relative overflow-hidden min-w-0"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
              >
                {isFeatured && tier.badge && (
                  <div
                    className="absolute top-5 px-3 py-1 rounded-full"
                    style={{ background: C.green, [isRtl ? 'left' : 'right']: '20px' }}
                  >
                    <span className="font-bold text-xs" style={{ color: '#0a0a08', fontFamily: F.body }}>
                      {isRtl ? tier.badge : 'Most popular'}
                    </span>
                  </div>
                )}
                <div className={`flex flex-col gap-1.5 ${isRtl ? 'items-end' : 'items-start'}`}>
                  <h3 className="font-bold text-xl" style={{ color: C.white, fontFamily: F.heading }}>
                    {label}
                  </h3>
                  <div className={`flex items-baseline gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span
                      className="font-black text-[44px] md:text-[56px] leading-none tracking-[-2px]"
                      style={{ color: C.white, fontFamily: F.number }}
                    >
                      {formatSar(price)}
                    </span>
                    <span className="text-sm" style={{ color: C.muted, fontFamily: F.body }}>
                      {unit}
                    </span>
                  </div>
                  {interval === 'annual' && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: C.green, background: 'rgba(16,186,131,0.1)' }}
                    >
                      {isRtl ? 'وفّر ٢٠٪' : 'Save 20%'}
                    </span>
                  )}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

                <ul className="flex flex-col gap-3 flex-1">
                  {features.map(f => (
                    <li key={f} className={`flex items-start gap-3 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'rgba(16,186,131,0.15)' }}
                      >
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path
                            d="M2 5.5L4.5 8L9 3"
                            stroke={C.green}
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="text-sm" style={{ color: '#c8c4bc', fontFamily: F.body }}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => start(tier.tier)}
                  disabled={submitting || !phoneValid || hasActive}
                  className="px-6 py-4 rounded-xl mt-2 transition-opacity disabled:opacity-50"
                  style={{
                    background: isFeatured ? C.green : 'rgba(255,255,255,0.06)',
                    border: isFeatured ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: isFeatured ? '#0a0a08' : C.white,
                    fontFamily: F.body,
                    fontWeight: 700,
                    cursor: submitting ? 'wait' : 'pointer',
                  }}
                >
                  {submitting && isSelected
                    ? isRtl ? 'جارٍ التحويل...' : 'Redirecting...'
                    : hasActive
                    ? isRtl ? 'مشترك' : 'Subscribed'
                    : t.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Phone input — StreamPay needs this on the consumer record */}
        {!hasActive && (
          <div
            className="rounded-2xl p-5 md:p-6 flex flex-col gap-3"
            style={{ background: C.bgCard, border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <label
              className="text-xs font-semibold"
              style={{ color: C.muted, fontFamily: F.body }}
            >
              {t.phoneLabel}
            </label>
            <input
              type="tel"
              inputMode="tel"
              dir="ltr"
              value={phone}
              onChange={e => {
                const v = e.target.value.replace(/[^\d+]/g, '');
                setPhone(v.startsWith('+') ? v : `+${v}`);
              }}
              placeholder={t.phoneHint}
              className="bg-transparent outline-none text-lg"
              style={{
                color: C.white,
                fontFamily: F.number,
                borderBottom: `1px solid ${phoneValid ? C.green : 'rgba(255,255,255,0.12)'}`,
                paddingBottom: 6,
              }}
            />
            <p className="text-xs" style={{ color: C.subtle, fontFamily: F.body }}>
              {isRtl
                ? 'مطلوب بصيغة ‎+9665XXXXXXXX — يستخدم لإشعارات الفواتير.'
                : 'Required in +9665XXXXXXXX format — used for invoice notifications.'}
            </p>
          </div>
        )}

        {error && (
          <div
            className="rounded-2xl px-5 py-4 text-sm"
            style={{
              background: 'rgba(240,69,69,0.1)',
              border: '1px solid rgba(240,69,69,0.3)',
              color: '#f04545',
              fontFamily: F.body,
            }}
          >
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
