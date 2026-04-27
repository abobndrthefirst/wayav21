// NotificationsTab — admin-only Notifications service page.
// Faithful port of the mockup (Waya Notification App.jsx + Waya Notification.html):
// Welcome banner, quota strip, Location service card, Instant service card,
// recent-notifications history table, sticky save bar.
//
// Self-contained styling: defines its own CSS custom properties scoped under
// `.notif-tab` for both dark and light themes so inline `var(--bg-elev)` etc.
// resolve without depending on tokens elsewhere in the app's stylesheet.

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const WELCOME_DISMISSED_KEY = 'waya_notif_welcome_dismissed'

/* ─── Translations ─── */
const T = {
  ar: {
    welcome: {
      eyebrow: 'خدمة جديدة',
      title: 'مرحباً بك في الإشعارات',
      sub: 'ذكّر عملاءك بطريقتك. وايا يرسل الإشعار في اللحظة الصح — لما يكون قريب، أو لما يجمع ختم، أو لما يستلم مكافأة.',
      meta: ['بدون كود', 'يشتغل مع كل بطاقات الولاء', 'مجاني خلال التجربة'],
    },
    recipients: {
      title: 'إرسال إشعار للعملاء',
      sub: 'اختر العملاء وأرسل لهم إشعار مباشرة على محفظتهم.',
      searchPh: 'ابحث بالاسم أو الجوال',
      selectAll: 'اختيار الكل',
      clear: 'إلغاء',
      selected: '{n} عميل محدّد',
      broadcastHint: 'حالياً يرسل لجميع عملاء متجرك (الاستهداف الفردي قريباً).',
      none: 'لا يوجد عملاء بعد — شارك كود QR وابدأ بجمع العملاء.',
      loading: 'جاري التحميل...',
      messageLabel: 'نص الإشعار',
      messagePh: 'اكتب الرسالة هنا...',
      sendBtn: 'إرسال للعملاء المحدّدين',
      sending: 'جاري الإرسال...',
      sent: 'تم الإرسال ✓',
      noSelection: 'اختر عميل واحد على الأقل',
      noPhone: '— بدون جوال',
      cols: ['الاسم', 'الجوال', 'البرنامج', 'آخر زيارة'],
      neverVisited: 'لم يزر بعد',
    },
    location: {
      title: 'الإشعارات حسب الموقع',
      sub: 'لما العميل يكون قريب من فرعك، يوصله إشعار يذكّره يمر عليك.',
      tag: 'يعتمد على Apple Wallet & Google Wallet',
      radius: 'مدى التنبيه',
      meters: 'متر',
      activeWindow: 'وقت الإرسال',
      windows: ['طول اليوم', 'وقت العمل', 'مخصص'],
      messageLabel: 'نص الإشعار',
      messagePh: 'مثلاً: قهوتك المفضّلة بانتظارك ☕ — أنت قريب من المتجر',
      preview: 'معاينة على الجوال',
      hint: 'يظهر للعميل لما يكون داخل المدى — مرة كل 4 ساعات كحد أقصى.',
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
      messagePh: 'اكتب الرسالة هنا...',
      placeholders: 'مفاتيح متاحة',
      vars: ['{اسم_العميل}', '{عدد_الأختام}', '{المكافأة}', '{اسم_المتجر}'],
      sendTime: 'وقت الإرسال',
      sendNow: 'فوري',
      sendDelay: 'بعد {n} دقيقة',
      testBtn: 'إرسال إشعار تجريبي',
      preview: 'معاينة',
    },
    history: {
      title: 'آخر الإشعارات المرسلة',
      empty: 'ما في إشعارات بعد — فعّل أحد المحفّزات وابدأ.',
    },
    cta: { save: 'حفظ التغييرات', saved: 'تم الحفظ ✓', saving: 'جاري الحفظ...' },
    bar: { unsaved: 'تعديلات لم تُحفظ', saved: 'كل التغييرات محفوظة' },
    sentLabel: 'الآن',
    appName: 'محفظة',
  },
  en: {
    welcome: {
      eyebrow: 'New service',
      title: 'Welcome to Notifications',
      sub: 'Remind your customers your way. Waya delivers the right message at the right moment — when they walk by, earn a stamp, or redeem a reward.',
      meta: ['No code needed', 'Works with every loyalty card', 'Free during trial'],
    },
    recipients: {
      title: 'Send to customers',
      sub: 'Pick the customers and push a notification straight to their wallet.',
      searchPh: 'Search by name or phone',
      selectAll: 'Select all',
      clear: 'Clear',
      selected: '{n} selected',
      broadcastHint: 'Currently sends to all your shop’s customers (per-customer targeting coming soon).',
      none: 'No customers yet — share your QR code to start collecting cardholders.',
      loading: 'Loading...',
      messageLabel: 'Notification copy',
      messagePh: 'Type your message...',
      sendBtn: 'Send to selected',
      sending: 'Sending...',
      sent: 'Sent ✓',
      noSelection: 'Select at least one customer',
      noPhone: '— no phone',
      cols: ['Name', 'Phone', 'Program', 'Last visit'],
      neverVisited: 'Never visited',
    },
    location: {
      title: 'Location Notifications',
      sub: 'When a customer is near your branch, they get a nudge to drop in.',
      tag: 'Powered by Apple Wallet & Google Wallet',
      radius: 'Trigger radius',
      meters: 'meters',
      activeWindow: 'Sending hours',
      windows: ['All day', 'Business hours', 'Custom'],
      messageLabel: 'Notification copy',
      messagePh: 'e.g. Your favorite coffee is waiting ☕ — you’re near the store',
      preview: 'Phone preview',
      hint: 'Shown when the customer is inside the radius — at most once every 4 hours.',
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
      messagePh: 'Type your message...',
      placeholders: 'Available variables',
      vars: ['{customer_name}', '{stamps_left}', '{reward}', '{shop_name}'],
      sendTime: 'Send timing',
      sendNow: 'Instant',
      sendDelay: 'After {n} min',
      testBtn: 'Send test notification',
      preview: 'Preview',
    },
    history: {
      title: 'Recent notifications',
      empty: 'No notifications yet — enable a trigger to start.',
    },
    cta: { save: 'Save Changes', saved: 'Saved ✓', saving: 'Saving...' },
    bar: { unsaved: 'Unsaved changes', saved: 'All changes saved' },
    sentLabel: 'now',
    appName: 'Wallet',
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
  const [msg, setMsg] = useState('')

  // bubble change events for dirty tracking
  useEffect(() => { onChange?.() }, [radius, winIdx, msg, on]) // eslint-disable-line

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
    </div>
  )
}

