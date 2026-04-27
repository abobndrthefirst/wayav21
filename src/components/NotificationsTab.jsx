// NotificationsTab — admin-only Notifications service page.
// Faithful port of the mockup (Waya Notification App.jsx + Waya Notification.html):
// Welcome banner, quota strip, Location service card, Instant service card,
// recent-notifications history table, sticky save bar.
//
// Self-contained styling: defines its own CSS custom properties scoped under
// `.notif-tab` for both dark and light themes so inline `var(--bg-elev)` etc.
// resolve without depending on tokens elsewhere in the app's stylesheet.

import { useState, useEffect } from 'react'

/* ─── Translations ─── */
const T = {
  ar: {
    welcome: {
      eyebrow: 'خدمة جديدة',
      title: 'مرحباً بك في الإشعارات',
      sub: 'ذكّر عملاءك بطريقتك. وايا يرسل الإشعار في اللحظة الصح — لما يكون قريب، أو لما يجمع ختم، أو لما يستلم مكافأة.',
      meta: ['بدون كود', 'يشتغل مع كل بطاقات الولاء', 'مجاني خلال التجربة'],
    },
    quota: {
      tier: 'الباقة الحالية', tierName: 'الأساسية',
      sent: 'مُرسل هذا الشهر', remaining: 'متبقي', reach: 'الوصول المتوقع',
      upgrade: 'ترقية الباقة',
    },
    location: {
      title: 'الإشعارات حسب الموقع',
      sub: 'لما العميل يكون قريب من فرعك، يوصله إشعار يذكّره يمر عليك.',
      tag: 'يعتمد على Apple Wallet & Google Wallet',
      radius: 'مدى التنبيه',
      meters: 'متر',
      branches: 'الفروع المفعّلة',
      activeWindow: 'وقت الإرسال',
      windows: ['طول اليوم', 'وقت العمل', 'مخصص'],
      messageLabel: 'نص الإشعار',
      messagePh: 'مثلاً: قهوتك المفضّلة بانتظارك ☕ — أنت قريب من المتجر',
      preview: 'معاينة على الجوال',
      hint: 'يظهر للعميل لما يكون داخل المدى — مرة كل 4 ساعات كحد أقصى.',
      tipTitle: 'نصيحة',
      tip: 'إشعارات الموقع تشتغل بدون أن يفتح العميل أي تطبيق — تظهر مباشرة على شاشة القفل.',
    },
    instant: {
      title: 'الإشعارات الفورية',
      sub: 'إشعار يوصل العميل في نفس اللحظة — بعد جمع ختم، استلام مكافأة، أو حسب الحدث اللي تختاره.',
      triggers: 'المحفّزات',
      tStamp: { name: 'عند إضافة ختم جديد', desc: 'يوصل العميل إشعار بعدد الأختام المتبقية لمكافأته.' },
      tRedeem: { name: 'عند استبدال نقاط', desc: 'تأكيد فوري للعميل بعد ما يستلم مكافأته.' },
      tWelcome: { name: 'عند التسجيل لأول مرة', desc: 'رسالة ترحيب فور إضافة البطاقة للمحفظة.' },
      tInactive: { name: 'بعد غياب 14 يوم', desc: 'إشعار تذكيري للعملاء اللي ما رجعوا.' },
      messageLabel: 'الرسالة المخصّصة',
      placeholders: 'مفاتيح متاحة',
      vars: ['{اسم_العميل}', '{عدد_الأختام}', '{المكافأة}', '{اسم_المتجر}'],
      sample: {
        stamp: 'يا {اسم_العميل}، باقي {عدد_الأختام} أختام بس وقهوتك المجانية وصلت! ☕',
        redeem: 'مبروك {اسم_العميل}! استلمت {المكافأة} من {اسم_المتجر}. نراك قريباً 💚',
        welcome: 'أهلاً {اسم_العميل}! بطاقتك جاهزة. زورنا واجمع أول ختم.',
        inactive: 'وحشتنا يا {اسم_العميل} — قهوتك بانتظارك في {اسم_المتجر}.',
      },
      sendTime: 'وقت الإرسال',
      sendNow: 'فوري',
      sendDelay: 'بعد {n} دقيقة',
      testBtn: 'إرسال إشعار تجريبي',
      preview: 'معاينة',
      mostUsed: 'الأكثر استخداماً',
    },
    history: {
      title: 'آخر الإشعارات المرسلة',
      empty: 'ما في إشعارات بعد — فعّل أحد المحفّزات وابدأ.',
      seeAll: 'عرض الكل',
      cols: ['النوع', 'الرسالة', 'الوصول', 'النقر', 'الوقت'],
    },
    cta: { save: 'حفظ التغييرات', saved: 'تم الحفظ ✓', saving: 'جاري الحفظ...' },
    bar: { unsaved: 'تعديلات لم تُحفظ', saved: 'كل التغييرات محفوظة' },
    sentLabel: 'الآن',
    appName: 'محفظة',
    branchA: 'فرع الملقا', branchB: 'فرع النخيل', branchC: 'فرع جدة',
    cityRiyadh: 'الرياض', cityJeddah: 'جدة',
  },
  en: {
    welcome: {
      eyebrow: 'New service',
      title: 'Welcome to Notifications',
      sub: 'Remind your customers your way. Waya delivers the right message at the right moment — when they walk by, earn a stamp, or redeem a reward.',
      meta: ['No code needed', 'Works with every loyalty card', 'Free during trial'],
    },
    quota: {
      tier: 'Current plan', tierName: 'Basic',
      sent: 'Sent this month', remaining: 'Remaining', reach: 'Expected reach',
      upgrade: 'Upgrade plan',
    },
    location: {
      title: 'Location Notifications',
      sub: 'When a customer is near your branch, they get a nudge to drop in.',
      tag: 'Powered by Apple Wallet & Google Wallet',
      radius: 'Trigger radius',
      meters: 'meters',
      branches: 'Active branches',
      activeWindow: 'Sending hours',
      windows: ['All day', 'Business hours', 'Custom'],
      messageLabel: 'Notification copy',
      messagePh: 'e.g. Your favorite coffee is waiting ☕ — you’re near the store',
      preview: 'Phone preview',
      hint: 'Shown when the customer is inside the radius — at most once every 4 hours.',
      tipTitle: 'Tip',
      tip: 'Location alerts surface on the lock screen — your customer never has to open an app.',
    },
    instant: {
      title: 'Instant Notifications',
      sub: 'Reach the customer in the moment — after a stamp, a redemption, or any event you choose.',
      triggers: 'Triggers',
      tStamp: { name: 'New stamp added', desc: 'Tell the customer how many stamps until their reward.' },
      tRedeem: { name: 'Reward redeemed', desc: 'Instant confirmation right after they claim a reward.' },
      tWelcome: { name: 'First sign-up', desc: 'Welcome message the moment the card is added.' },
      tInactive: { name: 'After 14 days inactive', desc: 'Win-back nudge for customers who haven’t returned.' },
      messageLabel: 'Custom message',
      placeholders: 'Available variables',
      vars: ['{customer_name}', '{stamps_left}', '{reward}', '{shop_name}'],
      sample: {
        stamp: 'Hey {customer_name}, just {stamps_left} stamps until your free coffee! ☕',
        redeem: 'Enjoy your {reward}, {customer_name}! See you soon at {shop_name} 💚',
        welcome: 'Welcome {customer_name}! Your card is ready. Drop by for your first stamp.',
        inactive: 'We miss you {customer_name} — your coffee is waiting at {shop_name}.',
      },
      sendTime: 'Send timing',
      sendNow: 'Instant',
      sendDelay: 'After {n} min',
      testBtn: 'Send test notification',
      preview: 'Preview',
      mostUsed: 'Most used',
    },
    history: {
      title: 'Recent notifications',
      empty: 'No notifications yet — enable a trigger to start.',
      seeAll: 'View all',
      cols: ['Type', 'Message', 'Reach', 'Click', 'Time'],
    },
    cta: { save: 'Save Changes', saved: 'Saved ✓', saving: 'Saving...' },
    bar: { unsaved: 'Unsaved changes', saved: 'All changes saved' },
    sentLabel: 'now',
    appName: 'Wallet',
    branchA: 'Al Malqa Branch', branchB: 'Al Nakheel Branch', branchC: 'Jeddah Branch',
    cityRiyadh: 'Riyadh', cityJeddah: 'Jeddah',
  },
}

