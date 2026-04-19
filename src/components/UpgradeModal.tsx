import { navigate } from '../App';

const C = {
  green: '#10BA83',
  bg: '#12110f',
  bgCard: '#1c1b18',
  white: '#fffbff',
  muted: '#8a8a8a',
} as const;

const F = {
  heading: "'Almarai', sans-serif",
  body: "'Cairo', sans-serif",
} as const;

/**
 * UpgradeModal — shown over PassLab when the user doesn't have an active
 * subscription. Offers a CTA to /billing and a soft dismiss ("Home").
 *
 * The App-level router also redirects unsubscribed users out of /pass-lab, so
 * this is a defense-in-depth UI layer for brief race-conditions (e.g. the
 * subscription status flipping to canceled during the session).
 */
export default function UpgradeModal({ onClose }: { onClose?: () => void }) {
  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: 'rgba(10,9,8,0.82)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-[480px] w-full rounded-3xl p-8 flex flex-col gap-5 text-center"
        style={{
          background: C.bgCard,
          border: '1px solid rgba(16,186,131,0.2)',
          boxShadow: '0 30px 90px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(16,186,131,0.12)', border: '1px solid rgba(16,186,131,0.3)' }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3 L4 10 H8 V21 H16 V10 H20 Z"
              stroke={C.green}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold" style={{ color: C.white, fontFamily: F.heading }}>
          هذه الميزة للمشتركين
        </h2>
        <p style={{ color: C.muted, fontFamily: F.body }}>
          معمل البطاقات (PassLab) متاح ضمن خطط وايا المدفوعة. اختر الخطة التي تناسبك وابدأ
          في دقائق.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            onClick={() => navigate('/billing')}
            className="flex-1 px-6 py-3.5 rounded-xl"
            style={{ background: C.green, color: '#0a0a08', fontWeight: 700, fontFamily: F.body }}
          >
            اشترك الآن
          </button>
          <button
            onClick={() => (onClose ? onClose() : navigate('/'))}
            className="flex-1 px-6 py-3.5 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: C.white,
              fontFamily: F.body,
            }}
          >
            لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
}
