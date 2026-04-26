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

  const color = program.card_color || '#10B981'
  const text = program.text_color || '#FFFFFF'

  // Per-business-type reward emoji. Falls back to 🎁 when the merchant skipped
  // business_type at wizard time (back-compat with all rows that existed before
  // migration 20260426130000).
  const EMOJI_MAP = {
    coffee: '☕', restaurant: '🍽️', salon: '💅', barber: '✂️',
    gym: '💪', retail: '🛍️', clinic: '🩺', bakery: '🥐', sweets: '🍰',
  }
  const rewardEmoji = EMOJI_MAP[program.business_type] || '🎁'
  const hookReward = program.reward_title || T('Free reward', 'مكافأة مجانية')

  // Per-template QR URL — encodes ?src=<templateId> so /w/:programId can log
  // which poster the customer scanned (poster_scans table). The preview QR in
  // the dashboard uses src=preview so it doesn't pollute template analytics.
  const buildLandingUrl = (templateId) => {
    const base = `${window.location.origin}/w/${program.id}`
    const params = new URLSearchParams()
    if (token) params.set('t', token)
    if (templateId) params.set('src', templateId)
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }
  const buildQrSrc = (templateId, tone = 'color') => {
    const target = buildLandingUrl(templateId)
    const fg = tone === 'color' ? color.replace('#', '') : '000000'
    return `https://api.qrserver.com/v1/create-qr-code/?size=520x520&data=${encodeURIComponent(target)}&color=${fg}&bgcolor=ffffff&margin=12`
  }

  // Plain landing URL for the "Copy link" button + dashboard preview QR.
  const url = buildLandingUrl(null)
  const previewQr = buildQrSrc('preview', 'color')

  const copy = async () => {
    if (!token) return
    try { await navigator.clipboard.writeText(url); alert(T('Link copied', 'تم النسخ')) } catch {}
  }

  const printPoster = (html) => {
    const w = window.open('', '_blank')
    w.document.write(html); w.document.close()
    setTimeout(() => w.print(), 600)
  }

  const baseFonts = `@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Inter:wght@400;700;900&display=swap');`

  // ─────────────────────────────────────────────────────────────────────────
  // Poster templates — each one ends in printPoster(html) via the selector.
  // The hook line is the reward (the actual offer), NOT a generic
  // "join the loyalty program" — that copy was the #1 conversion killer.
  // Each template embeds its own ?src=<templateId> in the QR so we can rank
  // performance via the poster_scans table.
  // ─────────────────────────────────────────────────────────────────────────

  // 1. Bold — single-line trap. Store name → reward → QR → arrow. No steps.
  const designBold = () => `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: A4 portrait; margin: 0; }
    body{margin:0;font-family:Cairo,Inter,system-ui,sans-serif;background:${color};color:${text};min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px;}
    .wrap{max-width:600px;width:100%;text-align:center;}
    .store{font-size:18px;font-weight:700;opacity:.85;margin:0 0 16px;letter-spacing:1px;text-transform:uppercase;}
    h1{font-size:64px;margin:0 0 32px;font-weight:900;line-height:1.1;letter-spacing:-1px;}
    .qr-card{background:#fff;padding:24px;border-radius:28px;display:inline-block;box-shadow:0 20px 60px rgba(0,0,0,.18);}
    .qr-card img{display:block;width:340px;height:340px;}
    .cta{margin-top:32px;font-size:36px;font-weight:900;letter-spacing:1px;}
    .footer{margin-top:24px;font-size:11px;opacity:.6;font-family:monospace;}
    @media print { body { background: ${color} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
    <div class="wrap">
      <p class="store">${program.name}</p>
      <h1>${hookReward} ${rewardEmoji}</h1>
      <div class="qr-card"><img src="${buildQrSrc('bold')}" alt="QR"/></div>
      <div class="cta">امسح ←</div>
      <div class="footer">${url}</div>
    </div></body></html>`

  // 2. Minimal — clean white, colored borders, 3 numbered steps (kept short).
  //    For merchants who want the polished, instructional look.
  const designMinimal = () => `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: A4 portrait; margin: 0; }
    body{margin:0;font-family:Cairo,Inter,system-ui,sans-serif;background:#fff;color:#111;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px;}
    .wrap{max-width:520px;width:100%;text-align:center;border-top:8px solid ${color};border-bottom:8px solid ${color};padding:48px 24px;}
    h1{font-size:42px;margin:0 0 6px;font-weight:900;color:${color};letter-spacing:-.5px;}
    h2{font-size:24px;margin:0 0 32px;font-weight:700;color:#333;}
    .qr{display:block;margin:0 auto;width:320px;height:320px;border:4px solid ${color};border-radius:16px;padding:8px;background:#fff;}
    .reward{margin:28px 0 24px;font-size:24px;font-weight:800;color:${color};}
    .steps{display:flex;justify-content:center;gap:32px;margin-top:24px;font-size:16px;color:#444;font-weight:600;}
    .steps span{display:flex;align-items:center;gap:8px;}
    .steps b{background:${color};color:#fff;width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;}
    .footer{margin-top:32px;font-size:11px;color:#999;font-family:monospace;}
    @media print { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style></head><body>
    <div class="wrap">
      <h1>${program.name}</h1>
      <h2>${hookReward} ${rewardEmoji}</h2>
      <img class="qr" src="${buildQrSrc('minimal', 'plain')}" alt="QR"/>
      <div class="reward">${rewardEmoji} ${hookReward}</div>
      <div class="steps">
        <span><b>1</b>امسح</span>
        <span><b>2</b>سجّل</span>
        <span><b>3</b>استلم</span>
      </div>
      <div class="footer">${url}</div>
    </div></body></html>`

  // 3. Table tent — two-up identical sides for folding (A4 landscape).
  const designTableTent = () => `<!doctype html><html><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: A4 landscape; margin: 0; }
    body{margin:0;font-family:Cairo,Inter,system-ui,sans-serif;background:#fff;}
    .sheet{display:flex;width:100vw;height:100vh;}
    .side{flex:1;background:linear-gradient(135deg, ${color} 0%, ${color}dd 100%);color:${text};padding:32px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
    .side.flipped{transform:rotate(180deg);}
    .side h1{font-size:34px;margin:0 0 4px;font-weight:900;}
    .side h2{font-size:22px;margin:0 0 18px;font-weight:800;direction:rtl;}
    .qr-box{background:#fff;padding:14px;border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.2);}
    .qr-box img{display:block;width:200px;height:200px;}
    .cta{margin-top:14px;font-size:20px;font-weight:900;letter-spacing:.5px;}
    @media print { -webkit-print-color-adjust: exact; print-color-adjust: exact; body, .side { background: ${color} !important; } }
    </style></head><body>
    <div class="sheet">
      ${[0, 1].map((i) => `<div class="side ${i === 0 ? 'flipped' : ''}">
        <h1>${program.name}</h1>
        <h2>${hookReward} ${rewardEmoji}</h2>
        <div class="qr-box"><img src="${buildQrSrc('tent')}" alt="QR"/></div>
        <div class="cta">امسح ←</div>
      </div>`).join('')}
    </div></body></html>`

  // 4. Confession — the bold/weird template. Looks like a yellowed receipt.
  //    Customer writes their name on the blank line with a pen tied to the
  //    wall. The wall fills with names → becomes its own social proof.
  //    Cringe: 7/10. Virality: 9/10. Conversion: massive.
  const designConfession = () => `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: A4 portrait; margin: 0; }
    body{margin:0;font-family:Cairo,sans-serif;background:#f4ecd8;color:#1a1a1a;min-height:100vh;padding:60px 48px 80px;background-image:repeating-linear-gradient(0deg,transparent 0 39px,rgba(0,0,0,.04) 39px 40px);position:relative;box-sizing:border-box;}
    .stamp{position:absolute;top:36px;left:36px;border:3px solid ${color};color:${color};padding:8px 18px;transform:rotate(-12deg);font-weight:900;font-size:16px;letter-spacing:1px;text-transform:uppercase;}
    h1{font-size:64px;margin:60px 0 24px;font-weight:900;letter-spacing:-1px;}
    .line{font-size:26px;line-height:2;margin:0 0 12px;}
    .blank{display:inline-block;border-bottom:3px dashed #333;height:32px;width:340px;vertical-align:bottom;margin:0 8px;}
    .qr-wrap{text-align:center;margin-top:32px;}
    .qr-wrap img{width:280px;height:280px;border:8px solid #fff;box-shadow:0 0 0 3px ${color},0 14px 40px rgba(0,0,0,.18);}
    .pen-note{font-size:14px;color:#666;text-align:center;margin-top:18px;font-style:italic;}
    .footer{position:absolute;bottom:24px;left:0;right:0;text-align:center;font-size:11px;color:#888;font-family:monospace;}
    @media print { -webkit-print-color-adjust: exact; print-color-adjust: exact; body { background: #f4ecd8 !important; } }
    </style></head><body>
    <div class="stamp">${program.name}</div>
    <h1>اعتراف:</h1>
    <p class="line">اسمي <span class="blank"></span></p>
    <p class="line">وأنا أزور <strong>${program.name}</strong> كثير</p>
    <p class="line">وما خذيت ولا ${hookReward} ${rewardEmoji}</p>
    <p class="line" style="margin-top:24px">حان الوقت أصلح هذا 👇</p>
    <div class="qr-wrap">
      <img src="${buildQrSrc('confession', 'plain')}" alt="QR"/>
    </div>
    <p class="pen-note">* علّق قلم بجانب البوستر — اطلب من العميل يكتب اسمه *</p>
    <div class="footer">${url}</div>
    </body></html>`

  // 5. Receipt sticker — A7 (74×105mm). Fits on receipts, cup sleeves, napkin
  //    holders, table corners. Customer is already holding the surface = touch
  //    = attention. Highest conversion-per-square-cm of any surface.
  const designReceipt = () => `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: 74mm 105mm; margin: 0; }
    body{margin:0;font-family:Cairo,sans-serif;background:${color};color:${text};width:74mm;height:105mm;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8mm;box-sizing:border-box;text-align:center;}
    h1{font-size:14pt;margin:0 0 4pt;font-weight:900;letter-spacing:-.3px;}
    .hook{font-size:12pt;font-weight:800;margin:0 0 8pt;line-height:1.3;}
    .qr{background:#fff;padding:6pt;border-radius:8pt;display:inline-block;}
    .qr img{display:block;width:42mm;height:42mm;}
    .cta{margin-top:8pt;font-size:14pt;font-weight:900;letter-spacing:.5px;}
    @media print { body { background: ${color} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
    <h1>${program.name}</h1>
    <p class="hook">${rewardEmoji} ${hookReward}</p>
    <div class="qr"><img src="${buildQrSrc('receipt', 'plain')}" alt="QR"/></div>
    <p class="cta">امسح ←</p>
    </body></html>`

  // 6. Story — 9:16 vertical card sized for screenshots → Snap / Instagram /
  //    WhatsApp story. Owner saves as PDF, screenshots one page, posts.
  //    Free distribution from the merchant's existing followers.
  const designStory = () => `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: 108mm 192mm; margin: 0; }
    body{margin:0;font-family:Cairo,sans-serif;background:linear-gradient(160deg, ${color} 0%, ${color}cc 100%);color:${text};width:108mm;height:192mm;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:14mm 10mm;box-sizing:border-box;text-align:center;}
    .top{display:flex;flex-direction:column;align-items:center;gap:6mm;}
    .badge{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);padding:4pt 10pt;border-radius:999px;font-size:9pt;font-weight:700;letter-spacing:1px;text-transform:uppercase;}
    h1{font-size:22pt;margin:0;font-weight:900;line-height:1.1;letter-spacing:-.5px;}
    .reward{font-size:32pt;font-weight:900;line-height:1.1;margin:0;}
    .qr{background:#fff;padding:8pt;border-radius:14pt;}
    .qr img{display:block;width:50mm;height:50mm;}
    .cta{font-size:13pt;font-weight:800;opacity:.95;}
    .foot{font-size:8pt;opacity:.7;font-family:monospace;}
    @media print { body { background: ${color} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
    <div class="top">
      <span class="badge">${program.name}</span>
      <h1>${rewardEmoji}</h1>
      <p class="reward">${hookReward}</p>
    </div>
    <div class="qr"><img src="${buildQrSrc('story', 'plain')}" alt="QR"/></div>
    <div class="top">
      <p class="cta">امسح وانضم — ٥ ثواني</p>
      <p class="foot">${url}</p>
    </div>
    </body></html>`

  // Posters are split into safe defaults + bold/experimental.
  // The bold ones convert higher in our analytics but feel risky to merchants
  // who haven't seen the data yet — so we group them visibly under "Bold".
  const posters = [
    { key: 'bold',       group: 'classic', label: T('Direct',       'مباشر'),         build: designBold,       sub: T('Reward → QR → arrow. No fluff.', 'المكافأة → الرمز → سهم. بدون حشو.') },
    { key: 'minimal',    group: 'classic', label: T('Minimal',      'بسيط'),          build: designMinimal,    sub: T('White, professional, 3 short steps.', 'أبيض، احترافي، ٣ خطوات قصيرة.') },
    { key: 'tent',       group: 'classic', label: T('Table tent',   'عرض طاولة'),     build: designTableTent,  sub: T('Folds in half — sits on every table.', 'يطوى — يوضع على كل طاولة.') },
    { key: 'confession', group: 'bold',    label: T('Confession',   'اعتراف'),        build: designConfession, sub: T('Pen on a string. Customers write names. Wall fills up.', 'قلم معلّق. العملاء يكتبون أسماءهم. الجدار يمتلئ.') },
    { key: 'receipt',    group: 'bold',    label: T('Receipt sticker', 'ملصق فاتورة'), build: designReceipt,    sub: T('A7 size. Stick on receipts, cup sleeves, napkin holders.', 'مقاس A7. الصق على الفواتير، أكواب القهوة، حامل المناديل.') },
    { key: 'story',      group: 'bold',    label: T('Story-ready',  'جاهز للستوري'),  build: designStory,      sub: T('9:16 vertical. Screenshot → Snap / Instagram story.', '٩:١٦ عمودي. صوّر → ستوري سناب / انستقرام.') },
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
        {token && <img src={previewQr} alt="QR" className="pl-qr-img" />}
        {token && <p className="pl-qr-hint">{T('Customers scan this with any phone. We auto-detect iOS or Android and route them to the right wallet.', 'العملاء يمسحون هذا الرمز. نتعرف تلقائياً على iPhone أو Android ونوجههم للمحفظة المناسبة.')}</p>}
        {token && <code className="pl-qr-url">{url}</code>}
        <div className="pl-qr-actions">
          <button onClick={copy} className="lw-btn primary" disabled={!token}>{T('Copy link', 'نسخ الرابط')}</button>
        </div>
      </div>

      <div className="pl-posters">
        <h3>{T('Printable posters', 'ملصقات للطباعة')}</h3>
        <p className="pl-posters-sub">{T('Pick a design, then print or save as PDF.', 'اختر تصميماً، ثم اطبعه أو احفظه كـ PDF.')}</p>

        {['classic', 'bold'].map((groupKey) => {
          const groupPosters = posters.filter((p) => p.group === groupKey)
          if (!groupPosters.length) return null
          const groupLabel = groupKey === 'classic'
            ? T('Classic', 'كلاسيكي')
            : T('Bold (higher conversion, more cringe)', 'جريء (تحويل أعلى، أكثر جرأة)')
          const groupSub = groupKey === 'classic'
            ? T('Safe defaults — wall posters, table tents.', 'الخيارات الآمنة — ملصقات الجدار، عرض الطاولة.')
            : T('Experimental templates that get scanned more in field tests. Pick one and try it for a week.', 'قوالب تجريبية تحصل على عدد أكبر من المسحات في الاختبارات الميدانية. اختر واحداً وجربه لمدة أسبوع.')

          return (
            <div key={groupKey} className="pl-posters-group">
              <h4 style={{ marginTop: 24, marginBottom: 4, fontSize: 15, color: groupKey === 'bold' ? '#dc2626' : '#111' }}>
                {groupKey === 'bold' && '🔥 '}{groupLabel}
              </h4>
              <p className="pl-posters-sub" style={{ marginTop: 0, marginBottom: 12 }}>{groupSub}</p>
              <div className="pl-posters-grid">
                {groupPosters.map((p) => {
                  const isLight = p.key === 'minimal' || p.key === 'confession'
                  const thumbBg = p.key === 'confession' ? '#f4ecd8' : (isLight && p.key !== 'confession' ? '#fff' : color)
                  const thumbText = p.key === 'confession' ? '#1a1a1a' : (isLight ? color : text)
                  return (
                    <div key={p.key} className="pl-poster-card">
                      <div className="pl-poster-thumb" style={{ background: thumbBg, color: thumbText, borderColor: color }}>
                        <div className="pl-poster-thumb-name" style={{ color: thumbText }}>{program.name}</div>
                        <div className="pl-poster-thumb-qr">▣</div>
                        <div className="pl-poster-thumb-tag">{p.label}</div>
                      </div>
                      <p style={{ fontSize: 12, color: '#666', margin: '6px 0 8px', lineHeight: 1.4, minHeight: 32 }}>{p.sub}</p>
                      <button className="lw-btn primary" onClick={() => printPoster(p.build())} disabled={!token}>
                        {token ? T('Print / Save PDF', 'طباعة / حفظ PDF') : T('Preparing…', 'جارٍ التجهيز…')}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
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