/* ─── SVG icons ─── */
const Ic = {
  pin: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  zap: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  spark: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2z"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrR: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  arrL: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  send: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  gift: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>,
  hand: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 11V6a2 2 0 10-4 0v5M14 10V4a2 2 0 10-4 0v6M10 10.5V6a2 2 0 10-4 0v8M18 8a2 2 0 114 0v6a8 8 0 01-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 012.83-2.82L7 15"/></svg>,
  alarm: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="13" r="8"/><polyline points="12 9 12 13 14.5 14.5"/><path d="M5 3L2 6M22 6l-3-3"/></svg>,
}

/* ─── Helpers ─── */
function toAr(n) {
  const map = { '0':'٠','1':'١','2':'٢','3':'٣','4':'٤','5':'٥','6':'٦','7':'٧','8':'٨','9':'٩' }
  return String(n).split('').map(c => map[c] || c).join('')
}

function resolveVars(text, lang) {
  const map = lang === 'ar'
    ? { '{اسم_العميل}': 'سارة', '{عدد_الأختام}': '٢', '{المكافأة}': 'قهوة مجانية', '{اسم_المتجر}': 'كوفي لاونج' }
    : { '{customer_name}': 'Sarah', '{stamps_left}': '2', '{reward}': 'free coffee', '{shop_name}': 'Coffee Lounge' }
  let out = text || ''
  Object.entries(map).forEach(([k, v]) => { out = out.split(k).join(v) })
  return out
}

