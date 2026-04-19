import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * EventsPanel — merchant-facing view of the public.events stream.
 * Props:
 *   shopId  (required) — only rows matching this shop are shown; RLS enforces
 *                        this server-side too, but filtering here is faster.
 *   lang    'en' | 'ar'
 *   compact bool — if true, only renders the last 8 error/critical rows as a
 *                  "recent issues" card. If false, renders the full log with
 *                  category / severity filters.
 */
export default function EventsPanel({ shopId, lang = 'en', compact = false }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  // Filters (only used in full mode)
  const [category, setCategory] = useState('all')   // all | business | tech | security
  const [severity, setSeverity] = useState(compact ? 'error+' : 'all') // all | info | warn | error | critical | error+
  const [search, setSearch] = useState('')

  const limit = compact ? 8 : 100

  const load = async () => {
    if (!shopId) return
    setLoading(true)
    setErr(null)
    let q = supabase
      .from('events')
      .select('id, created_at, event_type, category, severity, source, message, error_code, metadata, program_id, customer_pass_id')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category !== 'all') q = q.eq('category', category)
    if (severity === 'error+') q = q.in('severity', ['error', 'critical'])
    else if (severity !== 'all') q = q.eq('severity', severity)

    const { data, error } = await q
    if (error) setErr(error.message)
    else setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [shopId, category, severity])

  // Client-side free-text search (message + event_type + error_code)
  const filtered = useMemo(() => {
    if (!search.trim()) return events
    const q = search.trim().toLowerCase()
    return events.filter((e) =>
      (e.message || '').toLowerCase().includes(q) ||
      (e.event_type || '').toLowerCase().includes(q) ||
      (e.error_code || '').toLowerCase().includes(q)
    )
  }, [events, search])

  if (!shopId) return null

  if (compact) {
    return (
      <div className="ev-compact">
        <div className="ev-compact-head">
          <h3>{T('Recent issues', 'مشاكل حديثة')}</h3>
          {events.length > 0 && (
            <span className="ev-badge ev-badge-error">{events.length}</span>
          )}
        </div>
        {loading && <p className="ev-muted">{T('Loading…', 'جارٍ التحميل…')}</p>}
        {err && <p className="ev-err">{err}</p>}
        {!loading && events.length === 0 && (
          <p className="ev-muted ev-ok">
            {T('✓ No issues in the last 90 days.', '✓ لا توجد مشاكل في آخر 90 يوماً.')}
          </p>
        )}
        {!loading && events.length > 0 && (
          <ul className="ev-compact-list">
            {events.slice(0, 6).map((e) => (
              <li key={e.id} className={`ev-row ev-sev-${e.severity}`}>
                <div className="ev-row-head">
                  <strong>{prettyType(e.event_type)}</strong>
                  <span className="ev-row-time">{timeAgo(e.created_at, isAr)}</span>
                </div>
                {e.message && <div className="ev-row-msg">{e.message}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="ev-panel">
      <div className="ev-controls">
        <div className="ev-control">
          <label>{T('Category', 'الفئة')}</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">{T('All', 'الكل')}</option>
            <option value="business">{T('Business', 'أعمال')}</option>
            <option value="tech">{T('Tech', 'تقنية')}</option>
            <option value="security">{T('Security', 'أمان')}</option>
          </select>
        </div>
        <div className="ev-control">
          <label>{T('Severity', 'الخطورة')}</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="all">{T('All', 'الكل')}</option>
            <option value="error+">{T('Errors only', 'الأخطاء فقط')}</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div className="ev-control ev-control-grow">
          <label>{T('Search', 'بحث')}</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={T('message, type, code…', 'رسالة، نوع، رمز…')}
          />
        </div>
        <button className="ev-refresh" onClick={load} disabled={loading}>
          {loading ? T('Refreshing…', 'جارٍ التحديث…') : T('Refresh', 'تحديث')}
        </button>
      </div>

      {err && <p className="ev-err">{err}</p>}

      {!loading && filtered.length === 0 && (
        <p className="ev-muted">{T('No events match.', 'لا توجد أحداث مطابقة.')}</p>
      )}

      <div className="ev-table-wrap">
        <table className="ev-table">
          <thead>
            <tr>
              <th>{T('When', 'متى')}</th>
              <th>{T('Type', 'النوع')}</th>
              <th>{T('Category', 'الفئة')}</th>
              <th>{T('Severity', 'الخطورة')}</th>
              <th>{T('Message', 'الرسالة')}</th>
              <th>{T('Source', 'المصدر')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className={`ev-tr ev-sev-${e.severity}`}>
                <td title={e.created_at}>{timeAgo(e.created_at, isAr)}</td>
                <td><code>{prettyType(e.event_type)}</code></td>
                <td>{e.category}</td>
                <td><span className={`ev-badge ev-badge-${e.severity}`}>{e.severity}</span></td>
                <td>{e.message || <span className="ev-muted">—</span>}</td>
                <td><small className="ev-muted">{e.source}</small></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function prettyType(t) {
  return (t || '').replace(/_/g, ' ')
}

function timeAgo(iso, isAr) {
  if (!iso) return ''
  const d = new Date(iso)
  const ms = Date.now() - d.getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return isAr ? `قبل ${s} ث` : `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return isAr ? `قبل ${m} د` : `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return isAr ? `قبل ${h} س` : `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 30) return isAr ? `قبل ${days} ي` : `${days}d ago`
  return d.toLocaleDateString('en-US')
}