/* ─── Instant section ─── */
function InstantSection({ tt, lang, shopName, on, setOn, onChange }) {
  const triggers = [
    { id: 'stamp', icon: Ic.gift, ...tt.instant.tStamp },
    { id: 'redeem', icon: Ic.spark, ...tt.instant.tRedeem },
    { id: 'welcome', icon: Ic.hand, ...tt.instant.tWelcome },
    { id: 'inactive', icon: Ic.alarm, ...tt.instant.tInactive },
  ]

  const [active, setActive] = useState('stamp')
  const [enabled, setEnabled] = useState(() => Object.fromEntries(triggers.map(x => [x.id, false])))
  const [messages, setMessages] = useState(() => Object.fromEntries(triggers.map(x => [x.id, ''])))
  const [delay, setDelay] = useState(0)
  const [testing, setTesting] = useState(false)

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
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--nt-text)' }}>{tr.name}</div>
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
                placeholder={tt.instant.messagePh}
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

/* ─── History (empty state — no notifications-sent backend yet) ─── */
function HistoryTable({ tt }) {
  return (
    <section style={{
      background: 'var(--nt-bg-elev)', border: '1px solid var(--nt-border)',
      borderRadius: 'var(--nt-radius-lg)', overflow: 'hidden',
    }}>
      <header style={{ padding: '18px 24px', borderBottom: '1px solid var(--nt-border-soft)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--nt-text)' }}>{tt.history.title}</h2>
      </header>
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--nt-text-3)', fontSize: 13.5 }}>
        {tt.history.empty}
      </div>
    </section>
  )
}