/* ─── Token block scoped to .notif-tab ─── */
const NOTIF_STYLES = `
  .notif-tab {
    --nt-bg: #12110F;
    --nt-bg-elev: #1C1B18;
    --nt-bg-elev-2: #232220;
    --nt-bg-inner: #2D2A24;
    --nt-border: #32302A;
    --nt-border-soft: #28261F;
    --nt-green: #10B981;
    --nt-green-bright: #00FFA9;
    --nt-green-glow: rgba(16,185,129,0.20);
    --nt-green-soft: rgba(16,185,129,0.12);
    --nt-text: #FFFBFF;
    --nt-text-2: #E2E2E2;
    --nt-text-3: #9A9890;
    --nt-text-4: #6E6C66;
    --nt-warn: #F59E0B;
    --nt-radius-lg: 20px;
    --nt-radius: 14px;
    --nt-shadow-card: 0 1px 0 rgba(255,255,255,0.03) inset, 0 24px 60px -28px rgba(0,0,0,0.55);
  }
  [data-theme="light"] .notif-tab {
    --nt-bg: #F6F5F1;
    --nt-bg-elev: #FFFFFF;
    --nt-bg-elev-2: #FBFAF6;
    --nt-bg-inner: #F1EEE6;
    --nt-border: #E8E4DA;
    --nt-border-soft: #EFECE3;
    --nt-green-bright: #059669;
    --nt-green-glow: rgba(16,185,129,0.10);
    --nt-green-soft: rgba(16,185,129,0.08);
    --nt-text: #12110F;
    --nt-text-2: #2A2825;
    --nt-text-3: #6B6960;
    --nt-text-4: #9A9890;
    --nt-shadow-card: 0 1px 0 rgba(255,255,255,0.6) inset, 0 18px 50px -32px rgba(20,20,15,0.18);
  }
  .notif-tab input[type="range"].nt-range {
    width: 100%; height: 6px; border-radius: 999px;
    appearance: none; -webkit-appearance: none;
    background: linear-gradient(90deg, var(--nt-green) 0%, var(--nt-green) var(--nt-p, 50%),
      var(--nt-bg-inner) var(--nt-p, 50%));
    outline: none; cursor: pointer;
  }
  .notif-tab input[type="range"].nt-range::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 18px; height: 18px; border-radius: 50%;
    background: #fff; border: 2px solid var(--nt-green);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: pointer;
  }
  .notif-tab input[type="range"].nt-range::-moz-range-thumb {
    width: 18px; height: 18px; border-radius: 50%;
    background: #fff; border: 2px solid var(--nt-green);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: pointer;
  }
`

/* ─── Toggle ─── */
function Toggle({ on, onChange, size = 'md' }) {
  const w = size === 'lg' ? 56 : 46
  const h = size === 'lg' ? 32 : 26
  const knob = h - 6
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: w, height: h, borderRadius: 999,
        background: on ? 'var(--nt-green)' : 'var(--nt-bg-inner)',
        border: '1px solid ' + (on ? 'var(--nt-green)' : 'var(--nt-border)'),
        position: 'relative', flexShrink: 0,
        transition: 'all .25s cubic-bezier(.22,1,.36,1)',
        boxShadow: on ? '0 0 0 4px var(--nt-green-glow), 0 6px 16px -8px var(--nt-green)' : 'none',
        cursor: 'pointer', padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2,
        insetInlineStart: on ? (w - knob - 4) : 2,
        width: knob, height: knob, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        transition: 'inset-inline-start .25s cubic-bezier(.22,1,.36,1)',
      }}/>
    </button>
  )
}

/* ─── Welcome banner ─── */
function WelcomeBanner({ tt, lang, shopName, onDismiss }) {
  return (
    <div style={{
      position: 'relative',
      borderRadius: 'var(--nt-radius-lg)',
      padding: '28px 32px',
      background: 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(16,185,129,0.04) 60%, transparent 100%)',
      border: '1px solid rgba(16,185,129,0.24)',
      overflow: 'hidden',
      marginBottom: 22,
    }}>
      <div style={{
        position: 'absolute', insetInlineEnd: -80, top: -80,
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--nt-green-glow), transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }}/>
      <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
        <div style={{ flex: '1 1 360px', minWidth: 280 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 11px', borderRadius: 999,
            background: 'var(--nt-green-soft)', color: 'var(--nt-green-bright)',
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
          }}>
            <span style={{ display: 'inline-flex' }}>{Ic.spark}</span>
            {tt.welcome.eyebrow.toUpperCase()}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.025em', marginTop: 12, marginBottom: 10, lineHeight: 1.15, color: 'var(--nt-text)' }}>
            {tt.welcome.title}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--nt-text-2)', lineHeight: 1.65, maxWidth: 580 }}>
            {tt.welcome.sub}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            {tt.welcome.meta.map((m, i) => (
              <span key={i} style={{
                fontSize: 12, fontWeight: 500, padding: '6px 11px', borderRadius: 999,
                background: 'var(--nt-bg-elev-2)', border: '1px solid var(--nt-border)',
                color: 'var(--nt-text-2)',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ color: 'var(--nt-green)', display: 'inline-flex' }}>{Ic.check}</span>
                {m}
              </span>
            ))}
          </div>
        </div>
        <div style={{ flex: '0 0 auto', position: 'relative', width: 240, height: 180 }}>
          <PhonePeek small lang={lang} shopName={shopName} appName={tt.appName} sentLabel={tt.sentLabel} />
        </div>
      </div>
      <button onClick={onDismiss} aria-label="dismiss" style={{
        position: 'absolute', top: 14, insetInlineEnd: 14,
        width: 28, height: 28, borderRadius: 8,
        background: 'var(--nt-bg-elev-2)', border: '1px solid var(--nt-border)',
        color: 'var(--nt-text-3)',
        display: 'grid', placeItems: 'center', cursor: 'pointer',
      }}>×</button>
    </div>
  )
}

