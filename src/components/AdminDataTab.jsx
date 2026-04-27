import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

/**
 * Admin-only Data console.
 *
 * Caller is responsible for gating render on `is_platform_admin()` —
 * this component still surfaces a graceful "forbidden" message if the
 * RPCs reject (defense in depth).
 */
export default function AdminDataTab({ lang = 'ar', t }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)
  const tx = t?.dataPage || {}

  const [shops, setShops] = useState([])
  const [shopId, setShopId] = useState('all')
  const [period, setPeriod] = useState('this_month')
  const [pickedMonth, setPickedMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [customFrom, setCustomFrom] = useState(() => firstOfMonthISO(new Date()))
  const [customTo, setCustomTo] = useState(() => todayISO())

  const [counters, setCounters] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  // ── Compute the date range as JS Date objects (or null when "all time"). ──
  const range = useMemo(() => computeRange(period, pickedMonth, customFrom, customTo), [period, pickedMonth, customFrom, customTo])
  const rangeError = period === 'custom' && range && range.start && range.end && range.start >= range.end

  // ── Load shops once (admin-gated server-side). ──
  useEffect(() => {
    let cancelled = false
    supabase.rpc('platform_shops_list').then(({ data, error }) => {
      if (cancelled) return
      if (error) { console.error('platform_shops_list', error); return }
      setShops(Array.isArray(data) ? data : [])
    })
    return () => { cancelled = true }
  }, [])

  // ── Load counters + customer rows whenever filters change. ──
  useEffect(() => {
    if (rangeError) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setErr(null)

    const args = {
      _shop_id: shopId === 'all' ? null : shopId,
      _start: range?.start ? range.start.toISOString() : null,
      _end:   range?.end   ? range.end.toISOString()   : null,
    }

    Promise.all([
      supabase.rpc('platform_data_counters', args),
      supabase.rpc('platform_customers_list', args),
    ]).then(([countersRes, listRes]) => {
      if (cancelled) return
      const firstError = countersRes.error || listRes.error
      if (firstError) {
        const msg = String(firstError.message || firstError)
        setErr(/forbidden/i.test(msg) ? (tx.forbidden || 'Admin only.') : msg)
        setCounters(null); setRows([])
      } else {
        const cRow = Array.isArray(countersRes.data) ? countersRes.data[0] : countersRes.data
        setCounters(cRow || null)
        setRows(Array.isArray(listRes.data) ? listRes.data : [])
      }
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [shopId, range?.start?.getTime(), range?.end?.getTime(), rangeError]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Build the picker options for the last 24 months. ──
  const monthOptions = useMemo(() => {
    const out = []
    const now = new Date()
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', year: 'numeric' })
      out.push({ value, label })
    }
    return out
  }, [isAr])

  const fmtDate = (iso) => {
    if (!iso) return tx.genderUnknown || '—'
    const d = new Date(iso)
    return d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  const fmtNum = (n) => (n ?? 0).toLocaleString('en-US')
  const fmtGender = (g) => {
    if (g === 'male') return tx.male || 'Male'
    if (g === 'female') return tx.female || 'Female'
    if (g === 'prefer_not') return tx.preferNot || '—'
    return tx.genderUnknown || '—'
  }

  const exportCsv = () => {
    const headers = [
      tx.name || 'Name',
      tx.gender || 'Gender',
      tx.phone || 'Phone',
      tx.stamps || 'Stamps',
      tx.points || 'Points',
      tx.rewards || 'Rewards',
      tx.joined || 'Joined',
      tx.lastVisit || 'Last visit',
      tx.store || 'Store',
    ]
    const esc = (v) => {
      const s = v == null ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const body = rows.map((r) => [
      r.customer_name || '',
      fmtGender(r.customer_gender),
      r.customer_phone || '',
      r.stamps ?? 0,
      r.points ?? 0,
      r.rewards_balance ?? 0,
      r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : '',
      r.last_visit_at ? new Date(r.last_visit_at).toISOString().slice(0, 10) : '',
      r.business_name || '',
    ].map(esc).join(','))
    const csv = '﻿' + [headers.map(esc).join(','), ...body].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    const shopSlug = shopId === 'all' ? 'all-stores' : (shops.find(s => s.shop_id === shopId)?.name || 'shop').replace(/[^\w-]+/g, '-').toLowerCase()
    a.href = url
    a.download = `waya-data-${shopSlug}-${stamp}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const showStoreCol = shopId === 'all'
  const customersInRange = Number(counters?.customers_in_range ?? 0)
  const customersTotal   = Number(counters?.customers_total    ?? 0)
  const salesCount       = Number(counters?.sales_count        ?? 0)
  const redemptionsCount = Number(counters?.redemptions_count  ?? 0)

  const totalLabel = (tx.customersTotal || 'of {n} lifetime').replace('{n}', fmtNum(customersTotal))

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      <h1 className="dash-title">{tx.title || 'Data'}</h1>
      {tx.subtitle && (
        <p style={{ color: 'var(--gray-dim)', marginTop: -8, marginBottom: 16, fontSize: '0.9rem' }}>{tx.subtitle}</p>
      )}

      {/* ── Filters ─────────────────────────────────────────────── */}
      <motion.div
        className="dash-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 16 }}
      >
        <div className="ev-controls">
          <div className="ev-control ev-control-grow">
            <label htmlFor="adt-store">{tx.store || 'Store'}</label>
            <select id="adt-store" value={shopId} onChange={(e) => setShopId(e.target.value)}>
              <option value="all">{tx.allStores || 'All stores'}</option>
              {shops.map((s) => (
                <option key={s.shop_id} value={s.shop_id}>
                  {s.name || s.owner_email || s.shop_id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div className="ev-control">
            <label htmlFor="adt-period">{tx.period || 'Period'}</label>
            <select id="adt-period" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="this_month">{tx.thisMonth || 'This month'}</option>
              <option value="last_month">{tx.lastMonth || 'Last month'}</option>
              <option value="last_30">{tx.last30 || 'Last 30 days'}</option>
              <option value="last_90">{tx.last90 || 'Last 90 days'}</option>
              <option value="pick_month">{tx.pickMonth || 'Pick a month…'}</option>
              <option value="custom">{tx.customRange || 'Custom range…'}</option>
            </select>
          </div>
          {period === 'pick_month' && (
            <div className="ev-control">
              <label htmlFor="adt-month">{tx.pickMonth || 'Month'}</label>
              <select id="adt-month" value={pickedMonth} onChange={(e) => setPickedMonth(e.target.value)}>
                {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          )}
          {period === 'custom' && (
            <>
              <div className="ev-control">
                <label htmlFor="adt-from">{tx.from || 'From'}</label>
                <input id="adt-from" type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} />
              </div>
              <div className="ev-control">
                <label htmlFor="adt-to">{tx.to || 'To'}</label>
                <input id="adt-to" type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            </>
          )}
          <button type="button" className="ev-refresh" onClick={exportCsv} disabled={loading || !rows.length}>
            {tx.exportCsv || 'Export CSV'}
          </button>
        </div>
        {rangeError && <p className="ev-err" style={{ color: '#b91c1c', marginTop: 12 }}>{tx.rangeError || T('From date must be before To date.', 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية.')}</p>}
        {err && !rangeError && <p className="ev-err" style={{ color: '#b91c1c', marginTop: 12 }}>{err}</p>}
      </motion.div>

      {/* ── Counter cards ───────────────────────────────────────── */}
      <div className="data-stats-grid">
        {[
          { label: tx.customersInRange || 'Customers in range', value: fmtNum(customersInRange), sub: totalLabel, icon: '👥', color: '#10B981' },
          { label: tx.sales || 'Sales', value: fmtNum(salesCount), icon: '📱', color: '#3B82F6' },
          { label: tx.redemptions || 'Redemptions', value: fmtNum(redemptionsCount), icon: '🎁', color: '#F59E0B' },
        ].map((sc, i) => (
          <motion.div
            key={i}
            className="data-stat-card"
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
          >
            <div className="data-stat-icon" style={{ background: sc.color + '18', color: sc.color }}>{sc.icon}</div>
            <div className="data-stat-value">{sc.value}</div>
            <div className="data-stat-label">{sc.label}</div>
            {sc.sub && <div style={{ fontSize: '0.75rem', color: 'var(--gray-dim)', marginTop: 4 }}>{sc.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* ── Raw customer table ─────────────────────────────────── */}
      <motion.div
        className="dash-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 style={{ marginBottom: 12 }}>{tx.tableTitle || 'Customers (raw data)'}</h2>
        {loading ? (
          <div style={{ padding: '24px 0', color: 'var(--gray-dim)' }}>{tx.loading || 'Loading…'}</div>
        ) : rows.length === 0 ? (
          <div className="dash-empty"><p>{tx.noData || 'No data for this period.'}</p></div>
        ) : (
          <div className="ev-table-wrap">
            <table className="ev-table">
              <thead>
                <tr>
                  <th>{tx.name || 'Name'}</th>
                  <th>{tx.gender || 'Gender'}</th>
                  <th>{tx.phone || 'Phone'}</th>
                  <th>{tx.stamps || 'Stamps'}</th>
                  <th>{tx.points || 'Points'}</th>
                  <th>{tx.rewards || 'Rewards'}</th>
                  <th>{tx.joined || 'Joined'}</th>
                  <th>{tx.lastVisit || 'Last visit'}</th>
                  {showStoreCol && <th>{tx.store || 'Store'}</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.customer_pass_id} className="ev-tr">
                    <td>{r.customer_name || '—'}</td>
                    <td>{fmtGender(r.customer_gender)}</td>
                    <td><code>{r.customer_phone || '—'}</code></td>
                    <td>{fmtNum(r.stamps)}</td>
                    <td>{fmtNum(r.points)}</td>
                    <td>{fmtNum(r.rewards_balance)}</td>
                    <td>{fmtDate(r.created_at)}</td>
                    <td>{fmtDate(r.last_visit_at)}</td>
                    {showStoreCol && <td>{r.business_name || '—'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function firstOfMonthISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function startOfDay(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function startOfNextDay(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number)
  return new Date(y, m - 1, d + 1, 0, 0, 0, 0)
}

function startOfMonth(year, month0) {
  return new Date(year, month0, 1, 0, 0, 0, 0)
}

function computeRange(period, pickedMonth, customFrom, customTo) {
  const now = new Date()
  if (period === 'this_month') {
    const start = startOfMonth(now.getFullYear(), now.getMonth())
    const end   = startOfMonth(now.getFullYear(), now.getMonth() + 1)
    return { start, end }
  }
  if (period === 'last_month') {
    const start = startOfMonth(now.getFullYear(), now.getMonth() - 1)
    const end   = startOfMonth(now.getFullYear(), now.getMonth())
    return { start, end }
  }
  if (period === 'last_30' || period === 'last_90') {
    const days = period === 'last_30' ? 30 : 90
    const start = new Date(now)
    start.setDate(start.getDate() - days)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  if (period === 'pick_month') {
    const [y, m] = (pickedMonth || '').split('-').map(Number)
    if (!y || !m) return null
    return { start: startOfMonth(y, m - 1), end: startOfMonth(y, m) }
  }
  if (period === 'custom') {
    if (!customFrom || !customTo) return null
    return { start: startOfDay(customFrom), end: startOfNextDay(customTo) }
  }
  return null
}