/* ─── Recipients (real customers) ─── */
function RecipientsSection({ tt, lang, shopId, shopName, onChange }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    if (!shopId) return
    let cancelled = false
    setLoading(true)
    supabase.rpc('shop_customers', { _shop_id: shopId }).then(({ data, error }) => {
      if (cancelled) return
      if (error) console.error('shop_customers', error)
      setRows(Array.isArray(data) ? data : [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [shopId])

  useEffect(() => { onChange?.() }, [selected, msg]) // eslint-disable-line

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(r =>
      (r.customer_name || '').toLowerCase().includes(q) ||
      (r.customer_phone || '').includes(q)
    )
  }, [rows, search])

  const allFilteredSelected = filtered.length > 0 && filtered.every(r => selected.has(r.id))

  const toggle = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    if (allFilteredSelected) {
      const next = new Set(selected)
      filtered.forEach(r => next.delete(r.id))
      setSelected(next)
    } else {
      const next = new Set(selected)
      filtered.forEach(r => next.add(r.id))
      setSelected(next)
    }
  }

  const clearAll = () => setSelected(new Set())

  const fmtDate = (iso) => {
    if (!iso) return tt.recipients.neverVisited
    const d = new Date(iso)
    return d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const send = async () => {
    if (selected.size === 0) { setErrMsg(tt.recipients.noSelection); setTimeout(() => setErrMsg(''), 2200); return }
    if (!msg.trim() || !shopId) return
    setSending(true)
    setErrMsg('')
    try {
      // Calls the send-notification edge function. Body is the user's typed
      // message (≤240 chars per server validation); title is the shop name.
      // Backend currently broadcasts to all customers for the shop —
      // per-customer targeting needs a backend change (customer_pass_ids param).
      const trimmedBody = msg.trim().slice(0, 240)
      const trimmedTitle = (shopName || 'Waya').slice(0, 80)
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          shop_id: shopId,
          title: trimmedTitle,
          body: trimmedBody,
          client_request_id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
      })
      if (error) throw error
      if (data && data.success === false) throw new Error(data.error || 'Send failed')
      setSent(true)
      setMsg('')
      setSelected(new Set())
      setTimeout(() => setSent(false), 2800)
    } catch (e) {
      setErrMsg(e?.message || 'Send failed')
      setTimeout(() => setErrMsg(''), 4000)
    } finally {
      setSending(false)
    }
  }

  const tdCss = { padding: '10px 14px', textAlign: lang === 'ar' ? 'right' : 'left' }

  return (
    <section style={{
      background: 'var(--nt-bg-elev)',
      border: '1px solid var(--nt-border)',
      borderRadius: 'var(--nt-radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--nt-shadow-card)',
    }}>
      <header style={{
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
        borderBottom: '1px solid var(--nt-border-soft)',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'var(--nt-green)', color: '#fff',
          display: 'grid', placeItems: 'center', flexShrink: 0,
          boxShadow: '0 8px 18px -8px var(--nt-green)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--nt-text)' }}>{tt.recipients.title}</h2>
          <p style={{ fontSize: 13.5, color: 'var(--nt-text-3)', marginTop: 4, lineHeight: 1.55 }}>{tt.recipients.sub}</p>
        </div>
      </header>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Search + select-all/clear */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tt.recipients.searchPh}
            style={{ ...inputCss, flex: '1 1 240px', minWidth: 180 }}
          />
          <button type="button" onClick={toggleAll} disabled={filtered.length === 0} style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'var(--nt-bg-inner)', border: '1px solid var(--nt-border)',
            color: 'var(--nt-text-2)', fontSize: 13, fontWeight: 600,
            cursor: filtered.length === 0 ? 'default' : 'pointer',
            opacity: filtered.length === 0 ? 0.5 : 1,
          }}>{tt.recipients.selectAll}</button>
          <button type="button" onClick={clearAll} disabled={selected.size === 0} style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'transparent', border: '1px solid var(--nt-border)',
            color: 'var(--nt-text-3)', fontSize: 13, fontWeight: 600,
            cursor: selected.size === 0 ? 'default' : 'pointer',
            opacity: selected.size === 0 ? 0.5 : 1,
          }}>{tt.recipients.clear}</button>
        </div>

        {/* Customer list */}
        <div style={{
          border: '1px solid var(--nt-border)', borderRadius: 12,
          background: 'var(--nt-bg-inner)',
          maxHeight: 360, overflowY: 'auto',
        }}>
          {loading && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--nt-text-3)', fontSize: 13.5 }}>
              {tt.recipients.loading}
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--nt-text-3)', fontSize: 13.5, lineHeight: 1.6 }}>
              {tt.recipients.none}
            </div>
          )}
          {!loading && rows.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--nt-bg-elev-2)', zIndex: 1 }}>
                <tr>
                  <th style={{ ...tdCss, width: 36, padding: '10px 0 10px 14px' }}>
                    <input
                      type="checkbox" checked={allFilteredSelected} onChange={toggleAll}
                      style={{ accentColor: 'var(--nt-green)', cursor: 'pointer' }}
                      aria-label={tt.recipients.selectAll}
                    />
                  </th>
                  {tt.recipients.cols.map((c, i) => (
                    <th key={i} style={{
                      ...tdCss,
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                      textTransform: 'uppercase', color: 'var(--nt-text-3)',
                      borderBottom: '1px solid var(--nt-border-soft)',
                    }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const isSel = selected.has(r.id)
                  return (
                    <tr key={r.id}
                      onClick={() => toggle(r.id)}
                      style={{
                        borderBottom: i < filtered.length - 1 ? '1px solid var(--nt-border-soft)' : 'none',
                        cursor: 'pointer',
                        background: isSel ? 'var(--nt-green-soft)' : 'transparent',
                      }}>
                      <td style={{ ...tdCss, width: 36, padding: '10px 0 10px 14px' }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSel} onChange={() => toggle(r.id)}
                          style={{ accentColor: 'var(--nt-green)', cursor: 'pointer' }} />
                      </td>
                      <td style={{ ...tdCss, color: 'var(--nt-text)', fontWeight: 600 }}>
                        {r.customer_name || '—'}
                      </td>
                      <td style={{ ...tdCss, color: 'var(--nt-text-2)', fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }}>
                        {r.customer_phone || tt.recipients.noPhone}
                      </td>
                      <td style={{ ...tdCss, color: 'var(--nt-text-2)' }}>
                        {r.loyalty_programs?.name || '—'}
                      </td>
                      <td style={{ ...tdCss, color: 'var(--nt-text-3)' }}>
                        {fmtDate(r.last_visit_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Selection count */}
        <div style={{ fontSize: 12.5, color: 'var(--nt-text-3)' }}>
          {tt.recipients.selected.replace('{n}', lang === 'ar' ? toAr(selected.size) : selected.size)}
        </div>

        {/* Composer + Send */}
        <Field label={tt.recipients.messageLabel}>
          <div style={{ position: 'relative' }}>
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value.slice(0, 140))}
              placeholder={tt.recipients.messagePh}
              rows={3}
              style={{ ...inputCss, resize: 'none', paddingBlock: 12, lineHeight: 1.5 }}
            />
            <span style={{
              position: 'absolute', bottom: 8, insetInlineEnd: 12,
              fontSize: 11, color: 'var(--nt-text-3)',
              background: 'var(--nt-bg-elev)', padding: '2px 6px', borderRadius: 6,
            }}>{msg.length}/140</span>
          </div>
        </Field>

        <div style={{
          display: 'flex', gap: 10,
          padding: '10px 12px', borderRadius: 10,
          background: 'var(--nt-green-soft)',
          border: '1px solid rgba(16,185,129,0.18)',
          fontSize: 12, color: 'var(--nt-text-2)', lineHeight: 1.5,
        }}>
          <span style={{ color: 'var(--nt-green)', flexShrink: 0, marginTop: 1 }}>{Ic.spark}</span>
          <span>{tt.recipients.broadcastHint}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {errMsg && <span style={{ color: 'var(--nt-warn)', fontSize: 12.5 }}>{errMsg}</span>}
          <button
            type="button" onClick={send}
            disabled={sending || sent || selected.size === 0 || !msg.trim()}
            style={{
              padding: '11px 20px', borderRadius: 10, border: 0,
              background: sent ? 'var(--nt-green-soft)' : 'var(--nt-green)',
              color: sent ? 'var(--nt-green)' : '#fff',
              fontSize: 13.5, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              opacity: (sending || sent || selected.size === 0 || !msg.trim()) ? 0.55 : 1,
              cursor: (sending || sent || selected.size === 0 || !msg.trim()) ? 'default' : 'pointer',
              boxShadow: sent ? 'none' : '0 8px 18px -8px var(--nt-green)',
              transition: 'all .2s',
            }}>
            {sent ? Ic.check : Ic.send}
            {sending ? tt.recipients.sending : sent ? tt.recipients.sent : tt.recipients.sendBtn}
          </button>
        </div>
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
export default function NotificationsTab({ lang = 'ar', shopName, shopId }) {
  const tt = T[lang] || T.ar
  const [showWelcome, setShowWelcome] = useState(() => {
    try { return localStorage.getItem(WELCOME_DISMISSED_KEY) !== '1' }
    catch { return true }
  })
  const [locOn, setLocOn] = useState(false)
  const [instOn, setInstOn] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const dismissWelcome = () => {
    try { localStorage.setItem(WELCOME_DISMISSED_KEY, '1') } catch {}
    setShowWelcome(false)
  }

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
            onDismiss={dismissWelcome}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <RecipientsSection tt={tt} lang={lang} shopId={shopId} shopName={effectiveShopName} onChange={markDirty} />
          <LocationSection   tt={tt} lang={lang} on={locOn}  setOn={(v) => { setLocOn(v); markDirty() }}  onChange={markDirty} />
          <InstantSection    tt={tt} lang={lang} shopName={effectiveShopName} on={instOn} setOn={(v) => { setInstOn(v); markDirty() }} onChange={markDirty} />
          <HistoryTable      tt={tt} />
        </div>

        <SaveBar tt={tt} dirty={dirty} saving={saving} onSave={save} />
      </div>
    </>
  )
}
