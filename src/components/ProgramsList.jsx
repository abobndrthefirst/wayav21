import { useEffect, useState, lazy, Suspense } from 'react'
import { supabase } from '../lib/supabase'
import LoyaltyWizard from './LoyaltyWizard'

const PassDesignerPage = lazy(() => import('./pass-designer/PassDesignerPage'))

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
  const [designerFor, setDesignerFor] = useState(null)

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

  if (designerFor) {
    return (
      <Suspense fallback={<div style={{ padding: 48, textAlign: 'center', color: '#888' }}>Loading…</div>}>
        <PassDesignerPage
          program={designerFor}
          shop={shop}
          lang={lang}
          onBack={() => { setDesignerFor(null); load() }}
        />
      </Suspense>
    )
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
              <button onClick={() => setDesignerFor(p)} className="lw-btn primary sm">{T('Design', 'تصميم')}</button>
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

export function ProgramQR({ program, onClose, lang }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)
  const [token, setToken] = useState(null)
  const [tokenErr, setTokenErr] = useState(null)

  // Mint the signed enrollment token so the /w/:programId link is accepted
  // by wallet-public endpoints. Without ?t=... the enrollment will be refused.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setTokenErr(null)
      const { data, error } = await supabase.functions.invoke('mint-enrollment-token', {
        body: { program_id: program.id },
      })
      if (cancelled) return
      if (error || !data?.success) {
        setTokenErr(error?.message || data?.error || 'Could not mint enrollment token')
        return
      }
      setToken(data.token)
    })()
    return () => { cancelled = true }
  }, [program.id])

  const url = token
    ? `${window.location.origin}/w/${program.id}?t=${encodeURIComponent(token)}`
    : `${window.location.origin}/w/${program.id}`
  const color = program.card_color || '#10B981'
  const text = program.text_color || '#FFFFFF'
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=520x520&data=${encodeURIComponent(url)}&color=${color.replace('#', '')}&bgcolor=ffffff&margin=12`
  const qrPlain = `https://api.qrserver.com/v1/create-qr-code/?size=520x520&data=${encodeURIComponent(url)}&color=000000&bgcolor=ffffff&margin=12`

  const copy = async () => {
    if (!token) return
    try { await navigator.clipboard.writeText(url); alert(T('Link copied', 'تم النسخ')) } catch {}
  }

  const printPoster = (html) => {
    const w = window.open('', '_blank')
    w.document.write(html); w.document.close()
    setTimeout(() => w.print(), 600)
  }

  // Bilingual instruction lines
  const instr = {
    enTitle: 'Join our loyalty program',
    arTitle: 'انضم إلى برنامج الولاء',
    enSteps: ['Scan the QR with your phone camera', 'Enter your name & phone', 'Add the card to Apple or Google Wallet'],
    arSteps: ['امسح رمز QR بكاميرا الهاتف', 'أدخل اسمك ورقم جوالك', 'أضف البطاقة إلى Apple أو Google Wallet'],
  }

  const baseFonts = `@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Inter:wght@400;700;900&display=swap');`

  // Design 1: Bold colored card
  const designBold = () => `<!doctype html><html><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: A4 portrait; margin: 0; }
    body{margin:0;font-family:Inter,Cairo,system-ui,sans-serif;background:${color};color:${text};min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px;}
    .wrap{max-width:560px;width:100%;text-align:center;}
    h1{font-size:46px;margin:0 0 8px;font-weight:900;letter-spacing:-.5px;}
    h2{font-size:28px;margin:0 0 28px;font-weight:700;opacity:.95;direction:rtl;}
    .qr-card{background:#fff;padding:28px;border-radius:28px;display:inline-block;box-shadow:0 20px 60px rgba(0,0,0,.18);}
    .qr-card img{display:block;width:340px;height:340px;}
    .reward{margin:24px 0 12px;font-size:22px;font-weight:700;}
    .steps{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:24px;text-align:start;font-size:14px;}
    .col{padding:14px;border-radius:14px;background:rgba(255,255,255,.12);}
    .col.ar{direction:rtl;font-family:Cairo,sans-serif;}
    .col h3{margin:0 0 8px;font-size:13px;opacity:.85;text-transform:uppercase;letter-spacing:.5px;}
    .col ol{margin:0;padding-inline-start:18px;}
    .col li{margin:4px 0;}
    .footer{margin-top:24px;font-size:11px;opacity:.75;}
    @media print { body { background: ${color} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
    <div class="wrap">
      <h1>${program.name}</h1>
      <h2>${instr.arTitle}</h2>
      <div class="qr-card"><img src="${qr}" alt="QR"/></div>
      <div class="reward">🎁 ${program.reward_title || 'Reward'}</div>
      <div class="steps">
        <div class="col"><h3>EN</h3><ol><li>${instr.enSteps[0]}</li><li>${instr.enSteps[1]}</li><li>${instr.enSteps[2]}</li></ol></div>
        <div class="col ar"><h3>AR</h3><ol><li>${instr.arSteps[0]}</li><li>${instr.arSteps[1]}</li><li>${instr.arSteps[2]}</li></ol></div>
      </div>
      <div class="footer">${url}</div>
    </div></body></html>`

  // Design 2: Minimal white with colored accents
  const designMinimal = () => `<!doctype html><html><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: A4 portrait; margin: 0; }
    body{margin:0;font-family:Inter,Cairo,system-ui,sans-serif;background:#fff;color:#111;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px;}
    .wrap{max-width:520px;width:100%;text-align:center;border-top:8px solid ${color};border-bottom:8px solid ${color};padding:48px 24px;}
    h1{font-size:42px;margin:0 0 6px;font-weight:900;color:${color};letter-spacing:-.5px;}
    h2{font-size:24px;margin:0 0 32px;font-weight:700;color:#333;direction:rtl;font-family:Cairo,sans-serif;}
    .qr{display:block;margin:0 auto;width:320px;height:320px;border:4px solid ${color};border-radius:16px;padding:8px;background:#fff;}
    .reward{margin:28px 0 8px;font-size:20px;font-weight:700;color:${color};}
    .reward-sub{font-size:14px;color:#666;margin-bottom:24px;}
    .row{display:flex;gap:20px;margin-top:24px;text-align:start;font-size:13px;color:#444;}
    .row > div{flex:1;}
    .row .ar{direction:rtl;font-family:Cairo,sans-serif;}
    .row h3{font-size:11px;color:${color};text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;}
    .row ol{margin:0;padding-inline-start:18px;line-height:1.7;}
    .footer{margin-top:32px;font-size:11px;color:#999;font-family:monospace;}
    @media print { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style></head><body>
    <div class="wrap">
      <h1>${program.name}</h1>
      <h2>${instr.arTitle} · ${instr.enTitle}</h2>
      <img class="qr" src="${qrPlain}" alt="QR"/>
      <div class="reward">${program.reward_title || 'Reward'}</div>
      <div class="reward-sub">${T('Scan to join · ', 'امسح للانضمام · ')}</div>
      <div class="row">
        <div><h3>English</h3><ol><li>${instr.enSteps[0]}</li><li>${instr.enSteps[1]}</li><li>${instr.enSteps[2]}</li></ol></div>
        <div class="ar"><h3>عربي</h3><ol><li>${instr.arSteps[0]}</li><li>${instr.arSteps[1]}</li><li>${instr.arSteps[2]}</li></ol></div>
      </div>
      <div class="footer">${url}</div>
    </div></body></html>`

  // Design 3: Table tent — half-page, two-up identical sides for folding
  const designTableTent = () => `<!doctype html><html><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: A4 landscape; margin: 0; }
    body{margin:0;font-family:Inter,Cairo,system-ui,sans-serif;background:#fff;}
    .sheet{display:flex;width:100vw;height:100vh;}
    .side{flex:1;background:linear-gradient(135deg, ${color} 0%, ${color}dd 100%);color:${text};padding:32px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
    .side.flipped{transform:rotate(180deg);}
    .side h1{font-size:34px;margin:0 0 4px;font-weight:900;}
    .side h2{font-size:18px;margin:0 0 18px;font-weight:600;opacity:.9;direction:rtl;font-family:Cairo,sans-serif;}
    .qr-box{background:#fff;padding:14px;border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.2);}
    .qr-box img{display:block;width:200px;height:200px;}
    .reward{margin-top:16px;font-size:16px;font-weight:700;}
    .scan-hint{font-size:13px;margin-top:6px;opacity:.85;}
    .scan-hint .ar{display:block;direction:rtl;font-family:Cairo,sans-serif;}
    @media print { -webkit-print-color-adjust: exact; print-color-adjust: exact; body, .side { background: ${color} !important; } }
    </style></head><body>
    <div class="sheet">
      ${[0, 1].map((i) => `<div class="side ${i === 0 ? 'flipped' : ''}">
        <h1>${program.name}</h1>
        <h2>${instr.arTitle}</h2>
        <div class="qr-box"><img src="${qr}" alt="QR"/></div>
        <div class="reward">🎁 ${program.reward_title || 'Reward'}</div>
        <div class="scan-hint">
          <span>${instr.enSteps[0]}</span>
          <span class="ar">${instr.arSteps[0]}</span>
        </div>
      </div>`).join('')}
    </div></body></html>`

  const posters = [
    { key: 'bold', label: T('Bold colored', 'لون جريء'), build: designBold },
    { key: 'minimal', label: T('Minimal white', 'أبيض بسيط'), build: designMinimal },
    { key: 'tent', label: T('Table tent', 'عرض طاولة'), build: designTableTent },
  ]

  return (
    <div className="pl-shell" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="pl-header">
        <h2>{program.name}</h2>
        <button className="lw-btn ghost" onClick={onClose}>{T('Back', 'رجوع')}</button>
      </div>
      <div className="pl-qr-wrap">
        {!token && !tokenErr && <p className="pl-qr-hint">{T('Preparing link…', 'جارٍ تجهيز الرابط…')}</p>}
        {tokenErr && <p className="pl-qr-hint" style={{ color: '#c00' }}>{tokenErr}</p>}
        {token && <img src={qr} alt="QR" className="pl-qr-img" />}
        {token && <p className="pl-qr-hint">{T('Customers scan this with any phone. We auto-detect iOS or Android and route them to the right wallet.', 'العملاء يمسحون هذا الرمز. نتعرف تلقائياً على iPhone أو Android ونوجههم للمحفظة المناسبة.')}</p>}
        {token && <code className="pl-qr-url">{url}</code>}
        <div className="pl-qr-actions">
          <button onClick={copy} className="lw-btn primary" disabled={!token}>{T('Copy link', 'نسخ الرابط')}</button>
        </div>
      </div>

      <div className="pl-posters">
        <h3>{T('Printable posters', 'ملصقات للطباعة')}</h3>
        <p className="pl-posters-sub">{T('Pick a design, then print or save as PDF (bilingual EN / AR).', 'اختر تصميماً، ثم اطبعه أو احفظه كـ PDF (إنجليزي / عربي).')}</p>
        <div className="pl-posters-grid">
          {posters.map((p) => (
            <div key={p.key} className="pl-poster-card">
              <div className="pl-poster-thumb" style={{ background: p.key === 'minimal' ? '#fff' : color, color: text, borderColor: color }}>
                <div className="pl-poster-thumb-name" style={{ color: p.key === 'minimal' ? color : text }}>{program.name}</div>
                <div className="pl-poster-thumb-qr">▣</div>
                <div className="pl-poster-thumb-tag">{p.label}</div>
              </div>
              <button className="lw-btn primary" onClick={() => printPoster(p.build())} disabled={!token}>
                {token ? T('Print / Save PDF', 'طباعة / حفظ PDF') : T('Preparing…', 'جارٍ التجهيز…')}
              </button>
            </div>
          ))}
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

  const redeem = async (pass) => {
    if ((pass.rewards_balance || 0) < 1) return
    setBusy(pass.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const url = `${supabase.supabaseUrl}/functions/v1/points-update`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': supabase.supabaseKey || '',
        },
        body: JSON.stringify({ pass_id: pass.id, action: 'redeem_reward' }),
      })
      const j = await res.json()
      if (!j.success) alert(j.error || T('Redeem failed', 'فشل الاستبدال'))
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
                {(p.rewards_balance || 0) > 0 && (
                  <span style={{ marginInlineStart: 6, background: '#10B981', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                    {p.rewards_balance}x {T('reward', 'مكافأة')}
                  </span>
                )}
              </span>
            </div>
            <div className="pl-customer-actions">
              <button disabled={busy === p.id} className="lw-btn ghost sm" onClick={() => bump(p, -1)}>−1</button>
              <button disabled={busy === p.id} className="lw-btn primary sm" onClick={() => bump(p, 1)}>+1</button>
              {!isStamp && (
                <button disabled={busy === p.id} className="lw-btn primary sm" onClick={() => bump(p, 5)}>+5</button>
              )}
              {(p.rewards_balance || 0) > 0 && (
                <button disabled={busy === p.id} className="lw-btn sm" onClick={() => redeem(p)}
                  style={{ background: '#f59e0b', color: '#fff', border: 'none' }}>
                  {T('Redeem', 'استبدال')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
