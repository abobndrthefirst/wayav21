import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * NotificationsPanel — merchant-facing. v1 supports manual broadcast only;
 * other notification types appear as "Coming Soon" cards.
 *
 * Props:
 *   shopId  uuid (required)
 *   lang    'en' | 'ar'
 */
export default function NotificationsPanel({ shopId, lang = 'en' }) {
  const isAr = lang === 'ar'
  const T = (en, ar) => (isAr ? ar : en)

  const [campaigns, setCampaigns] = useState([])
  const [quota, setQuota] = useState(null)
  const [tierLimits, setTierLimits] = useState({})
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [success, setSuccess] = useState(null)
  const [sending, setSending] = useState(false)

  // Compose form
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [deepLink, setDeepLink] = useState('')
  const [audienceTier, setAudienceTier] = useState('')

  const MAX_TITLE = 80
  const MAX_BODY = 240

  const loadAll = async () => {
    if (!shopId) return
    setLoading(true); setErr(null)
    try {
      const [{ data: shopData }, { data: tiers }, { data: camps }, { data: quotas }] = await Promise.all([
        supabase.from('shops').select('id, name, notification_tier').eq('id', shopId).maybeSingle(),
        supabase.from('notification_tier_limits').select('*'),
        supabase.from('notification_campaigns').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }).limit(25),
        supabase.from('notification_quotas').select('*').eq('shop_id', shopId),
      ])
      setShop(shopData)
      setTierLimits(Object.fromEntries((tiers || []).map(t => [t.tier, t])))
      setCampaigns(camps || [])
      // Find current week / month quota
      const now = new Date()
      const wk = `${now.getUTCFullYear()}-W${String(getISOWeek(now)).padStart(2, '0')}`
      const mo = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
      const w = (quotas || []).find(q => q.scope === 'weekly'  && q.period_key === wk)
      const m = (quotas || []).find(q => q.scope === 'monthly' && q.period_key === mo)
      setQuota({
        weekly_used: w?.used_count || 0,
        monthly_used: m?.used_count || 0,
      })
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [shopId])

  const tier = shop?.notification_tier || 'free'
  const limits = tierLimits[tier] || { weekly_broadcasts: 0, monthly_broadcasts: 0 }
  const weeklyUsed = quota?.weekly_used || 0
  const monthlyUsed = quota?.monthly_used || 0
  const weeklyLeft = Math.max(0, limits.weekly_broadcasts - weeklyUsed)
  const monthlyLeft = Math.max(0, limits.monthly_broadcasts - monthlyUsed)
  const canSend = weeklyLeft > 0 && monthlyLeft > 0 && title.trim() && body.trim()

  const handleSend = async () => {
    setErr(null); setSuccess(null); setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          shop_id: shopId,
          title: title.trim(),
          body: body.trim(),
          deep_link: deepLink.trim() || undefined,
          audience_tier: audienceTier || undefined,
        }),
      })
      const json = await resp.json()
      if (!resp.ok || !json.success) {
        throw new Error(json.error || `HTTP ${resp.status}`)
      }
      setSuccess(T(
        `Sent to ${json.recipient_count} cardholders (${json.apple_targets} Apple, ${json.google_targets} Google).`,
        `تم الإرسال لـ ${json.recipient_count} عميل (${json.apple_targets} آبل، ${json.google_targets} جوجل).`
      ))
      setTitle(''); setBody(''); setDeepLink(''); setAudienceTier('')
      await loadAll()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSending(false)
    }
  }

  if (!shopId) return null

  return (
    <div className="np-panel" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Quota summary */}
      <div className="np-quota">
        <div className="np-quota-row">
          <div className="np-quota-item">
            <span className="np-quota-label">{T('Plan', 'الخطة')}</span>
            <strong className={`np-tier np-tier-${tier}`}>{tier.toUpperCase()}</strong>
          </div>
          <div className="np-quota-item">
            <span className="np-quota-label">{T('This week', 'هذا الأسبوع')}</span>
            <strong>{weeklyUsed} / {limits.weekly_broadcasts}</strong>
          </div>
          <div className="np-quota-item">
            <span className="np-quota-label">{T('This month', 'هذا الشهر')}</span>
            <strong>{monthlyUsed} / {limits.monthly_broadcasts}</strong>
          </div>
        </div>
        {!canSend && (weeklyLeft === 0 || monthlyLeft === 0) && (
          <p className="np-quota-warn">
            {T(
              `You've reached your ${weeklyLeft === 0 ? 'weekly' : 'monthly'} limit. Upgrade your plan to send more.`,
              `لقد وصلت إلى الحد ${weeklyLeft === 0 ? 'الأسبوعي' : 'الشهري'}. ارفع خطتك لإرسال المزيد.`
            )}
          </p>
        )}
      </div>

      {/* Compose */}
      <div className="np-compose">
        <h3>{T('Send a broadcast', 'إرسال رسالة')}</h3>

        <label className="np-label">
          <span>{T('Title', 'العنوان')}</span>
          <input
            type="text"
            maxLength={MAX_TITLE}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={T('Happy Hour starts at 5pm ☕', 'عرض سعيد يبدأ 5م ☕')}
          />
          <small className="np-counter">{title.length} / {MAX_TITLE}</small>
        </label>

        <label className="np-label">
          <span>{T('Message', 'الرسالة')}</span>
          <textarea
            maxLength={MAX_BODY}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={T('Double stamps on every drink tonight. Show your Waya card.', 'ضعف الختوم على كل مشروب الليلة. أظهر بطاقة وايا.')}
          />
          <small className="np-counter">{body.length} / {MAX_BODY}</small>
        </label>

        <div className="np-row">
          <label className="np-label">
            <span>{T('Link (optional)', 'رابط (اختياري)')}</span>
            <input
              type="url"
              value={deepLink}
              onChange={(e) => setDeepLink(e.target.value)}
              placeholder="https://…"
            />
          </label>
          <label className="np-label">
            <span>{T('Audience tier', 'فئة الجمهور')}</span>
            <select value={audienceTier} onChange={(e) => setAudienceTier(e.target.value)}>
              <option value="">{T('All cardholders', 'جميع حاملي البطاقات')}</option>
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
            </select>
          </label>
        </div>

        {err && <p className="np-err">{err}</p>}
        {success && <p className="np-ok">{success}</p>}

        <button
          className="np-send"
          disabled={!canSend || sending}
          onClick={handleSend}
        >
          {sending ? T('Sending…', 'جارٍ الإرسال…') : T('Send now', 'إرسال الآن')}
        </button>
      </div>

      {/* Coming soon cards */}
      <div className="np-coming">
        <h3>{T('Coming soon', 'قريباً')}</h3>
        <div className="np-coming-grid">
          <ComingSoonCard icon="🎂" title={T('Birthday auto-send', 'إرسال تلقائي للميلاد')}
            desc={T('Auto-message customers on their birthday with a custom template.', 'رسالة تلقائية لعملائك يوم ميلادهم بقالب مخصص.')} />
          <ComingSoonCard icon="📍" title={T('Near the shop', 'قرب المتجر')}
            desc={T('Pop up on lock-screen when a customer is within 100m of your shop.', 'تظهر على شاشة القفل عندما يقترب العميل 100 متر من متجرك.')} />
          <ComingSoonCard icon="🔄" title={T('Win-back', 'استعادة العملاء')}
            desc={T('Auto-send to customers who haven’t visited in 30 days.', 'إرسال تلقائي للعملاء الذين لم يزوروا منذ 30 يوماً.')} />
          <ComingSoonCard icon="🎁" title={T('Redemption confirmation', 'تأكيد الاسترداد')}
            desc={T('Auto-thank customers when they redeem a reward.', 'شكر تلقائي للعملاء عند استرداد مكافأة.')} />
        </div>
      </div>

      {/* History */}
      <div className="np-history">
        <h3>{T('Recent sends', 'الإرسالات الأخيرة')}</h3>
        {loading && <p className="np-muted">{T('Loading…', 'جارٍ التحميل…')}</p>}
        {!loading && campaigns.length === 0 && (
          <p className="np-muted">{T('No broadcasts yet.', 'لا توجد رسائل حتى الآن.')}</p>
        )}
        {!loading && campaigns.length > 0 && (
          <ul className="np-history-list">
            {campaigns.map(c => (
              <li key={c.id} className={`np-h np-h-${c.status}`}>
                <div className="np-h-head">
                  <strong>{c.title}</strong>
                  <span className="np-h-meta">
                    {new Date(c.created_at).toLocaleString(isAr ? 'ar' : 'en')}
                  </span>
                </div>
                <div className="np-h-body">{c.body}</div>
                <div className="np-h-foot">
                  <span className={`np-badge np-badge-${c.status}`}>{c.status}</span>
                  <span className="np-muted">
                    {T(`${c.recipient_count} recipients`, `${c.recipient_count} مستلم`)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ComingSoonCard({ icon, title, desc }) {
  return (
    <div className="np-cs-card">
      <div className="np-cs-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{desc}</p>
      <span className="np-cs-tag">Coming soon</span>
    </div>
  )
}

// ISO week number (Mon-based)
function getISOWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil((((t - yearStart) / 86400000) + 1) / 7)
}
