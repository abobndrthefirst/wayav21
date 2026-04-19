import { useEffect, useState } from 'react';
import { navigate } from '../App';
import { useAuth } from '../lib/AuthContext';
import { getStatus, verifyPayment } from '../lib/streampayClient';

const C = {
  green: '#10BA83',
  bg: '#12110f',
  white: '#fffbff',
  muted: '#8a8a8a',
  red: '#f04545',
} as const;

const F = {
  heading: "'Almarai', sans-serif",
  body: "'Cairo', sans-serif",
} as const;

type Phase = 'verifying' | 'polling' | 'success' | 'failed';

export default function BillingReturn() {
  const { user, loading: authLoading } = useAuth();
  const [phase, setPhase] = useState<Phase>('verifying');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login?next=/billing');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const sub = params.get('sub');
    const sig = params.get('sig');
    const ts = Number(params.get('ts'));
    // StreamPay appends these on success redirects:
    const invoiceId = params.get('invoice_id') ?? undefined;
    const paymentId = params.get('payment_id') ?? undefined;
    const urlStatus = params.get('status');

    if (!sub || !sig || !Number.isFinite(ts)) {
      setPhase('failed');
      setMessage('رابط الإرجاع غير صالح — Invalid return link.');
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        await verifyPayment({
          subscription_id: sub!,
          sig: sig!,
          ts,
          invoice_id: invoiceId,
          payment_id: paymentId,
        });
      } catch (e) {
        if (cancelled) return;
        setPhase('failed');
        setMessage(e instanceof Error ? e.message : String(e));
        return;
      }

      setPhase('polling');

      // Poll get-status until we see `active` — up to ~12 seconds.
      for (let i = 0; i < 6; i++) {
        if (cancelled) return;
        try {
          const res = await getStatus();
          if (res.hasActive) {
            setPhase('success');
            setTimeout(() => navigate('/pass-lab'), 800);
            return;
          }
          if (res.subscription && ['failed', 'canceled', 'expired'].includes(res.subscription.status)) {
            setPhase('failed');
            setMessage(`Subscription state: ${res.subscription.status}`);
            return;
          }
        } catch {
          // keep polling — transient errors shouldn't kill the flow
        }
        await new Promise(r => setTimeout(r, 2000));
      }

      if (cancelled) return;
      // Fallback: if urlStatus said "paid" but we still see pending, send user
      // to /billing — they'll see the banner and can retry.
      if (urlStatus === 'paid') {
        setPhase('success');
        setTimeout(() => navigate('/billing'), 800);
      } else {
        setPhase('failed');
        setMessage('Timed out waiting for confirmation. Check /billing shortly.');
      }
    }

    run();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: C.bg, color: C.white, fontFamily: F.body }}
    >
      <div className="max-w-[480px] w-full flex flex-col items-center gap-5 text-center">
        {phase === 'verifying' && <Spinner color={C.muted} />}
        {phase === 'polling' && <Spinner color={C.green} />}
        {phase === 'success' && <Checkmark />}
        {phase === 'failed' && <Cross />}

        <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: F.heading }}>
          {phase === 'verifying' && 'جارٍ التحقق من الدفع...'}
          {phase === 'polling' && 'تأكيد الاشتراك...'}
          {phase === 'success' && 'تم الاشتراك بنجاح ✓'}
          {phase === 'failed' && 'تعذّر تأكيد الدفع'}
        </h1>

        {phase === 'success' && (
          <p style={{ color: C.muted }}>جارٍ تحويلك إلى لوحة التحكم...</p>
        )}
        {phase === 'failed' && (
          <>
            <p style={{ color: C.muted }}>{message}</p>
            <button
              onClick={() => navigate('/billing')}
              className="px-6 py-3 rounded-xl mt-2"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: C.white }}
            >
              العودة للاشتراك
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Spinner({ color }: { color: string }) {
  return (
    <svg className="animate-spin" width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="17" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
      <path d="M20 3 A17 17 0 0 1 37 20" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}
function Checkmark() {
  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center"
      style={{ background: 'rgba(16,186,131,0.15)', border: '1px solid rgba(16,186,131,0.3)' }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M6 14 L12 20 L22 8" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
function Cross() {
  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center"
      style={{ background: 'rgba(240,69,69,0.12)', border: '1px solid rgba(240,69,69,0.3)' }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M6 6 L18 18 M18 6 L6 18" stroke={C.red} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