/* ─── Phone peek (small only — used inside banner) ─── */
function PhonePeek({ lang, shopName, appName, sentLabel }) {
  const isAr = lang === 'ar'
  const time = isAr ? '٩:٤١' : '9:41'
  const dateStr = isAr ? 'الإثنين ٢٧ أبريل' : 'Monday, April 27'
  const defaultMsg = isAr
    ? 'قهوتك بانتظارك ☕ — أنت قريب من ' + shopName
    : 'Your coffee is waiting ☕ — you’re near ' + shopName
  return (
    <div style={{
      width: 220, height: 180, borderRadius: 24,
      background: 'linear-gradient(160deg, #2d2a24 0%, #161410 100%)',
      padding: 6,
      boxShadow: '0 24px 60px -20px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.06)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 18,
        background: 'linear-gradient(180deg, #6b8a6f 0%, #2c3a2e 50%, #1a2820 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ textAlign: 'center', color: '#fff', paddingTop: 14, fontWeight: 200 }}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 500 }}>{dateStr}</div>
          <div style={{ fontSize: 48, lineHeight: 1, letterSpacing: '-0.03em', marginTop: 2 }}>{time}</div>
        </div>
        <div style={{
          position: 'absolute', insetInline: 8, bottom: 10,
          background: 'rgba(40,40,42,0.78)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRadius: 12, padding: '8px 9px',
          color: '#fff', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', gap: 7, alignItems: 'flex-start',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5,
            background: 'linear-gradient(135deg, #10B981, #047857)',
            display: 'grid', placeItems: 'center',
            fontSize: 11, fontWeight: 800, flexShrink: 0,
          }}>و</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 9.5, opacity: 0.75 }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{appName} · {shopName}</span>
              <span>{sentLabel}</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{shopName}</div>
            <div style={{ fontSize: 10.5, lineHeight: 1.4, marginTop: 1, opacity: 0.92 }}>{defaultMsg}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Quota strip ─── */
function QuotaStrip({ tt }) {
  const items = [
    { label: tt.quota.tier, value: tt.quota.tierName, accent: true },
    { label: tt.quota.sent, value: '247', sub: '/ ∞' },
    { label: tt.quota.remaining, value: '∞' },
    { label: tt.quota.reach, value: '94%' },
  ]
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: 0,
      borderRadius: 'var(--nt-radius)',
      background: 'var(--nt-bg-elev)', border: '1px solid var(--nt-border)',
      padding: '14px 18px', marginBottom: 22, alignItems: 'center',
    }}>
      {items.map((it, i) => (
        <div key={i} style={{
          paddingInline: 18,
          borderInlineEnd: i < items.length - 1 ? '1px solid var(--nt-border-soft)' : 'none',
        }}>
          <div style={{ fontSize: 11.5, color: 'var(--nt-text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{it.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: it.accent ? 'var(--nt-green)' : 'var(--nt-text)', letterSpacing: '-0.02em' }}>{it.value}</span>
            {it.sub && <span style={{ fontSize: 12, color: 'var(--nt-text-3)' }}>{it.sub}</span>}
          </div>
        </div>
      ))}
      <button type="button" style={{
        padding: '10px 16px', borderRadius: 10, border: 0,
        background: 'var(--nt-green)', color: '#fff', fontWeight: 600, fontSize: 13,
        boxShadow: '0 8px 18px -8px var(--nt-green)', cursor: 'pointer',
      }}>{tt.quota.upgrade}</button>
    </div>
  )
}

/* ─── ServiceCard ─── */
function ServiceCard({ icon, title, sub, on, setOn, tag, children }) {
  return (
    <section style={{
      background: 'var(--nt-bg-elev)',
      border: '1px solid ' + (on ? 'rgba(16,185,129,0.25)' : 'var(--nt-border)'),
      borderRadius: 'var(--nt-radius-lg)',
      overflow: 'hidden',
      transition: 'border-color .3s, box-shadow .3s',
      boxShadow: on ? 'var(--nt-shadow-card), 0 0 0 4px rgba(16,185,129,0.04)' : 'var(--nt-shadow-card)',
    }}>
      <header style={{
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
        borderBottom: on ? '1px solid var(--nt-border-soft)' : 'none',
        background: on ? 'linear-gradient(180deg, var(--nt-green-soft), transparent)' : 'transparent',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: on ? 'var(--nt-green)' : 'var(--nt-bg-inner)',
          color: on ? '#fff' : 'var(--nt-text-3)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
          transition: 'all .25s',
          boxShadow: on ? '0 8px 18px -8px var(--nt-green)' : 'none',
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--nt-text)' }}>{title}</h2>
            {tag && <span style={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em',
              padding: '3px 8px', borderRadius: 999,
              background: 'var(--nt-bg-inner)', color: 'var(--nt-text-3)',
              border: '1px solid var(--nt-border)',
            }}>{tag}</span>}
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--nt-text-3)', marginTop: 4, lineHeight: 1.55 }}>{sub}</p>
        </div>
        <Toggle on={on} onChange={setOn} size="lg" />
      </header>
      {on && (
        <div style={{ padding: '22px 24px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {children}
        </div>
      )}
    </section>
  )
}

/* ─── Field shells ─── */
function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--nt-text-2)', letterSpacing: '0.01em' }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11.5, color: 'var(--nt-text-3)' }}>{hint}</span>}
    </label>
  )
}

const inputCss = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: 'var(--nt-bg-inner)', border: '1px solid var(--nt-border)',
  color: 'var(--nt-text)', fontSize: 14, outline: 'none',
  transition: 'border-color .2s, background .2s',
}

