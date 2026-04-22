import { useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const normalizePhone = (raw) => {
  if (!raw) return ''
  const digits = raw.replace(/[^\d+]/g, '')
  if (digits.startsWith('+966')) return digits
  if (digits.startsWith('00966')) return '+966' + digits.slice(5)
  if (digits.startsWith('966')) return '+' + digits
  if (digits.startsWith('05')) return '+966' + digits.slice(1)
  if (digits.startsWith('5') && digits.length === 9) return '+966' + digits
  return digits
}

export default function ScanRedeemTab({ shop, lang, d }) {
  const isAr = lang === 'ar'
  const [phone, setPhone] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [pass, setPass] = useState(null)
  const [msg, setMsg] = useState(null)

  const showMsg = (kind, text) => {
    setMsg({ kind, text })
    if (kind !== 'error') setTimeout(() => setMsg(null), 2600)
  }

  const loadPass = async (phoneValue) => {
    const raw = (phoneValue || '').trim()
    if (!raw) {
      showMsg('error', isAr ? 'ادخل رقم جوال صحيح' : 'Enter a valid phone number')
      return null
    }
    const { data, error } = await supabase.rpc('find_customer_pass', {
      _shop_id: shop.id,
      _phone: raw,
    })
    if (error) {
      console.error('find_customer_pass', error)
      showMsg('error', d.scanError)
      return null
    }
    return data || null
  }

  const handleLookup = async (e) => {
    e?.preventDefault()
    setLookupLoading(true)
    setMsg(null)
    const data = await loadPass(phone)
    if (!data) {
      setPass(null)
      showMsg('info', d.scanNotFound)
    } else {
      setPass(data)
    }
    setLookupLoading(false)
  }

  const callPointsUpdate = async (body) => {
    const { data: { session } } = await supabase.auth.getSession()
    const url = `${SUPABASE_URL}/functions/v1/points-update`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    })
    return res.json()
  }

  const isStamp = pass?.loyalty_programs?.loyalty_type !== 'points'
  const rawStampsRequired = pass?.loyalty_programs?.stamps_required
  const rawPointsThreshold = pass?.loyalty_programs?.reward_threshold
  const stampsRequired = rawStampsRequired && rawStampsRequired > 0 ? rawStampsRequired : null
  const pointsForReward = rawPointsThreshold && rawPointsThreshold > 0 ? rawPointsThreshold : null
  const currentStamps = pass?.stamps || 0
  const currentPoints = pass?.points || 0
  const rewardsBalance = pass?.rewards_balance || 0
  const progress = isStamp
    ? (stampsRequired ? Math.min(100, (currentStamps / stampsRequired) * 100) : 0)
    : (pointsForReward ? Math.min(100, (currentPoints / pointsForReward) * 100) : 0)
  const programName = pass?.loyalty_programs?.name
  const lastVisit = pass?.last_visit_at
    ? new Date(pass.last_visit_at).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : null

  const refreshPass = async () => {
    const lookup = pass?.customer_phone || phone
    const refreshed = await loadPass(lookup)
    if (refreshed) setPass(refreshed)
  }

  const handleAdd = async () => {
    if (!pass || actionLoading) return
    setActionLoading(true)
    setMsg(null)
    const body = isStamp
      ? { pass_id: pass.id, stamps_delta: 1, action: 'add_stamp' }
      : { pass_id: pass.id, points_delta: 1, action: 'add_points' }
    const j = await callPointsUpdate(body)
    if (j?.success) {
      showMsg('success', d.scanSuccessAdd)
      await refreshPass()
    } else {
      showMsg('error', j?.error || d.scanError)
    }
    setActionLoading(false)
  }

  const handleRedeem = async () => {
    if (!pass || actionLoading) return
    if (rewardsBalance < 1) {
      showMsg('error', d.scanRedeemDisabled)
      return
    }
    setActionLoading(true)
    setMsg(null)
    const j = await callPointsUpdate({ pass_id: pass.id, action: 'redeem_reward' })
    if (j?.success) {
      showMsg('success', d.scanSuccessRedeem)
      await refreshPass()
    } else {
      showMsg('error', j?.error || d.scanError)
    }
    setActionLoading(false)
  }

  return (
    <div className="scan-redeem-wrap" dir={isAr ? 'rtl' : 'ltr'}>
      <h1 className="dash-title">{d.scanTitle}</h1>

      <motion.section
        className="dash-card scan-lookup-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <label style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>{d.scanLookupLabel}</label>
        <form className="scan-lookup-row" onSubmit={handleLookup}>
          <input
            className="scan-lookup-input"
            type="tel"
            inputMode="tel"
            placeholder={d.scanLookupPh}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
          />
          <button
            type="submit"
            className="lw-btn primary scan-lookup-btn"
            disabled={lookupLoading || !phone.trim()}
          >
            {lookupLoading ? (isAr ? 'جاري البحث…' : 'Looking up…') : d.scanLookupBtn}
          </button>
        </form>
      </motion.section>

      {msg && (
        <motion.div
          className={`scan-msg ${msg.kind}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {msg.text}
        </motion.div>
      )}

      {pass && (
        <motion.section
          className="dash-card scan-customer-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="scan-customer-top">
            <h3 className="scan-customer-name">{pass.customer_name || (isAr ? 'عميل' : 'Customer')}</h3>
            <div className="scan-customer-meta">
              <span className="scan-customer-phone">{pass.customer_phone}</span>
              {programName && <span className="scan-program-chip">{programName}</span>}
            </div>
          </div>

          <div className="scan-balance-block">
            <motion.div
              key={isStamp ? currentStamps : currentPoints}
              className="scan-balance-number"
              initial={{ scale: 0.85, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {isStamp ? currentStamps : currentPoints}
            </motion.div>
            <div className="scan-balance-label">
              {isStamp
                ? (stampsRequired
                    ? (isAr ? `من ${stampsRequired} ختم` : `of ${stampsRequired} stamps`)
                    : (isAr ? 'ختم' : (currentStamps === 1 ? 'stamp' : 'stamps')))
                : (pointsForReward
                    ? (isAr ? `من ${pointsForReward} نقطة` : `of ${pointsForReward} points`)
                    : (isAr ? 'نقطة' : 'points'))}
            </div>
          </div>

          {((isStamp && stampsRequired) || (!isStamp && pointsForReward)) && (
            <div className="scan-progress">
              <div className="scan-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}

          {rewardsBalance > 0 && (
            <div className="scan-rewards-ready">
              🎁 {isAr
                ? `${rewardsBalance} مكافأة جاهزة للاستبدال`
                : `${rewardsBalance} reward${rewardsBalance > 1 ? 's' : ''} ready to redeem`}
            </div>
          )}

          {lastVisit && (
            <div className="scan-last-visit">
              {isAr ? 'آخر زيارة' : 'Last visit'}: {lastVisit}
            </div>
          )}

          <div className="scan-actions">
            <button
              className="lw-btn primary"
              onClick={handleAdd}
              disabled={actionLoading}
            >
              {actionLoading ? '…' : (isStamp ? (isAr ? '+ ختم' : '+ Stamp') : (isAr ? '+ نقطة' : '+ Point'))}
            </button>
            <button
              className="lw-btn"
              onClick={handleRedeem}
              disabled={actionLoading || rewardsBalance < 1}
            >
              {d.scanRedeem}
            </button>
          </div>
        </motion.section>
      )}
    </div>
  )
}
