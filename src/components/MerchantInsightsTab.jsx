import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

/**
 * Merchant-only Insights tab. Uses RLS-scoped queries — every owner sees
 * just their own shop's numbers. No admin gate; sub-account members are
 * filtered out of the sidebar entry one level up.
 */
export default function MerchantInsightsTab({ shop, lang = 'ar', t }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)
  const tx = t?.insightsPage || {}

  const [period, setPeriod] = useState('this_month')
  const [pickedMonth, setPickedMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [customFrom, setCustomFrom] = useState(() => firstOfMonthISO(new Date()))
  const [customTo, setCustomTo] = useState(() => todayISO())

  const [counters, setCounters] = useState({ customers_total: 0, customers_in_range: 0, sales: 0, redemptions: 0 })
  const [daily, setDaily] = useState([])     // [{ date: 'YYYY-MM-DD', stamps: n, redemptions: n }]
  const [dow, setDow] = useState([])         // [{ dow: 0..6, stamps: n, redemptions: n }]
  const [top, setTop] = useState([])         // [{ name, phone, points, stamps }]
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const range = useMemo(() => computeRange(period, pickedMonth, customFrom, customTo), [period, pickedMonth, customFrom, customTo])
  const rangeError = period === 'custom' && range && range.start && range.end && range.start >= range.end

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

  // ── Load all insight data when shop or range changes ──────────────────
  useEffect(() => {
    if (!shop?.id || rangeError || !range) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setErr(null)

    const startISO = range.start.toISOString()
    const endISO   = range.end.toISOString()

    Promise.all([
      // Lifetime customer count
      supabase.from('customer_passes').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id),
      // In-range customer count
      supabase.from('customer_passes').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id).gte('created_at', startISO).lt('created_at', endISO),
      // Activity log in range — for sales/redemptions counts + daily/dow series
      supabase.from('activity_log').select('action, created_at').eq('shop_id', shop.id).gte('created_at', startISO).lt('created_at', endISO),
      // Top customers (by points, limit 10) — lifetime, not range-filtered
      supabase.from('customer_passes').select('id, customer_name, customer_phone, points, stamps, rewards_balance').eq('shop_id', shop.id).order('points', { ascending: false }).limit(10),
    ]).then(([totalRes, rangeRes, actRes, topRes]) => {
      if (cancelled) return
      const firstError = totalRes.error || rangeRes.error || actRes.error || topRes.error
      if (firstError) {
        setErr(String(firstError.message || firstError))
        setLoading(false)
        return
      }
      const events = actRes.data || []
      const sales = events.filter(e => e.action === 'add_stamp').length
      const redemptions = events.filter(e => e.action === 'redeem_reward').length

      setCounters({
        customers_total:    totalRes.count || 0,
        customers_in_range: rangeRes.count || 0,
        sales,
        redemptions,
      })
      setDaily(buildDailyBuckets(events, range.start, range.end))
      setDow(buildDowBuckets(events))
      setTop(topRes.data || [])
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [shop?.id, range?.start?.getTime(), range?.end?.getTime(), rangeError])

  const fmtNum = (n) => (n ?? 0).toLocaleString('en-US')

  const dowLabels = isAr
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      <h1 className="dash-title">{tx.title || T('Insights', 'تحليلات')}</h1>
      {tx.subtitle && (
        <p style={{ color: 'var(--gray-dim)', marginTop: -8, marginBottom: 16, fontSize: '0.9rem' }}>{tx.subtitle}</p>
      )}

      {/* ── Filter row ─────────────────────────────────────────── */}
      <motion.div
        className="dash-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 16 }}
      >
        <div className="ev-controls">
          <div className="ev-control">
            <label htmlFor="ins-period">{tx.period || T('Period', 'الفترة')}</label>
            <select id="ins-period" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="this_month">{tx.thisMonth || T('This month', 'هذا الشهر')}</option>
              <option value="last_month">{tx.lastMonth || T('Last month', 'الشهر الماضي')}</option>
              <option value="last_30">{tx.last30 || T('Last 30 days', 'آخر 30 يومًا')}</option>
              <option value="last_90">{tx.last90 || T('Last 90 days', 'آخر 90 يومًا')}</option>
              <option value="pick_month">{tx.pickMonth || T('Pick a month…', 'اختر شهرًا…')}</option>
              <option value="custom">{tx.customRange || T('Custom range…', 'فترة مخصصة…')}</option>
            </select>
          </div>
          {period === 'pick_month' && (
            <div className="ev-control">
              <label htmlFor="ins-month">{tx.pickMonth || T('Month', 'شهر')}</label>
              <select id="ins-month" value={pickedMonth} onChange={(e) => setPickedMonth(e.target.value)}>
                {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          )}
          {period === 'custom' && (
            <>
              <div className="ev-control">
                <label htmlFor="ins-from">{tx.from || T('From', 'من')}</label>
                <input id="ins-from" type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} />
              </div>
              <div className="ev-control">
                <label htmlFor="ins-to">{tx.to || T('To', 'إلى')}</label>
                <input id="ins-to" type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            </>
          )}
        </div>
        {rangeError && <p className="ev-err" style={{ color: '#b91c1c', marginTop: 12 }}>{tx.rangeError || T('From date must be before To date.', 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية.')}</p>}
        {err && !rangeError && <p className="ev-err" style={{ color: '#b91c1c', marginTop: 12 }}>{err}</p>}
      </motion.div>

      {/* ── Counter tiles ──────────────────────────────────────── */}
      <div className="data-stats-grid">
        {[
          { label: tx.customersInRange || T('New customers', 'عملاء جدد'), value: fmtNum(counters.customers_in_range), sub: (tx.customersTotal || T('of {n} lifetime', 'من أصل {n}')).replace('{n}', fmtNum(counters.customers_total)), icon: '👥', color: '#10B981' },
          { label: tx.sales || T('Sales', 'مبيعات'),                       value: fmtNum(counters.sales),                                         icon: '📱', color: '#3B82F6' },
          { label: tx.redemptions || T('Redemptions', 'استبدالات'),        value: fmtNum(counters.redemptions),                                   icon: '🎁', color: '#F59E0B' },
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

      {/* ── Daily activity line chart ──────────────────────────── */}
      <motion.div className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginTop: 16 }}>
        <div className="insights-chart-head">
          <h2>{tx.dailyActivity || T('Daily activity', 'النشاط اليومي')}</h2>
          <div className="insights-legend">
            <span className="insights-legend-dot" style={{ background: '#3B82F6' }} /> {tx.sales || T('Sales', 'مبيعات')}
            <span className="insights-legend-dot" style={{ background: '#F59E0B' }} /> {tx.redemptions || T('Redemptions', 'استبدالات')}
          </div>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-dim)' }}>{tx.loading || T('Loading…', 'جاري التحميل…')}</div>
        ) : daily.every(d => d.stamps === 0 && d.redemptions === 0) ? (
          <div className="dash-empty"><p>{tx.noActivity || T('No activity yet for this period.', 'لا يوجد نشاط في هذه الفترة.')}</p></div>
        ) : (
          <DailyLineChart daily={daily} isAr={isAr} />
        )}
      </motion.div>

      {/* ── Day of week bar chart ──────────────────────────────── */}
      <motion.div className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginTop: 16 }}>
        <h2>{tx.dayOfWeek || T('Busiest days of the week', 'أكثر الأيام نشاطًا')}</h2>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-dim)' }}>{tx.loading || T('Loading…', 'جاري التحميل…')}</div>
        ) : dow.every(d => d.stamps === 0 && d.redemptions === 0) ? (
          <div className="dash-empty"><p>{tx.noActivity || T('No activity yet for this period.', 'لا يوجد نشاط في هذه الفترة.')}</p></div>
        ) : (
          <DowBarChart dow={dow} labels={dowLabels} />
        )}
      </motion.div>

      {/* ── Top customers ──────────────────────────────────────── */}
      <motion.div className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ marginTop: 16 }}>
        <h2>{tx.topCustomers || T('Top customers (lifetime)', 'أفضل العملاء (الكل)')}</h2>
        {loading ? (
          <div style={{ padding: 24, color: 'var(--gray-dim)' }}>{tx.loading || T('Loading…', 'جاري التحميل…')}</div>
        ) : top.length === 0 ? (
          <div className="dash-empty"><p>{tx.noCustomers || T('No customers yet.', 'لا يوجد عملاء بعد.')}</p></div>
        ) : (
          <TopCustomers rows={top} isAr={isAr} t={t} />
        )}
      </motion.div>
    </div>
  )
}

