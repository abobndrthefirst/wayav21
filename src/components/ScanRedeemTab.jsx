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
    const normalized = normalizePhone(phoneValue)
    if (!normalized) {
      showMsg('error', isAr ? 'ادخل رقم جوال صحيح' : 'Enter a valid phone number')
      return null
    }
    const { data, error } = await supabase
      .from('customer_passes')
      .select('id, customer_name, customer_phone, points, stamps, tier, rewards_balance, last_visit_at, loyalty_programs(name, loyalty_type, stamps_required, points_for_reward)')
      .eq('shop_id', shop.id)
      .or(`customer_phone.eq.${normalized},customer_phone.eq.${phoneValue}`)
      .maybeSingle()
    if (error) {
      showMsg('error', d.scanError)
      return null
    }
    return data
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
  const stampsRequired = pass?.loyalty_programs?.stamps_required || 10
  const pointsForReward = pass?.loyalty_programs?.points_for_reward || 100
  const currentStamps = pass?.stamps || 0
  const currentPoints = pass?.points || 0
  const rewardsBalance = pass?.rewards_balance || 0
  const progress = isStamp
    ? Math.min(100, (currentStamps / stampsRequired) * 100)
    : Math.min(100, (currentPoints / pointsForReward) * 100)

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
      const refreshed = await loadPass(phone)
      if (refreshed) setPass(refreshed)
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
      const refreshed = await loadPass(phone)
      if (refreshed) setPass(refreshed)
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
          <div className="scan-customer-head">
            <div>
              <h3 className="scan-customer-name">{pass.customer_name || (isAr ? 'عميل' : 'Customer')}</h3>
              <p className="scan-customer-phone">{pass.customer_phone}</p>
            </div>
            <div className="scan-stamp-counter">
              <div className="scan-stamp-big">
                {isStamp ? `${currentStamps} / ${stampsRequired}` : `${currentPoints} / ${pointsForReward}`}
              </div>
              <div className="scan-stamp-small">
                {isStamp ? d.scanStamps : (isAr ? 'نقاط' : 'points')}
              </div>
            </div>
          </div>

          <div className="scan-progress">
            <div className="scan-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {rewardsBalance > 0 && (
            <div className="scan-msg success" style={{ margin: 0 }}>
              {isAr ? `مكافأة جاهزة للاستبدال (${rewardsBalance})` : `Reward${rewardsBalance > 1 ? 's' : ''} ready to redeem (${rewardsBalance})`}
            </div>
          )}

          <div className="scan-actions">
            <button
              className="lw-btn primary"
              onClick={handleAdd}
              disabled={actionLoading}
            >
              {actionLoading ? '…' : d.scanAddStamp}
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
