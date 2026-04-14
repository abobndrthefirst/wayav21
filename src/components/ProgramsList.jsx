import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import LoyaltyWizard from './LoyaltyWizard'

/**
 * Programs list — shows all loyalty programs for a shop.
 * Props: shop, lang
 */
export default function ProgramsList({ shop, lang = 'en' }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [wizardFor, setWizardFor] = useState(null) // null | 'new' | program object
  const [qrFor, setQrFor] = useState(null)
  const [customersFor, setCustomersFor] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
    if (!error) setPrograms(data || [])
    setLoading(false)
  }

  useEffect(() => { if (shop?.id) load() }, [shop?.id])

  const toggleActive = async (p) => {
    await supabase.from('loyalty_programs').update({ is_active: !p.is_active }).eq('id', p.id)
    load()
  }

  const remove = async (p) => {
    if (!confirm(T(`Delete "${p.name}"? Customer passes will stop updating.`, `حذف "${p.name}"؟ ستتوقف بطاقات العملاء عن التحديث.`))) return
    await supabase.from('loyalty_programs').delete().eq('id', p.id)
    load()
  }

  if (wizardFor) {
    return (
      <LoyaltyWizard
        shop={shop}
        program={wizardFor === 'new' ? null : wizardFor}
        lang={lang}
        onCancel={() => setWizardFor(null)}
        onDone={(saved) => { setWizardFor(null); load(); setQrFor(saved) }}
      />
    )
  }

  if (qrFor) {
    return <ProgramQR program={qrFor} onClose={() => setQrFor(null)} lang={lang} />
  }

  if (customersFor) {
    return <ProgramCustomers program={customersFor} onClose={() => setCustomersFor(null)} lang={lang} />
  }

  return (
    <div className="pl-shell" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="pl-header">
        <h2>{T('Loyalty Cards', 'بطاقات الولاء')}</h2>
        <button className="lw-btn primary" onClick={() => setWizardFor('new')}>+ {T('New Card', 'بطاقة جديدة')}</button>
      </div>

      {loading && <div className="pl-empty">{T('Loading…', 'جارٍ التحميل…')}</div>}
      {!loading && programs.length === 0 && (
        <div className="pl-empty">
          <p>{T('No loyalty cards yet.', 'لا توجد بطاقات بعد.')}</p>
          <button className="lw-btn primary" onClick={() => setWizardFor('new')}>{T('Create your first card', 'أنشئ بطاقتك الأولى')}</button>
        </div>
      )}

      <div className="pl-grid">
        {programs.map((p) => (
          <div key={p.id} className="pl-card" style={{ borderTop: `4px solid ${p.card_color || '#10B981'}` }}>
            <div className="pl-card-top">
              <strong>{p.name}</strong>
              <span className={`pl-pill ${p.is_active ? 'on' : 'off'}`}>{p.is_active ? T('Active', 'نشط') : T('Paused', 'موقوف')}</span>
            </div>
            <div className="pl-card-meta">
              <span>{labelType(p.loyalty_type, T)}</span>
              {p.expires_at && <span>· {T('Expires', 'ينتهي')} {new Date(p.expires_at).toLocaleDateString()}</span>}
            </div>
            <div className="pl-card-actions">
              <button onClick={() => setQrFor(p)} className="lw-btn primary sm">QR</button>
              <button onClick={() => setCustomersFor(p)} className="lw-btn ghost sm">{T('Customers', 'العملاء')}</button>
              <button onClick={() => setWizardFor(p)} className="lw-btn ghost sm">{T('Edit', 'تعديل')}</button>
              <button onClick={() => toggleActive(p)} className="lw-btn ghost sm">{p.is_active ? T('Pause', 'إيقاف') : T('Activate', 'تفعيل')}</button>
              <button onClick={() => remove(p)} className="lw-btn danger sm">{T('Delete', 'حذف')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function labelType(t, T) {
  if (t === 'stamp') return T('Stamp Card', 'بطاقة أختام')
  if (t === 'points') return T('Points', 'نقاط')
  if (t === 'tiered') return T('Tiered Membership', 'عضوية بمستويات')
  if (t === 'coupon') return T('Coupon', 'كوبون')
  return t
}

function ProgramQR({ program, onClose, lang }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)
  const url = `${window.location.origin}/w/${program.id}`
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&data=${encodeURIComponent(url)}&color=${(program.card_color || '#10B981').replace('#', '')}&bgcolor=ffffff&margin=12`

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); alert(T('Link copied', 'تم النسخ')) } catch {}
  }

  const downloadPoster = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${program.name}</title>
      <style>body{font-family:system-ui;text-align:center;padding:48px;background:#f8f9fc}
      .card{background:#fff;border-radius:24px;padding:40px;max-width:520px;margin:0 auto;box-shadow:0 10px 40px rgba(0,0,0,.08)}
      h1{margin:0 0 8px;color:${program.card_color}}p{color:#555;margin:8px 0 24px}
      img{width:100%;max-width:380px;border-radius:16px;border:6px solid ${program.card_color}20}
      .url{margin-top:16px;font-family:monospace;color:#666;word-break:break-all;font-size:12px}</style></head>
      <body><div class="card"><h1>${program.name}</h1>
      <p>${T('Scan to join the loyalty program', 'امسح للانضمام لبرنامج الولاء')}</p>
      <img src="${qr}" alt="QR"/><div class="url">${url}</div></div></body></html>`
    const w = window.open('', '_blank')
    w.document.write(html); w.document.close()
    setTimeout(() => w.print(), 400)
  }

  return (
    <div className="pl-shell">
      <div className="pl-header">
        <h2>{program.name}</h2>
        <button className="lw-btn ghost" onClick={onClose}>{T('Back', 'رجوع')}</button>
      </div>
      <div className="pl-qr-wrap">
        <img src={qr} alt="QR" className="pl-qr-img" />
        <p className="pl-qr-hint">{T('Customers scan this with any phone. We auto-detect iOS or Android and route them to the right wallet.', 'العملاء يمسحون هذا الرمز. نتعرف تلقائياً على iPhone أو Android ونوجههم للمحفظة المناسبة.')}</p>
        <code className="pl-qr-url">{url}</code>
        <div className="pl-qr-actions">
          <button onClick={copy} className="lw-btn primary">{T('Copy link', 'نسخ الرابط')}</button>
          <button onClick={downloadPoster} className="lw-btn ghost">{T('Print poster', 'طباعة الملصق')}</button>
        </div>
      </div>
    </div>
  )
}

function ProgramCustomers({ program, onClose, lang }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)
  const [passes, setPasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [search, setSearch] = useState('')
  const isStamp = program.loyalty_type === 'stamp'

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('customer_passes')
      .select('*')
      .eq('program_id', program.id)
      .order('updated_at', { ascending: false })
    setPasses(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [program.id])

  const bump = async (pass, delta) => {
    setBusy(pass.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const url = `${supabase.supabaseUrl}/functions/v1/points-update`
      const body = isStamp
        ? { pass_id: pass.id, stamps_delta: delta, action: delta > 0 ? 'add_stamp' : 'remove_stamp' }
        : { pass_id: pass.id, points_delta: delta, action: delta > 0 ? 'add_points' : 'remove_points' }
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': supabase.supabaseKey || '',
        },
        body: JSON.stringify(body),
      })
      const j = await res.json()
      if (!j.success) alert(j.error || T('Update failed', 'فشل التحديث'))
      await load()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(null)
    }
  }

  const filtered = passes.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (p.customer_name || '').toLowerCase().includes(q) || (p.customer_phone || '').includes(q)
  })

  return (
    <div className="pl-shell" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="pl-header">
        <h2>{program.name} — {T('Customers', 'العملاء')}</h2>
        <button className="lw-btn ghost" onClick={onClose}>{T('Back', 'رجوع')}</button>
      </div>
      <div className="pl-customers-search">
        <input
          className="lw-input"
          placeholder={T('Search by name or phone', 'بحث بالاسم أو الهاتف')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading && <div className="pl-empty">{T('Loading…', 'جارٍ التحميل…')}</div>}
      {!loading && filtered.length === 0 && (
        <div className="pl-empty">{T('No customers yet. Share your QR to start enrolling.', 'لا يوجد عملاء بعد. شارك رمز QR لبدء التسجيل.')}</div>
      )}
      <div className="pl-customers">
        {filtered.map(p => (
          <div key={p.id} className="pl-customer-row">
            <div className="pl-customer-info">
              <strong>{p.customer_name || T('Member', 'عضو')}</strong>
              <span className="pl-customer-phone">{p.customer_phone}</span>
              <span className="pl-customer-meta">
                {isStamp
                  ? `${p.stamps || 0}/${program.stamps_required || 10} ${T('stamps', 'ختم')}`
                  : `${p.points || 0} ${T('points', 'نقطة')}`}
                {p.tier && ` · ${p.tier}`}
              </span>
            </div>
            <div className="pl-customer-actions">
              <button disabled={busy === p.id} className="lw-btn ghost sm" onClick={() => bump(p, -1)}>−1</button>
              <button disabled={busy === p.id} className="lw-btn primary sm" onClick={() => bump(p, 1)}>+1</button>
              {!isStamp && (
                <button disabled={busy === p.id} className="lw-btn primary sm" onClick={() => bump(p, 5)}>+5</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