// ── Daily line chart ────────────────────────────────────────────────────────
function DailyLineChart({ daily, isAr }) {
  const W = 720, H = 220, padL = 36, padR = 16, padT = 16, padB = 28
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const max = Math.max(1, ...daily.flatMap(d => [d.stamps, d.redemptions]))
  const niceMax = niceCeil(max)
  const yTicks = 4
  const xCount = Math.max(1, daily.length - 1)

  const xAt = (i) => padL + (i * innerW) / xCount
  const yAt = (v) => padT + innerH - (v / niceMax) * innerH

  const pathFor = (key) => daily.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(d[key]).toFixed(1)}`).join(' ')
  const areaFor = (key) => `${pathFor(key)} L ${xAt(daily.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${xAt(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`

  // Pick ~6 x-axis labels
  const labelEvery = Math.max(1, Math.ceil(daily.length / 6))

  return (
    <div className="insights-chart-wrap" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="insights-svg">
        {/* gridlines + y-axis labels */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = (niceMax * (yTicks - i)) / yTicks
          const y = yAt(v)
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--border, rgba(255,255,255,0.08))" strokeWidth="1" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--gray-dim, #888)">{Math.round(v).toLocaleString('en-US')}</text>
            </g>
          )
        })}

        {/* areas (subtle gradient fills) */}
        <defs>
          <linearGradient id="ins-grad-sales" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ins-grad-redeem" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaFor('stamps')}      fill="url(#ins-grad-sales)" />
        <path d={areaFor('redemptions')} fill="url(#ins-grad-redeem)" />

        {/* lines */}
        <path d={pathFor('stamps')}      fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={pathFor('redemptions')} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* points + tooltip-on-hover via <title> */}
        {daily.map((d, i) => (
          <g key={d.date}>
            <circle cx={xAt(i)} cy={yAt(d.stamps)}      r={d.stamps      ? 3 : 0} fill="#3B82F6" />
            <circle cx={xAt(i)} cy={yAt(d.redemptions)} r={d.redemptions ? 3 : 0} fill="#F59E0B" />
            <rect x={xAt(i) - 8} y={padT} width={16} height={innerH} fill="transparent">
              <title>{`${d.date}\n${isAr ? 'مبيعات' : 'Sales'}: ${d.stamps}\n${isAr ? 'استبدالات' : 'Redemptions'}: ${d.redemptions}`}</title>
            </rect>
          </g>
        ))}

        {/* x-axis labels */}
        {daily.map((d, i) => (i % labelEvery === 0 || i === daily.length - 1) && (
          <text key={`lbl-${d.date}`} x={xAt(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--gray-dim, #888)">
            {shortDate(d.date)}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ── Day-of-week bar chart ───────────────────────────────────────────────────
function DowBarChart({ dow, labels }) {
  const W = 720, H = 200, padL = 36, padR = 16, padT = 16, padB = 32
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const max = Math.max(1, ...dow.flatMap(d => [d.stamps, d.redemptions]))
  const niceMax = niceCeil(max)
  const groupW = innerW / 7
  const barW = (groupW - 8) / 2

  return (
    <div className="insights-chart-wrap" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="insights-svg">
        {Array.from({ length: 5 }, (_, i) => {
          const v = (niceMax * (4 - i)) / 4
          const y = padT + innerH - (v / niceMax) * innerH
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--border, rgba(255,255,255,0.08))" strokeWidth="1" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--gray-dim, #888)">{Math.round(v).toLocaleString('en-US')}</text>
            </g>
          )
        })}
        {dow.map((d, i) => {
          const groupX = padL + i * groupW + 4
          const hSales  = (d.stamps      / niceMax) * innerH
          const hRedeem = (d.redemptions / niceMax) * innerH
          const y0 = padT + innerH
          return (
            <g key={d.dow}>
              <rect x={groupX} y={y0 - hSales}  width={barW} height={hSales}  fill="#3B82F6" rx="3" ry="3">
                <title>{`${labels[i]}\nSales: ${d.stamps}`}</title>
              </rect>
              <rect x={groupX + barW + 2} y={y0 - hRedeem} width={barW} height={hRedeem} fill="#F59E0B" rx="3" ry="3">
                <title>{`${labels[i]}\nRedemptions: ${d.redemptions}`}</title>
              </rect>
              <text x={groupX + barW} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--gray-dim, #888)">{labels[i]}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Top customers list ─────────────────────────────────────────────────────
function TopCustomers({ rows, isAr, t }) {
  const tx = t?.insightsPage || {}
  const max = Math.max(1, ...rows.map(r => r.points || 0))
  return (
    <div className="insights-top-list">
      {rows.map((r, i) => {
        const pct = ((r.points || 0) / max) * 100
        return (
          <div key={r.id} className="insights-top-row">
            <div className="insights-top-rank">#{i + 1}</div>
            <div className="insights-top-meta">
              <div className="insights-top-name">{r.customer_name || (isAr ? 'بدون اسم' : 'Unnamed')}</div>
              <div className="insights-top-phone"><code>{r.customer_phone || '—'}</code></div>
            </div>
            <div className="insights-top-bar-wrap">
              <div className="insights-top-bar" style={{ width: `${Math.max(4, pct)}%` }} />
            </div>
            <div className="insights-top-stats">
              <span className="insights-top-points">{(r.points ?? 0).toLocaleString('en-US')} <small>{tx.points || (isAr ? 'نقاط' : 'pts')}</small></span>
              <span className="insights-top-stamps">{(r.stamps ?? 0).toLocaleString('en-US')} <small>{tx.stamps || (isAr ? 'ختم' : 'stamps')}</small></span>
            </div>
          </div>
        )
      })}
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
  if (period === 'this_month') return { start: startOfMonth(now.getFullYear(), now.getMonth()), end: startOfMonth(now.getFullYear(), now.getMonth() + 1) }
  if (period === 'last_month') return { start: startOfMonth(now.getFullYear(), now.getMonth() - 1), end: startOfMonth(now.getFullYear(), now.getMonth()) }
  if (period === 'last_30' || period === 'last_90') {
    const days = period === 'last_30' ? 30 : 90
    const start = new Date(now); start.setDate(start.getDate() - days); start.setHours(0, 0, 0, 0)
    const end = new Date(now); end.setHours(23, 59, 59, 999)
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

function buildDailyBuckets(events, start, end) {
  // Inclusive of start, exclusive of end. Bucket per local day.
  const buckets = new Map()
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const last   = new Date(end.getFullYear(),   end.getMonth(),   end.getDate())
  while (cursor < last) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
    buckets.set(key, { date: key, stamps: 0, redemptions: 0 })
    cursor.setDate(cursor.getDate() + 1)
  }
  for (const e of events) {
    const d = new Date(e.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const row = buckets.get(key)
    if (!row) continue
    if (e.action === 'add_stamp')      row.stamps      += 1
    else if (e.action === 'redeem_reward') row.redemptions += 1
  }
  // Cap to ~120 buckets so the SVG stays readable for long ranges (rolling window)
  const arr = Array.from(buckets.values())
  if (arr.length > 120) {
    const stride = Math.ceil(arr.length / 120)
    const out = []
    for (let i = 0; i < arr.length; i += stride) {
      const slice = arr.slice(i, i + stride)
      out.push({
        date: slice[0].date,
        stamps:      slice.reduce((s, x) => s + x.stamps, 0),
        redemptions: slice.reduce((s, x) => s + x.redemptions, 0),
      })
    }
    return out
  }
  return arr
}

function buildDowBuckets(events) {
  const out = Array.from({ length: 7 }, (_, i) => ({ dow: i, stamps: 0, redemptions: 0 }))
  for (const e of events) {
    const d = new Date(e.created_at)
    const i = d.getDay()
    if (e.action === 'add_stamp')      out[i].stamps      += 1
    else if (e.action === 'redeem_reward') out[i].redemptions += 1
  }
  return out
}

function niceCeil(n) {
  if (n <= 5)  return 5
  if (n <= 10) return 10
  const pow = Math.pow(10, Math.floor(Math.log10(n)))
  const base = n / pow
  if (base <= 1) return 1   * pow
  if (base <= 2) return 2   * pow
  if (base <= 5) return 5   * pow
  return 10 * pow
}

function shortDate(yyyyMmDd) {
  const [, m, d] = yyyyMmDd.split('-')
  return `${Number(m)}/${Number(d)}`
}
