import { useState, useEffect, useCallback } from 'react'
// eslint-disable-next-line no-unused-vars -- `motion` is referenced via JSX as <motion.div>; the lint rule misses that for this rename pattern.
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import { supabase } from '../../lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const STYLE_PRESETS = [
  { key: 'hellokitty', en: 'Hello Kitty',  ar: 'هيلو كيتي' },
  { key: 'cyberpunk',  en: 'Cyberpunk',    ar: 'سايبربانك' },
  { key: 'witcher',    en: 'The Witcher',  ar: 'ذا ويتشر' },
  { key: 'anime',      en: 'Anime',        ar: 'أنمي' },
  { key: 'retrowave',  en: 'Retro Wave',   ar: 'ريترو ويف' },
  { key: 'studioghibli', en: 'Ghibli',     ar: 'غيبلي' },
  { key: 'minimal',    en: 'Minimal',      ar: 'بسيط' },
  { key: 'revolut',    en: 'Revolut Glass', ar: 'ريفولوت' },
]

// Minimalistic card preview — just the AI background, holder name, brand logo
// in the corner (Mastercard-style), and a QR code. No stamp counter, no
// reward labels, no progress dots. Matches the "premium credit card" aesthetic
// the admin asked for.
function MinimalCardPreview({ backgroundUrl, textColor, holderName, T }) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  useEffect(() => {
    QRCode.toDataURL('https://trywaya.com', { margin: 1, width: 200, color: { dark: '#111111', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''))
  }, [])

  const isDarkText = (textColor || '#ffffff').toLowerCase().startsWith('#f') ||
                     (textColor || '#ffffff').toLowerCase() === '#ffffff' ||
                     (textColor || '').toLowerCase() === '#fff'
  // Subtle gradient scrim so name/logo stay readable regardless of the AI image.
  const scrim = isDarkText
    ? 'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 65%, rgba(0,0,0,.45) 100%)'
    : 'linear-gradient(to bottom, rgba(255,255,255,.30) 0%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 65%, rgba(255,255,255,.40) 100%)'

  const fallbackBg = 'linear-gradient(135deg, #1a1a2e, #2d2d4f)'
  return (
    <div style={{
      width: 380,
      maxWidth: '100%',
      aspectRatio: '1.586',
      borderRadius: 18,
      backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : fallbackBg,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
      overflow: 'hidden',
      color: textColor || '#ffffff',
      boxShadow: '0 12px 32px rgba(0,0,0,.18)',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: scrim, pointerEvents: 'none' }} />

      {/* top row: holder name + corner logo */}
      <div style={{
        position: 'absolute', top: 16, insetInlineStart: 16, insetInlineEnd: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.4, textShadow: '0 1px 2px rgba(0,0,0,.2)' }}>
          {holderName || T('Card Holder', 'حامل البطاقة')}
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 9,
          background: 'rgba(255,255,255,.95)', color: '#111',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,.15)',
        }}>W</div>
      </div>

      {/* QR centered at bottom */}
      <div style={{
        position: 'absolute', bottom: 14, insetInlineStart: 0, insetInlineEnd: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ background: '#ffffff', padding: 5, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.18)' }}>
          {qrDataUrl
            ? <img src={qrDataUrl} alt="QR" style={{ width: 64, height: 64, display: 'block' }} />
            : <div style={{ width: 64, height: 64, background: '#f3f4f6' }} />
          }
        </div>
      </div>
    </div>
  )
}

