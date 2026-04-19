import { navigate } from '../App';

const C = {
  green: '#10BA83',
  bg: '#12110f',
  white: '#fffbff',
  muted: '#8a8a8a',
} as const;

const F = {
  heading: "'Almarai', sans-serif",
  body: "'Cairo', sans-serif",
} as const;

export default function BillingCancel() {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: C.bg, color: C.white, fontFamily: F.body }}
    >
      <div className="max-w-[460px] w-full flex flex-col items-center gap-5 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,200,50,0.12)',
            border: '1px solid rgba(255,200,50,0.3)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M14 8 V15 M14 19 V20"
              stroke="#ffc832"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: F.heading }}>
          لم يكتمل الدفع
        </h1>
        <p style={{ color: C.muted }}>
          تم إلغاء عملية الدفع أو تعذّر إتمامها. يمكنك المحاولة مرة أخرى من صفحة الاشتراك.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => navigate('/billing')}
            className="px-6 py-3 rounded-xl"
            style={{
              background: C.green,
              color: '#0a0a08',
              fontWeight: 700,
            }}
          >
            عُد إلى الاشتراك
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: C.white,
            }}
          >
            الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
