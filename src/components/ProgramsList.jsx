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
  //
  // Sizing: A4 portrait = 210×297mm. All A4 templates use mm units + bounded
  // font sizes + overflow:hidden so layouts never push to a second page even
  // when program.name or reward_title is long.
  //
  // No raw landing-URL footers — the QR itself encodes the link, printing it
  // again was just visual noise that ate page real estate.
  //
  // i18n: Strings respect the same `isAr` flag the dashboard uses. <html dir>
  // and lang attributes flip so PDF readers + screen readers behave correctly.
  // ─────────────────────────────────────────────────────────────────────────

  const dirAttr  = isAr ? 'rtl' : 'ltr'
  const langAttr = isAr ? 'ar'  : 'en'
  const txt = {
    scanArrow: isAr ? 'امسح ←'                    : '← Scan',
    scanJoin:  isAr ? 'امسح وانضم — ٥ ثواني'      : 'Scan to join — 5 seconds',
    step1:     isAr ? 'امسح'                       : 'Scan',
    step2:     isAr ? 'سجّل'                        : 'Sign up',
    step3:     isAr ? 'استلم'                      : 'Earn',
    // Confession
    confession:isAr ? 'اعتراف:'                    : 'CONFESSION:',
    cMyName:   isAr ? 'اسمي'                       : 'My name is',
    cVisit:    isAr ? `وأنا أزور <strong>${program.name}</strong> كثير`
                    : `And I visit <strong>${program.name}</strong> a lot`,
    cNever:    isAr ? `وما خذيت ولا ${hookReward} ${rewardEmoji}`
                    : `But I've never claimed my ${hookReward} ${rewardEmoji}`,
    cFix:      isAr ? 'حان الوقت أصلح هذا 👇'      : 'Time to fix that 👇',
    // Wanted
    wanted:    isAr ? 'مطلوب'                      : 'WANTED',
    wReason:   isAr ? 'بتهمة عدم استلام المكافأة' : 'FOR NOT CLAIMING THEIR REWARD',
    wFace:     isAr ? '[ ضع صورتك هنا ]'           : '[ YOUR FACE HERE ]',
    wBounty:   isAr ? 'المكافأة'                   : 'BOUNTY',
    wLastSeen: isAr ? 'آخر ظهور:'                  : 'LAST SEEN AT',
    wTurnIn:   isAr ? 'سلّم نفسك ←'                : '← TURN YOURSELF IN',
    // Tear-off tabs
    tabHint:   isAr ? 'مزّق قسيمة وخذها معك' : 'Tear a tab and take it home',
    tabPrint:  isAr ? '✂ قص على الخطوط المنقطة' : '✂ cut along the dashed lines',
    // Receipt of regret
    rDate:     isAr ? 'التاريخ' : 'DATE',
    rItem:     hookReward,
    rSubtotal: isAr ? 'المجموع'                    : 'SUBTOTAL',
    rRegret:   isAr ? 'مرات كان ممكن تكون مجانية:' : 'TIMES THIS COULD HAVE BEEN FREE:',
    rStop:     isAr ? 'أوقف هذا'                   : 'STOP THIS',
    rThanks:   isAr ? 'شكراً لزيارتك'              : 'THANK YOU FOR YOUR VISIT',
  }

  // 1. Bold — single-line trap. Store name → reward → QR → arrow.
  const designBold = () => `<!doctype html><html dir="${dirAttr}" lang="${langAttr}"><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: A4 portrait; margin: 0; }
    html,body{height:100%;}
    body{margin:0;font-family:Cairo,Inter,system-ui,sans-serif;background:${color};color:${text};width:210mm;height:297mm;display:flex;align-items:center;justify-content:center;padding:18mm;box-sizing:border-box;overflow:hidden;}
    .wrap{max-width:160mm;width:100%;text-align:center;}
    .store{font-size:12pt;font-weight:700;opacity:.85;margin:0 0 6mm;letter-spacing:1px;text-transform:uppercase;}
    h1{font-size:36pt;margin:0 0 10mm;font-weight:900;line-height:1.1;letter-spacing:-.5px;word-wrap:break-word;}
    .qr-card{background:#fff;padding:6mm;border-radius:8mm;display:inline-block;box-shadow:0 6mm 18mm rgba(0,0,0,.18);}
    .qr-card img{display:block;width:80mm;height:80mm;}
    .cta{margin-top:10mm;font-size:24pt;font-weight:900;letter-spacing:1px;}
    @media print { body { background: ${color} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
    <div class="wrap">
      <p class="store">${program.name}</p>
      <h1>${hookReward} ${rewardEmoji}</h1>
      <div class="qr-card"><img src="${buildQrSrc('bold')}" alt="QR"/></div>
      <div class="cta">${txt.scanArrow}</div>
    </div></body></html>`

  // 2. Minimal — clean white, colored borders, 3 numbered steps.
  const designMinimal = () => `<!doctype html><html dir="${dirAttr}" lang="${langAttr}"><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: A4 portrait; margin: 0; }
    html,body{height:100%;}
    body{margin:0;font-family:Cairo,Inter,system-ui,sans-serif;background:#fff;color:#111;width:210mm;height:297mm;display:flex;align-items:center;justify-content:center;padding:18mm;box-sizing:border-box;overflow:hidden;}
    .wrap{max-width:150mm;width:100%;text-align:center;border-top:3mm solid ${color};border-bottom:3mm solid ${color};padding:14mm 8mm;}
    h1{font-size:26pt;margin:0 0 2mm;font-weight:900;color:${color};letter-spacing:-.5px;word-wrap:break-word;}
    h2{font-size:16pt;margin:0 0 10mm;font-weight:700;color:#333;word-wrap:break-word;}
    .qr{display:block;margin:0 auto;width:80mm;height:80mm;border:1.5mm solid ${color};border-radius:5mm;padding:2mm;background:#fff;box-sizing:border-box;}
    .reward{margin:8mm 0 6mm;font-size:18pt;font-weight:800;color:${color};word-wrap:break-word;}
    .steps{display:flex;justify-content:center;gap:8mm;margin-top:6mm;font-size:12pt;color:#444;font-weight:600;}
    .steps span{display:flex;align-items:center;gap:2mm;}
    .steps b{background:${color};color:#fff;width:8mm;height:8mm;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11pt;font-weight:900;}
    @media print { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style></head><body>
    <div class="wrap">
      <h1>${program.name}</h1>
      <h2>${hookReward} ${rewardEmoji}</h2>
      <img class="qr" src="${buildQrSrc('minimal', 'plain')}" alt="QR"/>
      <div class="reward">${rewardEmoji} ${hookReward}</div>
      <div class="steps">
        <span><b>1</b>${txt.step1}</span>
        <span><b>2</b>${txt.step2}</span>
        <span><b>3</b>${txt.step3}</span>
      </div>
    </div></body></html>`

  // 3. Table tent — two-up identical sides for folding (A4 landscape).
  const designTableTent = () => `<!doctype html><html dir="${dirAttr}" lang="${langAttr}"><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: A4 landscape; margin: 0; }
    html,body{height:100%;}
    body{margin:0;font-family:Cairo,Inter,system-ui,sans-serif;background:#fff;width:297mm;height:210mm;overflow:hidden;}
    .sheet{display:flex;width:297mm;height:210mm;}
    .side{flex:1;background:linear-gradient(135deg, ${color} 0%, ${color}dd 100%);color:${text};padding:14mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-sizing:border-box;overflow:hidden;}
    .side.flipped{transform:rotate(180deg);}
    .side h1{font-size:22pt;margin:0 0 2mm;font-weight:900;word-wrap:break-word;max-width:120mm;}
    .side h2{font-size:15pt;margin:0 0 6mm;font-weight:800;word-wrap:break-word;max-width:120mm;}
    .qr-box{background:#fff;padding:4mm;border-radius:5mm;box-shadow:0 3mm 9mm rgba(0,0,0,.2);}
    .qr-box img{display:block;width:55mm;height:55mm;}
    .cta{margin-top:5mm;font-size:14pt;font-weight:900;letter-spacing:.5px;}
    @media print { -webkit-print-color-adjust: exact; print-color-adjust: exact; body, .side { background: ${color} !important; } }
    </style></head><body>
    <div class="sheet">
      ${[0, 1].map((i) => `<div class="side ${i === 0 ? 'flipped' : ''}">
        <h1>${program.name}</h1>
        <h2>${hookReward} ${rewardEmoji}</h2>
        <div class="qr-box"><img src="${buildQrSrc('tent')}" alt="QR"/></div>
        <div class="cta">${txt.scanArrow}</div>
      </div>`).join('')}
    </div></body></html>`

  // 4. Confession — yellowed-receipt aesthetic, blank line for the customer's
  //    name (pen tied to the wall). Wall fills with names → social proof.
  const designConfession = () => `<!doctype html><html dir="${dirAttr}" lang="${langAttr}"><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: A4 portrait; margin: 0; }
    html,body{height:100%;}
    body{margin:0;font-family:Cairo,sans-serif;background:#f4ecd8;color:#1a1a1a;width:210mm;height:297mm;padding:24mm 18mm;background-image:repeating-linear-gradient(0deg,transparent 0 9.5mm,rgba(0,0,0,.04) 9.5mm 10mm);position:relative;box-sizing:border-box;overflow:hidden;}
    .stamp{position:absolute;top:12mm;${isAr ? 'right' : 'left'}:12mm;border:1mm solid ${color};color:${color};padding:2mm 5mm;transform:rotate(${isAr ? '12' : '-12'}deg);font-weight:900;font-size:11pt;letter-spacing:1px;text-transform:uppercase;background:#f4ecd8;}
    h1{font-size:36pt;margin:14mm 0 6mm;font-weight:900;letter-spacing:-.5px;}
    .line{font-size:16pt;line-height:1.9;margin:0 0 3mm;word-wrap:break-word;}
    .blank{display:inline-block;border-bottom:1mm dashed #333;height:8mm;width:90mm;vertical-align:bottom;margin:0 2mm;}
    .qr-wrap{text-align:center;margin-top:8mm;}
    .qr-wrap img{width:60mm;height:60mm;border:2mm solid #fff;box-shadow:0 0 0 .8mm ${color},0 4mm 10mm rgba(0,0,0,.18);}
    @media print { -webkit-print-color-adjust: exact; print-color-adjust: exact; body { background: #f4ecd8 !important; } }
    </style></head><body>
    <div class="stamp">${program.name}</div>
    <h1>${txt.confession}</h1>
    <p class="line">${txt.cMyName} <span class="blank"></span></p>
    <p class="line">${txt.cVisit}</p>
    <p class="line">${txt.cNever}</p>
    <p class="line" style="margin-top:6mm">${txt.cFix}</p>
    <div class="qr-wrap"><img src="${buildQrSrc('confession', 'plain')}" alt="QR"/></div>
    </body></html>`

  // 5. Receipt sticker — A7 (74×105mm). Stick on receipts, cup sleeves,
  //    napkin holders, table corners.
  const designReceipt = () => `<!doctype html><html dir="${dirAttr}" lang="${langAttr}"><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: 74mm 105mm; margin: 0; }
    html,body{height:100%;}
    body{margin:0;font-family:Cairo,sans-serif;background:${color};color:${text};width:74mm;height:105mm;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6mm;box-sizing:border-box;text-align:center;overflow:hidden;}
    h1{font-size:13pt;margin:0 0 2mm;font-weight:900;letter-spacing:-.3px;word-wrap:break-word;max-width:100%;}
    .hook{font-size:11pt;font-weight:800;margin:0 0 4mm;line-height:1.3;word-wrap:break-word;}
    .qr{background:#fff;padding:2mm;border-radius:3mm;display:inline-block;}
    .qr img{display:block;width:42mm;height:42mm;}
    .cta{margin-top:4mm;font-size:13pt;font-weight:900;letter-spacing:.5px;}
    @media print { body { background: ${color} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
    <h1>${program.name}</h1>
    <p class="hook">${rewardEmoji} ${hookReward}</p>
    <div class="qr"><img src="${buildQrSrc('receipt', 'plain')}" alt="QR"/></div>
    <p class="cta">${txt.scanArrow}</p>
    </body></html>`

  // 6. Story — 9:16 vertical card sized for Snap / Instagram / WhatsApp
  //    story screenshots. Owner saves as PDF, screenshots one page, posts.
  const designStory = () => `<!doctype html><html dir="${dirAttr}" lang="${langAttr}"><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: 108mm 192mm; margin: 0; }
    html,body{height:100%;}
    body{margin:0;font-family:Cairo,sans-serif;background:linear-gradient(160deg, ${color} 0%, ${color}cc 100%);color:${text};width:108mm;height:192mm;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:14mm 10mm;box-sizing:border-box;text-align:center;overflow:hidden;}
    .top{display:flex;flex-direction:column;align-items:center;gap:5mm;}
    .badge{background:rgba(255,255,255,.18);border:.3mm solid rgba(255,255,255,.35);padding:1.5mm 4mm;border-radius:999px;font-size:9pt;font-weight:700;letter-spacing:1px;text-transform:uppercase;max-width:80mm;word-wrap:break-word;}
    h1{font-size:22pt;margin:0;font-weight:900;line-height:1.1;letter-spacing:-.5px;}
    .reward{font-size:26pt;font-weight:900;line-height:1.1;margin:0;word-wrap:break-word;max-width:90mm;}
    .qr{background:#fff;padding:3mm;border-radius:5mm;}
    .qr img{display:block;width:50mm;height:50mm;}
    .cta{font-size:12pt;font-weight:800;opacity:.95;}
    @media print { body { background: ${color} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
    <div class="top">
      <span class="badge">${program.name}</span>
      <h1>${rewardEmoji}</h1>
      <p class="reward">${hookReward}</p>
    </div>
    <div class="qr"><img src="${buildQrSrc('story', 'plain')}" alt="QR"/></div>
    <p class="cta">${txt.scanJoin}</p>
    </body></html>`

  // 7. WANTED poster — Old West bounty aesthetic. Customer is the wanted
  //    criminal. Funny → photographed → shared. The empty face frame
  //    invites doodling, taping a polaroid, or just laughing — all of
  //    which → attention → scan.
  const designWanted = () => `<!doctype html><html dir="${dirAttr}" lang="${langAttr}"><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: A4 portrait; margin: 0; }
    html,body{height:100%;}
    body{margin:0;font-family:'Cairo',serif;background:#e8d8b0;color:#2a1a0a;width:210mm;height:297mm;padding:18mm;box-sizing:border-box;overflow:hidden;text-align:center;background-image:radial-gradient(circle at 20% 30%, rgba(120,80,30,.08) 0, transparent 50mm),radial-gradient(circle at 80% 70%, rgba(120,80,30,.1) 0, transparent 60mm);}
    .border{border:2mm solid #2a1a0a;border-radius:2mm;padding:10mm 8mm;height:calc(297mm - 36mm - 4mm);box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;}
    h1{font-size:64pt;margin:0 0 2mm;font-weight:900;letter-spacing:6px;line-height:1;}
    .reason{font-size:13pt;font-weight:800;letter-spacing:2px;margin:0 0 4mm;text-transform:uppercase;border-top:.6mm solid #2a1a0a;border-bottom:.6mm solid #2a1a0a;padding:2mm 0;}
    .face{width:80mm;height:80mm;margin:0 auto;border:1.5mm dashed #2a1a0a;display:flex;align-items:center;justify-content:center;font-size:11pt;font-weight:700;color:#5a4020;letter-spacing:2px;background:rgba(255,255,255,.15);}
    .bounty{margin:6mm 0 2mm;font-size:14pt;font-weight:800;letter-spacing:2px;}
    .bounty-amt{font-size:24pt;font-weight:900;color:${color};margin:0;line-height:1.1;word-wrap:break-word;}
    .seen{font-size:10pt;letter-spacing:1.5px;margin:4mm 0 0;font-weight:700;text-transform:uppercase;opacity:.85;}
    .seen-name{font-size:14pt;font-weight:900;margin-top:1mm;}
    .qr-row{display:flex;align-items:center;justify-content:center;gap:8mm;margin-top:6mm;}
    .qr-row img{width:42mm;height:42mm;background:#fff;padding:2mm;border:.6mm solid #2a1a0a;}
    .turn-in{font-size:18pt;font-weight:900;letter-spacing:1px;}
    @media print { body { background: #e8d8b0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
    <div class="border">
      <div>
        <h1>${txt.wanted}</h1>
        <p class="reason">${txt.wReason}</p>
        <div class="face">${txt.wFace}</div>
        <p class="bounty">${txt.wBounty}</p>
        <p class="bounty-amt">${hookReward} ${rewardEmoji}</p>
      </div>
      <div>
        <p class="seen">${txt.wLastSeen}</p>
        <p class="seen-name">${program.name}</p>
        <div class="qr-row">
          <img src="${buildQrSrc('wanted', 'plain')}" alt="QR"/>
          <div class="turn-in">${txt.wTurnIn}</div>
        </div>
      </div>
    </div>
    </body></html>`

  // 8. Tear-off tabs flyer — community-board style. 3 generous tabs at the
  //    bottom that customers physically tear off and pocket. Each torn tab
  //    is visible social proof on the wall ("look how many people grabbed
  //    one"). Each pocketed tab is a 24h reminder to scan when home.
  const designTearOff = () => `<!doctype html><html dir="${dirAttr}" lang="${langAttr}"><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: A4 portrait; margin: 0; }
    html,body{height:100%;}
    body{margin:0;font-family:Cairo,Inter,sans-serif;background:#fff;color:#111;width:210mm;height:297mm;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;}
    .top{flex:1;background:${color};color:${text};padding:20mm 14mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border-bottom:2mm dashed #888;}
    .store{font-size:14pt;font-weight:700;opacity:.85;margin:0 0 4mm;letter-spacing:1px;text-transform:uppercase;}
    .top h1{font-size:42pt;margin:0 0 8mm;font-weight:900;letter-spacing:-.5px;line-height:1.1;word-wrap:break-word;}
    .top .qr{background:#fff;padding:5mm;border-radius:5mm;}
    .top .qr img{display:block;width:55mm;height:55mm;}
    .top .hint{margin-top:6mm;font-size:11pt;font-weight:700;opacity:.92;}
    .strips{display:flex;height:75mm;}
    .strip{flex:1;border-${isAr ? 'left' : 'right'}:1mm dashed #888;padding:6mm 4mm;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3mm;}
    .strip:last-child{border:none;}
    .strip .mini-store{font-size:8pt;font-weight:700;opacity:.6;text-transform:uppercase;letter-spacing:.5px;margin:0;}
    .strip .mini-reward{font-size:11pt;font-weight:800;color:${color};margin:0;line-height:1.2;word-wrap:break-word;}
    .strip .mini-qr{background:#fff;padding:1mm;border:.4mm solid #ddd;}
    .strip .mini-qr img{display:block;width:32mm;height:32mm;}
    .strip .mini-cta{font-size:9pt;font-weight:700;color:#444;margin:0;}
    @media print { body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
    <div class="top">
      <p class="store">${program.name}</p>
      <h1>${hookReward} ${rewardEmoji}</h1>
      <div class="qr"><img src="${buildQrSrc('tearoff', 'plain')}" alt="QR"/></div>
      <p class="hint">${txt.tabHint}</p>
    </div>
    <div class="strips">
      ${[0,1,2].map(() => `<div class="strip">
        <p class="mini-store">${program.name}</p>
        <p class="mini-reward">${rewardEmoji} ${hookReward}</p>
        <div class="mini-qr"><img src="${buildQrSrc('tearoff-tab', 'plain')}" alt="QR"/></div>
        <p class="mini-cta">${txt.scanArrow}</p>
      </div>`).join('')}
    </div>
    </body></html>`

  // 9. Receipt of regret — long thermal-receipt aesthetic listing the same
  //    item over and over with "could have been free" math at the bottom.
  //    Cringe humor that does the math FOR the customer. Highest impact when
  //    the merchant tapes it next to the actual cash register.
  const designReceiptRegret = () => `<!doctype html><html dir="${dirAttr}" lang="${langAttr}"><head><meta charset="utf-8"><title>${program.name}</title>
    <style>${baseFonts}
    @page { size: A4 portrait; margin: 0; }
    html,body{height:100%;}
    body{margin:0;font-family:Cairo,Inter,sans-serif;background:#ddd;color:#111;width:210mm;height:297mm;padding:18mm 0;box-sizing:border-box;overflow:hidden;display:flex;align-items:center;justify-content:center;}
    .receipt{width:96mm;background:#fafaf6;padding:8mm 6mm;font-family:'Courier New','Courier',monospace;font-size:10pt;line-height:1.5;color:#222;box-shadow:0 4mm 18mm rgba(0,0,0,.18);position:relative;}
    .receipt::before, .receipt::after{content:"";position:absolute;left:0;right:0;height:4mm;background:linear-gradient(135deg, transparent 33%, #fafaf6 33% 66%, transparent 66%) 0 0/8mm 4mm repeat-x;}
    .receipt::before{top:-4mm;transform:rotate(180deg);}
    .receipt::after{bottom:-4mm;}
    .r-store{text-align:center;font-size:13pt;font-weight:900;margin:0 0 1mm;letter-spacing:.5px;}
    .r-meta{text-align:center;font-size:8pt;opacity:.75;margin:0 0 4mm;}
    .r-line{display:flex;justify-content:space-between;border-bottom:.3mm dashed #999;padding:1.2mm 0;font-size:9pt;}
    .r-line .item{flex:1;}
    .r-line .price{font-weight:700;}
    .r-sep{border-top:.6mm solid #222;margin:3mm 0;}
    .r-total{display:flex;justify-content:space-between;font-weight:900;font-size:11pt;}
    .r-regret{margin:4mm 0 2mm;text-align:center;font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;}
    .r-regret-num{text-align:center;font-size:32pt;font-weight:900;color:${color};margin:0;line-height:1;}
    .r-stop{margin:5mm 0 3mm;text-align:center;font-size:18pt;font-weight:900;letter-spacing:1px;color:${color};}
    .r-qr{text-align:center;margin:3mm 0;}
    .r-qr img{width:42mm;height:42mm;background:#fff;padding:2mm;border:.4mm solid #222;}
    .r-thanks{text-align:center;font-size:8pt;margin-top:4mm;letter-spacing:1px;opacity:.7;}
    @media print { body { background: #ddd !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
    <div class="receipt">
      <p class="r-store">${program.name}</p>
      <p class="r-meta">${txt.rDate} ${new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB')}</p>
      ${[1,2,3,4,5,6,7].map((n) => `<div class="r-line"><span class="item">${n}× ${txt.rItem}</span><span class="price">— SAR</span></div>`).join('')}
      <div class="r-sep"></div>
      <div class="r-total"><span>${txt.rSubtotal}</span><span>×7</span></div>
      <p class="r-regret">${txt.rRegret}</p>
      <p class="r-regret-num">7 ${rewardEmoji}</p>
      <p class="r-stop">${txt.rStop} →</p>
      <div class="r-qr"><img src="${buildQrSrc('receipt-regret', 'plain')}" alt="QR"/></div>
      <p class="r-thanks">${txt.rThanks}</p>
    </div>
    </body></html>`

  // Posters are split into safe defaults + bold/experimental.
  // The bold ones convert higher in our analytics but feel risky to merchants
  // who haven't seen the data yet — so we group them visibly under "Bold".
  const posters = [
    { key: 'bold',       group: 'classic', label: T('Direct',       'مباشر'),         build: designBold,       sub: T('Reward → QR → arrow. No fluff.', 'المكافأة → الرمز → سهم. بدون حشو.') },
    { key: 'minimal',    group: 'classic', label: T('Minimal',      'بسيط'),          build: designMinimal,    sub: T('White, professional, 3 short steps.', 'أبيض، احترافي، ٣ خطوات قصيرة.') },
    { key: 'tent',       group: 'classic', label: T('Table tent',   'عرض طاولة'),     build: designTableTent,  sub: T('Folds in half — sits on every table.', 'يطوى — يوضع على كل طاولة.') },
    { key: 'confession', group: 'bold',    label: T('Confession',   'اعتراف'),        build: designConfession, sub: T('Yellowed receipt. Big "CONFESSION:" + blank line for the customer to write their name on.', 'فاتورة مصفرّة. "اعتراف:" كبير + سطر فاضي يكتب فيه العميل اسمه.') },
    { key: 'wanted',     group: 'bold',    label: T('WANTED',       'مطلوب'),         build: designWanted,     sub: T('Old-West bounty. Customer is the wanted criminal. Photo-worthy → shared.', 'إعلان مطلوب على الطريقة الغربية. العميل هو المجرم. يستحق التصوير → ينتشر.') },
    { key: 'tearoff',    group: 'bold',    label: T('Tear-off tabs', 'قسائم قابلة للتمزيق'), build: designTearOff, sub: T('3 tabs at bottom. Customer tears one and pockets it — 24h reminder to scan.', '٣ قسائم بالأسفل. يأخذ العميل واحدة معه — تذكير ٢٤ ساعة بالمسح.') },
    { key: 'regret',     group: 'bold',    label: T('Receipt of regret', 'فاتورة الندم'), build: designReceiptRegret, sub: T('Fake receipt listing the same item 7×. Does the could-have-been-free math for them.', 'فاتورة وهمية تكرر نفس الصنف ٧ مرات. تحسبها لهم بدالهم.') },
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