function base64ToBlob(b64, mimeType) {
  const bin = atob(b64)
  const len = bin.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

export default function AdminDesignStudioPage({ lang = 'en', onBack }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)

  const [authChecking, setAuthChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminEmail, setAdminEmail] = useState(null)

  // Auth + admin gate. Mirrors useIsPlatformAdmin without depending on App.jsx.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) { setIsAdmin(false); setAuthChecking(false); return }
      setAdminEmail(user.email || null)
      const { data, error } = await supabase.rpc('is_platform_admin')
      if (cancelled) return
      setIsAdmin(!error && data === true)
      setAuthChecking(false)
    })()
    return () => { cancelled = true }
  }, [])

  const [prompt, setPrompt] = useState('')
  const [stylePreset, setStylePreset] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(null)

  // Latest generated result (theme + image dataUrl + suggestedName)
  const [draft, setDraft] = useState(null)
  const [draftName, setDraftName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [toast, setToast] = useState(null)
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000) }

  // Saved templates
  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    const { data, error } = await supabase
      .from('card_templates')
      .select('*')
      .order('created_at', { ascending: false })
    setTemplates(error ? [] : (data || []))
    setTemplatesLoading(false)
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    loadTemplates()
  }, [isAdmin, loadTemplates])

  const handleGenerate = async () => {
    setGenError(null)
    if (!prompt.trim()) { setGenError(T('Prompt is required', 'الوصف مطلوب')); return }
    setGenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error(T('Not signed in', 'لم تسجل دخولك'))
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-design-studio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ prompt: prompt.trim(), stylePreset: stylePreset || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
      const dataUrl = json.imageBase64
        ? `data:${json.imageMimeType || 'image/png'};base64,${json.imageBase64}`
        : null
      setDraft({
        theme: json.theme,
        imageBase64: json.imageBase64 || null,
        imageMimeType: json.imageMimeType || 'image/png',
        imageDataUrl: dataUrl,
        prompt: prompt.trim(),
        stylePreset: stylePreset || null,
      })
      setDraftName(json.suggestedName || '')
    } catch (e) {
      setGenError(e?.message || String(e))
      setDraft(null)
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!draft) return
    if (!draftName.trim()) { setSaveError(T('Name is required', 'الاسم مطلوب')); return }
    setSaving(true); setSaveError(null)
    try {
      let backgroundUrl = null
      let previewUrl = null
      if (draft.imageBase64) {
        const blob = base64ToBlob(draft.imageBase64, draft.imageMimeType)
        const ext = draft.imageMimeType.split('/')[1] || 'png'
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('template-assets')
          .upload(fileName, blob, { contentType: draft.imageMimeType, upsert: false })
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage
          .from('template-assets')
          .getPublicUrl(fileName)
        backgroundUrl = publicUrl
        previewUrl = publicUrl
      }

      const { error: insErr } = await supabase.from('card_templates').insert({
        name:             draftName.trim().slice(0, 60),
        prompt:           draft.prompt,
        theme:            draft.theme,
        background_url:   backgroundUrl,
        preview_url:      previewUrl,
        is_published:     false,
        created_by_email: adminEmail,
      })
      if (insErr) throw insErr

      showToast(T('Template saved', 'تم حفظ القالب'))
      setDraft(null); setDraftName(''); setPrompt('')
      loadTemplates()
    } catch (e) {
      setSaveError(e?.message || String(e))
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (row) => {
    const { error } = await supabase
      .from('card_templates')
      .update({ is_published: !row.is_published })
      .eq('id', row.id)
    if (error) showToast(error.message)
    else loadTemplates()
  }

  const deleteTemplate = async (row) => {
    if (!window.confirm(T(`Delete "${row.name}"?`, `حذف "${row.name}"؟`))) return
    const { error } = await supabase.from('card_templates').delete().eq('id', row.id)
    if (error) { showToast(error.message); return }
    loadTemplates()
  }

  // ─── Render ───────────────────────────────────────────────────────────

  if (authChecking) {
    return <div className="auth-page" style={{ padding: 60, textAlign: 'center' }}>
      {T('Loading…', 'جاري التحميل…')}
    </div>
  }
  if (!isAdmin) {
    return (
      <div className="auth-page" style={{ padding: 40, textAlign: 'center' }}>
        <h2>{T('Not authorized', 'غير مصرّح')}</h2>
        <p style={{ color: 'var(--muted)' }}>
          {T('This page is for admins only.', 'هذه الصفحة للمسؤولين فقط.')}
        </p>
      </div>
    )
  }

  const previewBg = draft?.imageDataUrl || null
  const previewTextColor = draft?.theme?.text_color || '#ffffff'

  return (
    <div className="ads-page" dir={isAr ? 'rtl' : 'ltr'} style={{ padding: '24px 16px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>
          {T('Design Studio', 'استوديو التصميم')}
          <span style={{ fontSize: 13, color: 'var(--muted)', marginInlineStart: 12 }}>
            {T('Admin · AI-powered card aesthetics', 'مسؤول · تصاميم ذكية للبطاقات')}
          </span>
        </h1>
        {onBack && (
          <button className="btn-secondary" onClick={onBack}>
            {T('Back', 'رجوع')}
          </button>
        )}
      </div>

      {/* Prompt card — always visible, full-width, explicit colors so it can't disappear behind a missing CSS variable. */}
      <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e5e7eb', marginBottom: 24, color: '#111827' }}>
        <label style={{ display: 'block', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {T('Style preset', 'نمط جاهز')}
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 16 }}>
          {STYLE_PRESETS.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => setStylePreset(stylePreset === p.key ? '' : p.key)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: '1px solid ' + (stylePreset === p.key ? '#2563eb' : '#e5e7eb'),
                background: stylePreset === p.key ? '#2563eb' : '#ffffff',
                color: stylePreset === p.key ? '#ffffff' : '#111827',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {isAr ? p.ar : p.en}
            </button>
          ))}
        </div>

        <label htmlFor="ads-prompt" style={{ display: 'block', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {T('Prompt', 'الوصف')}
        </label>
        <textarea
          id="ads-prompt"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={5}
          maxLength={600}
          placeholder={T(
            'e.g. Hello Kitty pastel pink café · Cyberpunk neon Tokyo street · The Witcher dark forest with wolves. Just describe the vibe.',
            'مثلاً: هيلو كيتي وردي · شارع طوكيو سايبربانك · غابة ذا ويتشر مع الذئاب. اوصف الجو فقط.'
          )}
          style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            marginTop: 8,
            padding: 12,
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            color: '#111827',
            fontSize: 14,
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#6b7280', marginTop: 4 }}>
          <span>{prompt.length}/600</span>
          <span>{T('Powered by Google Gemini · free tier', 'بدعم من جيميني · النسخة المجانية')}</span>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          style={{
            display: 'block',
            marginTop: 16,
            width: '100%',
            padding: '14px 16px',
            borderRadius: 10,
            border: 'none',
            background: generating || !prompt.trim() ? '#9ca3af' : '#2563eb',
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 700,
            cursor: generating || !prompt.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {generating ? T('Generating…', 'جاري التوليد…') : T('✨ Generate Design', '✨ توليد التصميم')}
        </button>

        {genError && (
          <div style={{ marginTop: 12, padding: 10, background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: 13 }}>
            {genError}
          </div>
        )}
      </div>

      {/* Preview + save controls — only render once we have a generated draft, so a broken preview can never hide the prompt. */}
      {draft && (
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e5e7eb', marginBottom: 32, color: '#111827' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <MinimalCardPreview
              backgroundUrl={previewBg}
              textColor={previewTextColor}
              holderName={draftName || T('Card Holder', 'حامل البطاقة')}
              T={T}
            />
          </div>

          <div style={{ paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{T('Palette', 'الألوان')}:</span>
              {[draft.theme.card_color, draft.theme.gradient.from, draft.theme.gradient.to, draft.theme.accent, draft.theme.text_color].map((c, i) => (
                <span key={i} title={c} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,.08)', display: 'inline-block' }} />
              ))}
            </div>
            <input
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              maxLength={60}
              placeholder={T('Template name', 'اسم القالب')}
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                padding: 10,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                color: '#111827',
                fontSize: 14,
                marginBottom: 8,
              }}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !draftName.trim()}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #2563eb',
                background: '#ffffff',
                color: '#2563eb',
                fontSize: 14,
                fontWeight: 600,
                cursor: saving || !draftName.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? T('Saving…', 'جاري الحفظ…') : T('Save Template', 'حفظ القالب')}
            </button>
            {saveError && (
              <div style={{ marginTop: 8, padding: 8, background: '#fee2e2', color: '#991b1b', borderRadius: 6, fontSize: 12 }}>
                {saveError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gallery */}
      <div>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>
          {T('Saved templates', 'القوالب المحفوظة')}
          <span style={{ fontSize: 13, color: 'var(--muted)', marginInlineStart: 8, fontWeight: 400 }}>
            {templates.length} {T('total', 'الإجمالي')}
          </span>
        </h2>
        {templatesLoading && <div style={{ color: 'var(--muted)' }}>{T('Loading…', 'جاري التحميل…')}</div>}
        {!templatesLoading && templates.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', border: '1px dashed var(--border, #e5e7eb)', borderRadius: 12 }}>
            {T('No templates yet. Generate and save your first one above.',
               'لا توجد قوالب بعد. ابدأ بإنشاء أول قالب من الأعلى.')}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {templates.map(row => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'var(--surface, #fff)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: 100,
                  background: row.preview_url
                    ? `url(${row.preview_url}) center/cover`
                    : `linear-gradient(${row.theme?.gradient?.angle ?? 135}deg, ${row.theme?.gradient?.from || row.theme?.card_color}, ${row.theme?.gradient?.to || row.theme?.card_color})`,
                }}
              />
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{row.name}</div>
                {row.prompt && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {row.prompt}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => togglePublish(row)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid ' + (row.is_published ? '#10b981' : 'var(--border, #e5e7eb)'),
                      background: row.is_published ? '#10b981' : 'transparent',
                      color: row.is_published ? '#fff' : 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    {row.is_published
                      ? T('Published', 'منشور')
                      : T('Publish', 'نشر')}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTemplate(row)}
                    aria-label={T('Delete', 'حذف')}
                    style={{
                      padding: '6px 10px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid var(--border, #e5e7eb)',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          insetInlineStart: '50%',
          transform: 'translateX(-50%)',
          background: '#111827',
          color: '#fff',
          padding: '10px 16px',
          borderRadius: 8,
          fontSize: 13,
          boxShadow: '0 8px 24px rgba(0,0,0,.18)',
          zIndex: 1000,
        }}>{toast}</div>
      )}
    </div>
  )
}
