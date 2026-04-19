// BillingCancelPage — StreamPay redirects here when the user cancels or the
// payment fails in the hosted checkout. Simple confirm + back to /billing.

import { motion } from 'framer-motion'

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function BillingCancelPage({ lang = 'ar' }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)
  return (
    <div className="auth-page billing-return-page" dir={isAr ? 'rtl' : 'ltr'}>
      <motion.div
        className="billing-return-card"
        initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="billing-return-icon">
          <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,200,50,0.12)', border: '1px solid rgba(255,200,50,0.3)' }}>
            <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
              <path d="M14 8 V15 M14 19 V20" stroke="#ffc832" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <h1 className="billing-return-title">{T('Payment not completed', 'لم يكتمل الدفع')}</h1>
        <p className="billing-return-sub">
          {T(
            "Your payment was canceled or couldn't be completed. You can try again from the subscription page.",
            'تم إلغاء عملية الدفع أو تعذّر إتمامها. يمكنك المحاولة مرة أخرى من صفحة الاشتراك.',
          )}
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={() => navigate('/billing')} className="auth-submit-btn" style={{ flex: 1 }}>
            {T('Back to subscription', 'عُد إلى الاشتراك')}
          </button>
          <button onClick={() => navigate('/')} className="auth-google-btn" style={{ flex: 1 }}>
            {T('Home', 'الرئيسية')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
