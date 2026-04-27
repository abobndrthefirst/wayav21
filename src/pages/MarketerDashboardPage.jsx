// Marketer dashboard — auth-gated.
// Route: /marketer/dashboard (mounted by App.jsx via lazy import).
//
// Loads the calling marketer's profile + referrals via the
// marketer_referrals_summary() RPC. Computes 5 stat cards client-side
// from the referrals array, renders the referrals table, and exposes
// a payment-info form that updates the marketers row directly (RLS
// allows self-update).
//
// Auth flow:
//   - No session → redirect to /marketer/login.
//   - Session but no marketers row → sign out + bounce to /marketer/login.
//   - Session but email_confirmed_at is null → bounce to /marketer/verify-email.
//   - Otherwise → render the dashboard.

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

// Production brand mark — served from /public, same asset used elsewhere.
const WAYA_LOGO = '/Arabic Letters Midjourney (1).svg'

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const SHARE_BASE = 'https://trywaya.com/subscribe?ref='

export default function MarketerDashboardPage({ t, lang, setLang, theme, setTheme }) {
  const m = t.marketer
  const isAr = lang === 'ar'

  const [loading, setLoading] = useState(true)
  const [marketer, setMarketer] = useState(null)
  const [referrals, setReferrals] = useState([])
  const [copied, setCopied] = useState(false)

  // Payment info form local state
  const [accountName, setAccountName] = useState('')
  const [bankName, setBankName] = useState('')
  const [iban, setIban] = useState('')
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentMsg, setPaymentMsg] = useState(null)

  useEffect(() => {
    document.title = isAr ? 'لوحة المسوّق - Waya' : 'Marketer Dashboard - Waya'
  }, [isAr])

  // Initial load: confirm session, load marketer + referrals.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { navigate('/marketer/login'); return }
      if (!user.email_confirmed_at) {
        navigate(`/marketer/verify-email?email=${encodeURIComponent(user.email)}`)
        return
      }

      const { data: row } = await supabase.from('marketers').select('*').eq('user_id', user.id).maybeSingle()
      if (cancelled) return
      if (!row) {
        await supabase.auth.signOut()
        navigate('/marketer/login')
        return
      }

      const { data: refs } = await supabase.rpc('marketer_referrals_summary')
      if (cancelled) return
      setMarketer(row)
      setReferrals(refs || [])
      setAccountName(row.payment_account_name || '')
      setBankName(row.bank_name || '')
      setIban(row.iban || '')
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const stats = useMemo(() => {
    const total = referrals.length
    const active = referrals.filter(r => r.subscription_status === 'active').length
    const pending = referrals.filter(r => r.subscription_status === 'pending').length
    let owed = 0
    let paid = 0
    for (const r of referrals) {
      const amt = Number(r.commission_amount || 0)
      if (r.commission_status === 'paid') paid += amt
      else if (r.commission_status === 'approved') owed += amt
    }
    return { total, active, pending, owed, paid }
  }, [referrals])

  const handleCopy = async () => {
    if (!marketer?.referral_code) return
    try {
      await navigator.clipboard.writeText(marketer.referral_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/marketer/login')
  }

  const handleSavePayment = async (e) => {
    e.preventDefault()
    setPaymentMsg(null)
    if (iban && !/^SA[0-9]{22}$/.test(iban)) {
      setPaymentMsg({ type: 'err', text: m.errIban }); return
    }
    setPaymentSaving(true)
    const { error: err } = await supabase.from('marketers').update({
      payment_account_name: accountName.trim() || null,
      bank_name: bankName.trim() || null,
      iban: iban.trim() || null,
    }).eq('id', marketer.id)
    setPaymentSaving(false)
    if (err) { setPaymentMsg({ type: 'err', text: err.message }); return }
    setPaymentMsg({ type: 'ok', text: m.paymentSaved })
  }

  const fmtSar = (n) => `${Number(n || 0).toLocaleString(isAr ? 'ar-SA' : 'en-SA', { maximumFractionDigits: 2 })} ${m.currency}`
  const fmtDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString(isAr ? 'ar-SA' : 'en-SA', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  const subStatusLabel = (s) => ({ pending: m.msStatusPending, active: m.msStatusActive, rejected: m.msStatusRejected, cancelled: m.msStatusCancelled })[s] || s
  const cStatusLabel = (s) => {
    if (!s) return '—'
    return ({ pending: m.cStatusPending, approved: m.cStatusApproved, paid: m.cStatusPaid, cancelled: m.cStatusCancelled })[s] || s
  }

  if (loading) {
    return <div className="marketer-dash-page" dir={isAr ? 'rtl' : 'ltr'}><div className="marketer-dash-loading">…</div></div>
  }

  const shareLink = SHARE_BASE + (marketer.referral_code || '')

  return (
    <div className="marketer-dash-page" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="marketer-dash-header">
        <button className="marketer-landing-brand" onClick={() => navigate('/')} aria-label="Waya">
          <img src={WAYA_LOGO} alt="وايا" />
        </button>
        <div className="marketer-dash-header-right">
          <span className="marketer-dash-welcome">{m.dashWelcome.replace('{name}', marketer.full_name)}</span>
          <button className="marketer-dash-logout" onClick={handleLogout}>{m.dashLogout}</button>
        </div>
      </header>

      <main className="marketer-dash-main">
        {/* Code card */}
        <motion.section className="marketer-dash-code-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h2 className="marketer-dash-code-title">{m.dashCodeTitle}</h2>
          <div className="marketer-dash-code-display" dir="ltr">{marketer.referral_code}</div>
          <p className="marketer-dash-code-helper">{m.dashCodeHelper}</p>
          <button className="marketer-btn-primary" onClick={handleCopy}>{copied ? m.dashCodeCopied : m.dashCodeCopy}</button>
          <div className="marketer-dash-share">
            <span className="marketer-dash-share-label">{m.dashCodeShareLabel}</span>
            <code className="marketer-dash-share-link" dir="ltr">{shareLink}</code>
          </div>
        </motion.section>

        {/* Stats */}
        <section className="marketer-dash-stats">
          <h2 className="marketer-dash-section-title">{m.dashStatsTitle}</h2>
          <div className="marketer-dash-stats-grid">
            <StatCard label={m.statTotal} value={stats.total} />
            <StatCard label={m.statActive} value={stats.active} />
            <StatCard label={m.statPending} value={stats.pending} />
            <StatCard label={m.statOwed} value={fmtSar(stats.owed)} />
            <StatCard label={m.statPaid} value={fmtSar(stats.paid)} />
          </div>
        </section>

        {/* Referrals table */}
        <section className="marketer-dash-table-section">
          <h2 className="marketer-dash-section-title">{m.dashTableTitle}</h2>
          {referrals.length === 0 ? (
            <div className="marketer-dash-empty">
              <p>{m.noReferrals}</p>
            </div>
          ) : (
            <div className="marketer-dash-table-wrap">
              <table className="marketer-dash-table">
                <thead>
                  <tr>
                    <th>{m.colBusiness}</th>
                    <th>{m.colPhone}</th>
                    <th>{m.colDate}</th>
                    <th>{m.colStatus}</th>
                    <th>{m.colCommission}</th>
                    <th>{m.colPayment}</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map(r => (
                    <tr key={r.subscription_id}>
                      <td>{r.business_name}</td>
                      <td dir="ltr">{r.phone}</td>
                      <td>{fmtDate(r.signup_date)}</td>
                      <td><span className={`marketer-status marketer-status-${r.subscription_status}`}>{subStatusLabel(r.subscription_status)}</span></td>
                      <td>{r.commission_amount != null ? fmtSar(r.commission_amount) : m.noAmountYet}</td>
                      <td><span className={`marketer-status marketer-status-c-${r.commission_status || 'pending'}`}>{cStatusLabel(r.commission_status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Payment info */}
        <section className="marketer-dash-payment">
          <h2 className="marketer-dash-section-title">{m.dashPaymentTitle}</h2>
          <p className="marketer-dash-payment-helper">{m.dashPaymentHelper}</p>
          <form className="auth-form" onSubmit={handleSavePayment}>
            <div className="auth-field">
              <label>{m.paymentAccountName}</label>
              <input type="text" value={accountName} onChange={e => { setAccountName(e.target.value); setPaymentMsg(null) }} />
            </div>
            <div className="auth-field">
              <label>{m.paymentBankName}</label>
              <input type="text" value={bankName} onChange={e => { setBankName(e.target.value); setPaymentMsg(null) }} />
            </div>
            <div className="auth-field">
              <label>{m.paymentIban}</label>
              <input type="text" value={iban} onChange={e => { setIban(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24)); setPaymentMsg(null) }} placeholder={m.paymentIbanPh} dir="ltr" maxLength={24} />
            </div>
            {paymentMsg && <p className={paymentMsg.type === 'ok' ? 'auth-success' : 'auth-error'}>{paymentMsg.text}</p>}
            <button type="submit" disabled={paymentSaving} className="auth-submit-btn">
              {paymentSaving ? m.paymentSaving : m.paymentSave}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="marketer-stat-card">
      <div className="marketer-stat-value">{value}</div>
      <div className="marketer-stat-label">{label}</div>
    </div>
  )
}
