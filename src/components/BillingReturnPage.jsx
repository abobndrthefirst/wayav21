// BillingReturnPage — StreamPay redirects here on successful checkout.
// Re-verifies via the edge function (never trusts query params) and polls
// get-status until the subscription flips to `active`, then redirects home.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { getStatus, verifyPayment } from '../lib/streampay'

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function BillingReturnPage({ lang = 'ar' }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)
  const [phase, setPhase] = useState('verifying') // verifying | polling | success | failed
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function run() {
      // Wait for session to be ready, otherwise verify-payment returns 401.
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setPhase('failed')
        setMessage(T('Please sign in to confirm your payment.', 'الرجاء تسجيل الدخول لتأكيد الدفع.'))
        return
      }

      const params = new URLSearchParams(window.location.search)
      const sub = params.get('sub')
      const sig = params.get('sig')
      const ts = Number(params.get('ts'))
      const invoiceId = params.get('invoice_id') ?? undefined
      const paymentId = params.get('payment_id') ?? undefined
      const urlStatus = params.get('status')

      if (!sub || !sig || !Number.isFinite(ts)) {
        setPhase('failed')
        setMessage(T('Invalid return link.', 'رابط الإرجاع غير صالح.'))
        return
      }

      try {
        await verifyPayment({
          subscription_id: sub,
          sig,
          ts,
          invoice_id: invoiceId,
          payment_id: paymentId,
        })
      } catch (e) {
        if (cancelled) return
        setPhase('failed')
        setMessage(e?.message ?? String(e))
        return
      }

      setPhase('polling')

      for (let i = 0; i < 6; i++) {
        if (cancelled) return
        try {
          const res = await getStatus()
          if (res?.hasActive) {
            setPhase('success')
            setTimeout(() => navigate('/dashboard'), 1000)
            return
          }
          const status = res?.subscription?.status
          if (status && ['failed', 'canceled', 'expired'].includes(status)) {
            setPhase('failed')
            setMessage(T(`Subscription state: ${status}`, `حالة الاشتراك: ${status}`))
            return
          }
        } catch {
          // keep polling
        }
        await new Promise(r => setTimeout(r, 2000))
      }

      if (cancelled) return
      if (urlStatus === 'paid') {
        setPhase('success')
        setTimeout(() => navigate('/billing'), 1000)
      } else {
        setPhase('failed')
        setMessage(T('Timed out waiting for confirmation. Check /billing shortly.', 'انتهت مهلة التحقق. تحقق من صفحة الاشتراك بعد قليل.'))
      }
    }

    run()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="auth-page billing-return-page" dir={isAr ? 'rtl' : 'ltr'}>
      <motion.div
        className="billing-return-card"
        initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="billing-return-icon">
          {phase === 'verifying' && <Spinner color="var(--gray-dim)" />}
          {phase === 'polling' && <Spinner color="#10B981" />}
          {phase === 'success' && <Checkmark />}
          {phase === 'failed' && <Cross />}
        </div>
        <h1 className="billing-return-title">
          {phase === 'verifying' && T('Verifying payment…', 'جارٍ التحقق من الدفع...')}
          {phase === 'polling' && T('Confirming subscription…', 'تأكيد الاشتراك...')}
          {phase === 'success' && T('Subscription active ✓', 'تم الاشتراك بنجاح ✓')}
          {phase === 'failed' && T("Couldn't confirm payment", 'تعذّر تأكيد الدفع')}
        </h1>
        {phase === 'success' && <p className="billing-return-sub">{T('Redirecting to dashboard…', 'جارٍ التحويل إلى لوحة التحكم...')}</p>}
        {phase === 'failed' && (
          <>
            <p className="billing-return-sub">{message}</p>
            <button onClick={() => navigate('/billing')} className="auth-submit-btn" style={{ marginTop: 20 }}>
              {T('Back to subscription', 'العودة للاشتراك')}
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}

function Spinner({ color }) {
  return (
    <motion.svg width="44" height="44" viewBox="0 0 40 40" fill="none"
      animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
      <circle cx="20" cy="20" r="17" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
      <path d="M20 3 A17 17 0 0 1 37 20" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
    </motion.svg>
  )
}
function Checkmark() {
  return (
    <motion.div
      style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
      initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M6 14 L12 20 L22 8" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  )
}
function Cross() {
  return (
    <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(240,69,69,0.12)', border: '1px solid rgba(240,69,69,0.3)' }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M6 6 L18 18 M18 6 L6 18" stroke="#f04545" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
}