function Pill({ children, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '8px 14px', borderRadius: 999,
      background: active ? 'var(--nt-green-soft)' : 'var(--nt-bg-inner)',
      border: '1px solid ' + (active ? 'var(--nt-green)' : 'var(--nt-border)'),
      color: active ? 'var(--nt-green)' : 'var(--nt-text-2)',
      fontSize: 13, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      transition: 'all .2s', cursor: 'pointer',
    }}>{children}</button>
  )
}

/* ─── Location section ─── */
function LocationSection({ tt, lang, on, setOn, onChange }) {
  const [radius, setRadius] = useState(150)
  const [winIdx, setWinIdx] = useState(1)
  const [branches, setBranches] = useState({ b1: true, b2: true, b3: false })
  const [msg, setMsg] = useState(tt.location.messagePh.replace(/^مثلاً: |^e\.g\. /, ''))

  useEffect(() => {
    setMsg(tt.location.messagePh.replace(/^مثلاً: |^e\.g\. /, ''))
  }, [lang]) // eslint-disable-line

  // bubble change events for dirty tracking
  useEffect(() => { onChange?.() }, [radius, winIdx, branches, msg, on]) // eslint-disable-line

  const branchList = [
    { id: 'b1', name: tt.branchA, addr: tt.cityRiyadh },
    { id: 'b2', name: tt.branchB, addr: tt.cityRiyadh },
    { id: 'b3', name: tt.branchC, addr: tt.cityJeddah },
  ]

  return (
    <ServiceCard
      icon={Ic.pin}
      title={tt.location.title}
      sub={tt.location.sub}
      tag={tt.location.tag}
      on={on}
      setOn={setOn}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 28 }}>
        {/* Left: controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--nt-text-2)' }}>{tt.location.radius}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--nt-green)' }}>
                {lang === 'ar' ? toAr(radius) : radius} {tt.location.meters}
              </span>
            </div>
            <input
              type="range" min="50" max="500" step="50" value={radius}
              onChange={e => setRadius(+e.target.value)}
              className="nt-range" dir="ltr"
              style={{ '--nt-p': ((radius - 50) / 450 * 100) + '%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--nt-text-4)', marginTop: 4 }}>
              <span>50m</span><span>500m</span>
            </div>
          </div>

          <Field label={tt.location.activeWindow}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tt.location.windows.map((w, i) => (
                <Pill key={i} active={winIdx === i} onClick={() => setWinIdx(i)}>{w}</Pill>
              ))}
            </div>
          </Field>

          <Field label={tt.location.branches}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {branchList.map(b => (
                <button key={b.id} type="button"
                  onClick={() => setBranches({ ...branches, [b.id]: !branches[b.id] })}
                  style={{
                    padding: '10px 12px', borderRadius: 10,
                    border: '1px solid ' + (branches[b.id] ? 'var(--nt-green)' : 'var(--nt-border)'),
                    background: branches[b.id] ? 'var(--nt-green-soft)' : 'var(--nt-bg-inner)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    textAlign: 'start', cursor: 'pointer',
                  }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5,
                    background: branches[b.id] ? 'var(--nt-green)' : 'transparent',
                    border: '1px solid ' + (branches[b.id] ? 'var(--nt-green)' : 'var(--nt-border)'),
                    display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0,
                  }}>{branches[b.id] && Ic.check}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nt-text)' }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--nt-text-3)' }}>{b.addr}</div>
                  </div>
                  <span style={{ color: branches[b.id] ? 'var(--nt-green)' : 'var(--nt-text-4)' }}>{Ic.pin}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label={tt.location.messageLabel} hint={tt.location.hint}>
            <div style={{ position: 'relative' }}>
              <textarea
                value={msg}
                onChange={e => setMsg(e.target.value.slice(0, 120))}
                placeholder={tt.location.messagePh}
                rows={3}
                style={{ ...inputCss, resize: 'none', paddingBlock: 12, lineHeight: 1.5 }}
              />
              <span style={{
                position: 'absolute', bottom: 8, insetInlineEnd: 12,
                fontSize: 11, color: 'var(--nt-text-3)',
                background: 'var(--nt-bg-elev)', padding: '2px 6px', borderRadius: 6,
              }}>{msg.length}/120</span>
            </div>
          </Field>

          <div style={{
            display: 'flex', gap: 12,
            padding: '12px 14px',
            background: 'var(--nt-green-soft)',
            border: '1px solid rgba(16,185,129,0.18)',
            borderRadius: 12,
          }}>
            <span style={{ color: 'var(--nt-green)', flexShrink: 0, marginTop: 1 }}>{Ic.spark}</span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--nt-green)', marginBottom: 2 }}>{tt.location.tipTitle}</div>
              <div style={{ fontSize: 12.5, color: 'var(--nt-text-2)', lineHeight: 1.5 }}>{tt.location.tip}</div>
            </div>
          </div>
        </div>

        {/* Right: radius map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <RadiusMap radius={radius} />
          <div style={{ fontSize: 11, color: 'var(--nt-text-3)', textAlign: 'center' }}>{tt.location.preview}</div>
        </div>
      </div>
    </ServiceCard>
  )
}

function RadiusMap({ radius }) {
  const pct = (radius - 50) / 450
  const r = 26 + pct * 60
  return (
    <div style={{
      width: 240, height: 220, borderRadius: 16,
      background: 'var(--nt-bg-inner)', border: '1px solid var(--nt-border)',
      position: 'relative', overflow: 'hidden',
    }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
        <defs>
          <pattern id="ntgrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--nt-border)" strokeWidth="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ntgrid)" />
        <path d="M 0 80 L 240 60" stroke="var(--nt-border)" strokeWidth="3" fill="none" opacity="0.5"/>
        <path d="M 0 160 L 240 140" stroke="var(--nt-border)" strokeWidth="3" fill="none" opacity="0.5"/>
        <path d="M 80 0 L 90 220" stroke="var(--nt-border)" strokeWidth="3" fill="none" opacity="0.5"/>
        <path d="M 170 0 L 180 220" stroke="var(--nt-border)" strokeWidth="3" fill="none" opacity="0.5"/>
      </svg>
      <div style={{
        position: 'absolute', insetInlineStart: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: r * 2, height: r * 2, borderRadius: '50%',
        background: 'var(--nt-green-soft)',
        border: '2px dashed var(--nt-green)',
        transition: 'width .25s, height .25s',
      }}/>
      <div style={{
        position: 'absolute', insetInlineStart: '50%', top: '50%',
        transform: 'translate(-50%, -100%)', color: 'var(--nt-green)',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--nt-green)" stroke="#fff" strokeWidth="1.2">
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z"/>
          <circle cx="12" cy="10" r="3" fill="#fff" stroke="none"/>
        </svg>
      </div>
      {[
        { x: 30, y: 40 }, { x: 200, y: 60 }, { x: 50, y: 170 }, { x: 190, y: 175 },
      ].map((p, i) => (
        <div key={i} style={{
          position: 'absolute', insetInlineStart: p.x, top: p.y,
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--nt-bg-elev)',
          border: '2px solid var(--nt-green)',
          fontSize: 10, color: 'var(--nt-green)',
          display: 'grid', placeItems: 'center', fontWeight: 700,
        }}>{['ع','س','م','ف'][i]}</div>
      ))}
    </div>
  )
}

/* ─── Instant section ─── */
function InstantSection({ tt, lang, shopName, on, setOn, onChange }) {
  const triggers = [
    { id: 'stamp', icon: Ic.gift, ...tt.instant.tStamp, sample: tt.instant.sample.stamp, defaultOn: true, badge: tt.instant.mostUsed },
    { id: 'redeem', icon: Ic.spark, ...tt.instant.tRedeem, sample: tt.instant.sample.redeem, defaultOn: true },
    { id: 'welcome', icon: Ic.hand, ...tt.instant.tWelcome, sample: tt.instant.sample.welcome, defaultOn: false },
    { id: 'inactive', icon: Ic.alarm, ...tt.instant.tInactive, sample: tt.instant.sample.inactive, defaultOn: false },
  ]

  const [active, setActive] = useState('stamp')
  const [enabled, setEnabled] = useState(() => Object.fromEntries(triggers.map(x => [x.id, x.defaultOn])))
  const [messages, setMessages] = useState(() => Object.fromEntries(triggers.map(x => [x.id, x.sample])))
  const [delay, setDelay] = useState(0)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    setMessages(Object.fromEntries(triggers.map(x => [x.id, x.sample])))
  }, [lang]) // eslint-disable-line

  useEffect(() => { onChange?.() }, [enabled, messages, delay, on]) // eslint-disable-line

  const cur = triggers.find(x => x.id === active)
  const curMsg = messages[active] || ''

  const insertVar = (v) => {
    setMessages({ ...messages, [active]: (curMsg + ' ' + v).trim() })
  }
  const sendTest = () => {
    setTesting(true)
    setTimeout(() => setTesting(false), 1800)
  }

  return (
    <ServiceCard
      icon={Ic.zap}
      title={tt.instant.title}
      sub={tt.instant.sub}
      on={on}
      setOn={setOn}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 28 }}>
        {/* Left: triggers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--nt-text-2)', marginBottom: 10 }}>
              {tt.instant.triggers}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {triggers.map(tr => {
                const isOn = enabled[tr.id]
                const isActive = active === tr.id
                return (
                  <div key={tr.id}
                    onClick={() => setActive(tr.id)}
                    style={{
                      padding: '12px 14px', borderRadius: 12,
                      background: isActive ? 'var(--nt-bg-elev-2)' : 'var(--nt-bg-inner)',
                      border: '1px solid ' + (isActive ? 'var(--nt-green)' : 'var(--nt-border)'),
                      display: 'flex', gap: 12, alignItems: 'center',
                      cursor: 'pointer', transition: 'all .2s',
                      boxShadow: isActive ? '0 0 0 4px rgba(16,185,129,0.08)' : 'none',
                    }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: isOn ? 'var(--nt-green-soft)' : 'var(--nt-bg-elev)',
                      color: isOn ? 'var(--nt-green)' : 'var(--nt-text-3)',
                      display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>{tr.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--nt-text)' }}>{tr.name}</span>
                        {tr.badge && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'var(--nt-green-soft)', color: 'var(--nt-green)' }}>{tr.badge}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--nt-text-3)', marginTop: 2, lineHeight: 1.45 }}>{tr.desc}</div>
                    </div>
                    <Toggle on={isOn} onChange={(v) => { setEnabled({ ...enabled, [tr.id]: v }); if (v) setActive(tr.id) }} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: composer + preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <div style={{
            background: 'var(--nt-bg-inner)', border: '1px solid var(--nt-border)',
            borderRadius: 14, padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ color: 'var(--nt-green)' }}>{cur && cur.icon}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--nt-text)' }}>{cur && cur.name}</span>
            </div>

            <Field label={tt.instant.messageLabel}>
              <textarea
                value={curMsg}
                onChange={e => setMessages({ ...messages, [active]: e.target.value.slice(0, 140) })}
                rows={3}
                style={{ ...inputCss, resize: 'none', lineHeight: 1.5 }}
              />
            </Field>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11.5, color: 'var(--nt-text-3)', marginBottom: 6, fontWeight: 600 }}>{tt.instant.placeholders}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {tt.instant.vars.map(v => (
                  <button key={v} type="button" onClick={() => insertVar(v)} style={{
                    padding: '4px 10px', borderRadius: 8,
                    background: 'var(--nt-bg-elev)',
                    border: '1px dashed var(--nt-border)',
                    color: 'var(--nt-green)', fontSize: 11.5, fontWeight: 600,
                    fontFamily: 'ui-monospace, monospace', cursor: 'pointer',
                  }}>{v}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
              <Field label={tt.instant.sendTime}>
                <select value={delay} onChange={e => setDelay(+e.target.value)} style={{ ...inputCss, paddingBlock: 9, width: 'auto', minWidth: 160 }}>
                  <option value="0">{tt.instant.sendNow}</option>
                  <option value="5">{tt.instant.sendDelay.replace('{n}', '5')}</option>
                  <option value="30">{tt.instant.sendDelay.replace('{n}', '30')}</option>
                  <option value="60">{tt.instant.sendDelay.replace('{n}', '60')}</option>
                </select>
              </Field>
              <button type="button" onClick={sendTest} disabled={testing} style={{
                padding: '10px 14px', borderRadius: 10, border: 0,
                background: testing ? 'var(--nt-green-soft)' : 'var(--nt-green)',
                color: testing ? 'var(--nt-green)' : '#fff',
                fontSize: 12.5, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                whiteSpace: 'nowrap', cursor: testing ? 'default' : 'pointer',
                boxShadow: testing ? 'none' : '0 6px 16px -8px var(--nt-green)',
              }}>
                {testing ? Ic.check : Ic.send}
                {testing ? (lang === 'ar' ? 'تم الإرسال' : 'Sent') : tt.instant.testBtn}
              </button>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(180deg, var(--nt-bg-inner) 0%, transparent 100%)',
            border: '1px solid var(--nt-border)',
            borderRadius: 14, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--nt-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 10 }}>
              {tt.instant.preview}
            </div>
            <NotifPreview
              app={tt.appName}
              shop={shopName}
              text={resolveVars(curMsg, lang)}
              when={tt.sentLabel}
            />
          </div>
        </div>
      </div>
    </ServiceCard>
  )
}

function NotifPreview({ app, shop, text, when }) {
  return (
    <div style={{
      background: 'rgba(40,40,42,0.78)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '12px 14px',
      color: '#fff', display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 7,
        background: 'linear-gradient(135deg, #10B981, #047857)',
        display: 'grid', placeItems: 'center',
        fontSize: 16, fontWeight: 800, flexShrink: 0,
      }}>و</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 11.5, opacity: 0.7 }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{app} · {shop}</span>
          <span>{when}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{shop}</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 1, opacity: 0.92 }}>{text || ''}</div>
      </div>
    </div>
  )
}

/* ─── History table ─── */
function HistoryTable({ tt, lang }) {
  const rows = lang === 'ar' ? [
    { type: 'فوري · ختم', icon: Ic.gift, msg: 'باقي ختمين بس وقهوتك المجانية وصلت! ☕', reach: '142', click: '38%', time: 'منذ ٢ ساعة' },
    { type: 'موقع', icon: Ic.pin, msg: 'قهوتك بانتظارك ☕ — أنت قريب من كوفي لاونج', reach: '67', click: '24%', time: 'اليوم ١٠:٢٤' },
    { type: 'فوري · مكافأة', icon: Ic.spark, msg: 'مبروك سارة! استلمت قهوة مجانية. نراك قريباً 💚', reach: '23', click: '54%', time: 'أمس' },
    { type: 'فوري · ترحيب', icon: Ic.hand, msg: 'أهلاً أحمد! بطاقتك جاهزة. زورنا واجمع أول ختم.', reach: '19', click: '67%', time: 'أمس' },
  ] : [
    { type: 'Instant · Stamp', icon: Ic.gift, msg: 'Just 2 more stamps and your free coffee is ready ☕', reach: '142', click: '38%', time: '2h ago' },
    { type: 'Location', icon: Ic.pin, msg: 'Your coffee is waiting ☕ — you’re near Coffee Lounge', reach: '67', click: '24%', time: 'Today 10:24' },
    { type: 'Instant · Reward', icon: Ic.spark, msg: 'Enjoy your free coffee, Sarah! See you soon 💚', reach: '23', click: '54%', time: 'Yesterday' },
    { type: 'Instant · Welcome', icon: Ic.hand, msg: 'Welcome Ahmed! Your card is ready. Drop by for your first stamp.', reach: '19', click: '67%', time: 'Yesterday' },
  ]
  const tdCss = { padding: '14px 18px', textAlign: lang === 'ar' ? 'right' : 'left' }
  return (
    <section style={{
      background: 'var(--nt-bg-elev)', border: '1px solid var(--nt-border)',
      borderRadius: 'var(--nt-radius-lg)', overflow: 'hidden',
    }}>
      <header style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--nt-border-soft)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--nt-text)' }}>{tt.history.title}</h2>
        <button type="button" style={{
          fontSize: 12.5, fontWeight: 600, color: 'var(--nt-green)',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: 'transparent', border: 0, cursor: 'pointer',
        }}>
          {tt.history.seeAll} {lang === 'ar' ? Ic.arrL : Ic.arrR}
        </button>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: 'var(--nt-bg-elev-2)' }}>
              {tt.history.cols.map((c, i) => (
                <th key={i} style={{
                  padding: '10px 18px', textAlign: lang === 'ar' ? 'right' : 'left',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                  textTransform: 'uppercase', color: 'var(--nt-text-3)',
                  borderBottom: '1px solid var(--nt-border-soft)',
                }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--nt-border-soft)' : 'none' }}>
                <td style={tdCss}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 999, background: 'var(--nt-bg-inner)', border: '1px solid var(--nt-border)' }}>
                    <span style={{ color: 'var(--nt-green)', display: 'inline-flex', transform: 'scale(0.75)' }}>{r.icon}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--nt-text)' }}>{r.type}</span>
                  </div>
                </td>
                <td style={{ ...tdCss, color: 'var(--nt-text-2)', maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.msg}</td>
                <td style={{ ...tdCss, fontWeight: 600, color: 'var(--nt-text)' }}>{r.reach}</td>
                <td style={tdCss}>
                  <span style={{ color: 'var(--nt-green)', fontWeight: 700 }}>{r.click}</span>
                </td>
                <td style={{ ...tdCss, color: 'var(--nt-text-3)' }}>{r.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ─── Save bar ─── */
function SaveBar({ tt, dirty, saving, onSave }) {
  return (
    <div style={{
      position: 'sticky', bottom: 16, zIndex: 30, marginTop: 24,
      padding: '12px 18px', borderRadius: 14,
      background: dirty ? 'rgba(28,27,24,0.92)' : 'var(--nt-bg-elev)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid ' + (dirty ? 'rgba(16,185,129,0.3)' : 'var(--nt-border)'),
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
      boxShadow: dirty ? '0 16px 40px -16px rgba(0,0,0,0.5)' : 'none',
      transition: 'all .25s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--nt-text-2)' }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: dirty ? 'var(--nt-warn)' : 'var(--nt-green)',
          boxShadow: '0 0 0 4px ' + (dirty ? 'rgba(245,158,11,0.18)' : 'var(--nt-green-soft)'),
        }}/>
        {dirty ? tt.bar.unsaved : tt.bar.saved}
      </div>
      <button type="button" onClick={onSave} disabled={!dirty || saving} style={{
        padding: '10px 22px', borderRadius: 10, border: 0,
        background: 'var(--nt-green)', color: '#fff',
        fontWeight: 600, fontSize: 13.5,
        opacity: (!dirty || saving) ? 0.5 : 1,
        boxShadow: '0 8px 18px -8px var(--nt-green)',
        cursor: (!dirty || saving) ? 'default' : 'pointer',
      }}>
        {saving ? tt.cta.saving : (dirty ? tt.cta.save : tt.cta.saved)}
      </button>
    </div>
  )
}

/* ─── Main export ─── */
export default function NotificationsTab({ lang = 'ar', shopName }) {
  const tt = T[lang] || T.ar
  const [showWelcome, setShowWelcome] = useState(true)
  const [locOn, setLocOn] = useState(true)
  const [instOn, setInstOn] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  // Mark dirty whenever anything in the form changes (children call onChange).
  // Initial mount fires once — flush that with a flag so the bar stays "saved".
  const markDirty = () => setDirty(true)

  const save = () => {
    setSaving(true)
    setTimeout(() => { setSaving(false); setDirty(false) }, 900)
  }

  const effectiveShopName = shopName || (lang === 'ar' ? 'متجرك' : 'your shop')

  return (
    <>
      <style>{NOTIF_STYLES}</style>
      <div className="notif-tab" style={{ color: 'var(--nt-text)' }}>
        {showWelcome && (
          <WelcomeBanner
            tt={tt} lang={lang} shopName={effectiveShopName}
            onDismiss={() => setShowWelcome(false)}
          />
        )}

        {!showWelcome && (
          <div style={{ marginBottom: 22 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--nt-text)' }}>
              {lang === 'ar' ? 'الإشعارات' : 'Notifications'}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--nt-text-3)', marginTop: 4 }}>{tt.welcome.sub}</p>
          </div>
        )}

        <QuotaStrip tt={tt} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <LocationSection tt={tt} lang={lang} on={locOn} setOn={(v) => { setLocOn(v); markDirty() }} onChange={markDirty} />
          <InstantSection  tt={tt} lang={lang} shopName={effectiveShopName} on={instOn} setOn={(v) => { setInstOn(v); markDirty() }} onChange={markDirty} />
          <HistoryTable    tt={tt} lang={lang} />
        </div>

        <SaveBar tt={tt} dirty={dirty} saving={saving} onSave={save} />
      </div>
    </>
  )
}
