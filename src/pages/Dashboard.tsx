import React, { useState, useEffect, useRef } from 'react';
import { navigate } from '../App';

// ─── Brand Tokens (matching Waya landing page) ───────────────────────────────
const C = {
  lime: '#B9FF66',
  dark: '#191A23',
  gray: '#F3F3F3',
  white: '#FFFFFF',
  green: '#0A6C3B',
  muted: '#4A5B4D',
  border: '1px solid #E5E7EB',
  borderDark: '1px solid #191A23',
  shadow: '0 1px 3px rgba(0,0,0,0.06)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.08)',
};

// ─── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_STATS = {
  totalCustomers: 847,
  activeThisMonth: 312,
  totalStamps: 4283,
  campaignsSent: 18,
  redemptions: 156,
  avgVisitsPerCustomer: 3.2,
};

const DEMO_CHART_DATA = [
  { month: 'Oct', customers: 120, stamps: 340 },
  { month: 'Nov', customers: 198, stamps: 580 },
  { month: 'Dec', customers: 310, stamps: 920 },
  { month: 'Jan', customers: 445, stamps: 1640 },
  { month: 'Feb', customers: 620, stamps: 2800 },
  { month: 'Mar', customers: 847, stamps: 4283 },
];

const DEMO_RECENT_ACTIVITY = [
  { type: 'stamp', customer: 'أحمد م.', action: 'حصل على الطابع ٧/١٠', time: 'قبل ٣ دقائق', emoji: '☕' },
  { type: 'redeem', customer: 'سارة ع.', action: 'استبدل المكافأة — قهوة مجانية', time: 'قبل ١٥ دقيقة', emoji: '🎁' },
  { type: 'new', customer: 'فهد ك.', action: 'عميل جديد انضم', time: 'قبل ٣٠ دقيقة', emoji: '👤' },
  { type: 'stamp', customer: 'نورة م.', action: 'حصلت على الطابع ٤/٨', time: 'قبل ساعة', emoji: '✂️' },
  { type: 'campaign', customer: 'حملة', action: '"عرض الجمعة" — أُرسل لـ ٢٤٠ عميل', time: 'قبل ٣ ساعات', emoji: '📣' },
  { type: 'stamp', customer: 'خالد ر.', action: 'حصل على الطابع ١٠/١٠ ✅', time: 'قبل ٥ ساعات', emoji: '🍽️' },
  { type: 'new', customer: 'ريم ن.', action: 'عميلة جديدة انضمت', time: 'أمس', emoji: '👤' },
];

const DEMO_CAMPAIGNS = [
  { name: 'عرض الجمعة', sent: 240, opened: 186, redeemed: 42, status: 'active' },
  { name: 'ترحيب عملاء جدد', sent: 120, opened: 98, redeemed: 31, status: 'active' },
  { name: 'عرض نهاية الشهر', sent: 310, opened: 220, redeemed: 67, status: 'completed' },
];

const DEMO_TOP_CUSTOMERS = [
  { name: 'أحمد محمد', visits: 28, stamps: 42, lastVisit: 'اليوم' },
  { name: 'سارة العتيبي', visits: 24, stamps: 36, lastVisit: 'أمس' },
  { name: 'فهد القحطاني', visits: 19, stamps: 28, lastVisit: 'قبل يومين' },
  { name: 'نورة الشمري', visits: 17, stamps: 22, lastVisit: 'قبل ٣ أيام' },
  { name: 'خالد الراشد', visits: 15, stamps: 20, lastVisit: 'قبل أسبوع' },
];

// ─── Simple Bar Chart (pure SVG) ──────────────────────────────────────────────
function MiniBarChart({ data, dataKey, color, height = 160 }: {
  data: typeof DEMO_CHART_DATA;
  dataKey: 'customers' | 'stamps';
  color: string;
  height?: number;
}) {
  const max = Math.max(...data.map(d => d[dataKey]));
  const barWidth = 100 / data.length;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${data.length * 60} ${height}`} style={{ display: 'block' }}>
      {data.map((d, i) => {
        const barH = (d[dataKey] / max) * (height - 30);
        const x = i * 60 + 10;
        const y = height - barH - 20;
        return (
          <g key={i}>
            <rect x={x} y={y} width={36} height={barH} rx={6} fill={color} opacity={i === data.length - 1 ? 1 : 0.55} />
            <text x={x + 18} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill={C.dark}>{d[dataKey]}</text>
            <text x={x + 18} y={height - 4} textAnchor="middle" fontSize="10" fill={C.muted}>{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, suffix, icon, trend, trendLabel }: {
  label: string;
  value: number;
  suffix?: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(ease * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <div ref={ref} style={{
      background: C.white,
      border: C.border,
      borderRadius: 16,
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      boxShadow: C.shadow,
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      cursor: 'default',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadowMd; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadow; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 24, lineHeight: 1 }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: C.dark, lineHeight: 1 }}>{count.toLocaleString()}{suffix || ''}</span>
      </div>
      {trend && trendLabel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: trend === 'up' ? '#16a34a' : trend === 'down' ? '#ef4444' : C.muted,
            background: trend === 'up' ? '#f0fdf4' : trend === 'down' ? '#fef2f2' : '#f5f5f5',
            padding: '2px 8px',
            borderRadius: 20,
          }}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel}
          </span>
          <span style={{ fontSize: 11, color: C.muted }}>vs الشهر الماضي</span>
        </div>
      )}
    </div>
  );
}

// ─── Activity Type Badge ──────────────────────────────────────────────────────
function ActivityBadge({ type }: { type: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    stamp: { bg: '#f0fdf4', color: '#16a34a', label: 'طابع' },
    redeem: { bg: '#fefce8', color: '#ca8a04', label: 'مكافأة' },
    new: { bg: '#eff6ff', color: '#2563eb', label: 'جديد' },
    campaign: { bg: '#faf5ff', color: '#9333ea', label: 'حملة' },
  };
  const c = config[type] || config.stamp;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, background: c.bg, color: c.color, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'campaigns' | 'passes' | 'card-builder'>('overview');
  const ff = '"Cairo", "Space Grotesk", sans-serif';

  const navItems = [
    { id: 'overview' as const, label: 'نظرة عامة', icon: '📊' },
    { id: 'customers' as const, label: 'العملاء', icon: '👥' },
    { id: 'campaigns' as const, label: 'الحملات', icon: '📣' },
    { id: 'passes' as const, label: 'البطاقات', icon: '🎫' },
    { id: 'card-builder' as const, label: 'إنشاء بطاقة', icon: '🎨' },
  ];

  return (
    <div dir="rtl" style={{ fontFamily: ff, background: '#F8F9FB', minHeight: '100vh', display: 'flex', color: C.dark }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarOpen ? 240 : 68,
        background: C.dark,
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 36, height: 36, background: C.lime, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: C.dark, flexShrink: 0 }}>
            W
          </div>
          {sidebarOpen && <span style={{ fontSize: 18, fontWeight: 700, color: C.white, letterSpacing: 1 }}>وايا</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'card-builder') {
                  navigate('/dashboard/card-builder');
                  return;
                }
                setActiveTab(item.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: sidebarOpen ? '12px 16px' : '12px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                background: activeTab === item.id ? 'rgba(185,255,102,0.12)' : 'transparent',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                color: activeTab === item.id ? C.lime : 'rgba(255,255,255,0.5)',
                fontSize: 14,
                fontWeight: activeTab === item.id ? 600 : 400,
                fontFamily: ff,
                transition: 'all 0.15s ease',
                width: '100%',
                textAlign: 'right',
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Shop info */}
        {sidebarOpen && (
          <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1C1C2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>☕</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>مقهى العلا</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>الخطة الشهرية · نشط</div>
              </div>
            </div>
          </div>
        )}

        {/* Back to landing page */}
        <button onClick={() => navigate('/')} style={{
          padding: '12px', margin: '0 8px 8px', background: 'rgba(185,255,102,0.1)', border: '1px solid rgba(185,255,102,0.2)',
          borderRadius: 8, cursor: 'pointer', color: C.lime, fontSize: 13, fontFamily: ff, fontWeight: 600,
          transition: 'background 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {sidebarOpen ? '← الرجوع للصفحة الرئيسية' : '←'}
        </button>

        {/* Toggle sidebar */}
        <button onClick={() => setSidebarOpen(o => !o)} style={{
          padding: '12px', margin: '0 8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 16, fontFamily: ff,
          transition: 'background 0.15s ease',
        }}>
          {sidebarOpen ? '→' : '←'}
        </button>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '28px 32px', overflow: 'auto', minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>مرحباً، مقهى العلا ☕</h1>
            <p style={{ fontSize: 14, color: C.muted, margin: '4px 0 0' }}>آخر تحديث: اليوم ٢:٣٥ م</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.white, border: C.border, borderRadius: 10, padding: '10px 16px',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: ff, color: C.dark,
              boxShadow: C.shadow,
            }}>
              📊 تصدير التقرير
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.lime, border: C.borderDark, borderRadius: 10, padding: '10px 20px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: ff, color: C.dark,
              boxShadow: '3px 3px 0 #191A23',
            }}>
              + حملة جديدة
            </button>
          </div>
        </div>

        {/* ── DEMO BADGE ─────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(90deg, #fefce8, #fff7ed)',
          border: '1px solid #fde68a',
          borderRadius: 12,
          padding: '12px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          color: '#92400e',
        }}>
          <span style={{ fontSize: 18 }}>🚧</span>
          <span><strong>وضع العرض التوضيحي</strong> — هذه البيانات تجريبية لعرض شكل لوحة التحكم. البيانات الفعلية ستظهر بعد ربط حسابك.</span>
        </div>

        {/* ── STAT CARDS ──────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard label="إجمالي العملاء" value={DEMO_STATS.totalCustomers} icon="👥" trend="up" trendLabel="+36%" />
          <StatCard label="نشطين هذا الشهر" value={DEMO_STATS.activeThisMonth} icon="🟢" trend="up" trendLabel="+22%" />
          <StatCard label="الطوابع المجموعة" value={DEMO_STATS.totalStamps} icon="⭐" trend="up" trendLabel="+53%" />
          <StatCard label="الحملات المرسلة" value={DEMO_STATS.campaignsSent} icon="📣" trend="neutral" trendLabel="مستقر" />
          <StatCard label="المكافآت المستبدلة" value={DEMO_STATS.redemptions} icon="🎁" trend="up" trendLabel="+18%" />
          <StatCard label="متوسط الزيارات" value={3} suffix=".2" icon="📈" trend="up" trendLabel="+0.4" />
        </div>

        {/* ── CHARTS + ACTIVITY ────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

          {/* Customer Growth Chart */}
          <div style={{ background: C.white, border: C.border, borderRadius: 16, padding: '24px', boxShadow: C.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>نمو العملاء</h3>
              <span style={{ fontSize: 12, color: C.muted, background: '#f5f5f5', padding: '4px 10px', borderRadius: 20 }}>آخر ٦ أشهر</span>
            </div>
            <MiniBarChart data={DEMO_CHART_DATA} dataKey="customers" color={C.lime} height={170} />
          </div>

          {/* Stamps Growth Chart */}
          <div style={{ background: C.white, border: C.border, borderRadius: 16, padding: '24px', boxShadow: C.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>الطوابع المحصّلة</h3>
              <span style={{ fontSize: 12, color: C.muted, background: '#f5f5f5', padding: '4px 10px', borderRadius: 20 }}>آخر ٦ أشهر</span>
            </div>
            <MiniBarChart data={DEMO_CHART_DATA} dataKey="stamps" color={C.dark} height={170} />
          </div>
        </div>

        {/* ── CAMPAIGNS + TOP CUSTOMERS + ACTIVITY ──────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

          {/* Campaigns */}
          <div style={{ background: C.white, border: C.border, borderRadius: 16, padding: '24px', boxShadow: C.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>📣 الحملات</h3>
              <button style={{ fontSize: 12, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff, textDecoration: 'underline' }}>عرض الكل</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DEMO_CAMPAIGNS.map((c, i) => (
                <div key={i} style={{
                  background: '#FAFAFA', border: C.border, borderRadius: 12, padding: '16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        background: c.status === 'active' ? '#f0fdf4' : '#f5f5f5',
                        color: c.status === 'active' ? '#16a34a' : C.muted,
                      }}>
                        {c.status === 'active' ? 'نشطة' : 'مكتملة'}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: C.muted }}>
                      أُرسل: {c.sent} · فُتح: {c.opened} · استُبدل: {c.redeemed}
                    </span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.dark }}>{Math.round((c.redeemed / c.sent) * 100)}%</div>
                    <div style={{ fontSize: 10, color: C.muted }}>معدل التحويل</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: C.white, border: C.border, borderRadius: 16, padding: '24px', boxShadow: C.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>🕐 آخر النشاطات</h3>
              <button style={{ fontSize: 12, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff, textDecoration: 'underline' }}>عرض الكل</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {DEMO_RECENT_ACTIVITY.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                  borderBottom: i < DEMO_RECENT_ACTIVITY.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}>
                  <span style={{ fontSize: 22, width: 36, textAlign: 'center', flexShrink: 0 }}>{a.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.customer}</span>
                      <ActivityBadge type={a.type} />
                    </div>
                    <span style={{ fontSize: 12, color: C.muted }}>{a.action}</span>
                  </div>
                  <span style={{ fontSize: 11, color: C.muted, flexShrink: 0, whiteSpace: 'nowrap' }}>{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TOP CUSTOMERS TABLE ──────────────────────────────────────────── */}
        <div style={{ background: C.white, border: C.border, borderRadius: 16, padding: '24px', boxShadow: C.shadow, marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>🏆 أفضل العملاء</h3>
            <button style={{ fontSize: 12, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff, textDecoration: 'underline' }}>عرض الكل</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: C.muted, fontWeight: 500, fontSize: 12 }}>#</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: C.muted, fontWeight: 500, fontSize: 12 }}>الاسم</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', color: C.muted, fontWeight: 500, fontSize: 12 }}>الزيارات</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', color: C.muted, fontWeight: 500, fontSize: 12 }}>الطوابع</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', color: C.muted, fontWeight: 500, fontSize: 12 }}>آخر زيارة</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_TOP_CUSTOMERS.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f5f5f5', transition: 'background 0.1s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 24, height: 24, borderRadius: '50%', fontSize: 12, fontWeight: 700,
                      background: i === 0 ? '#fef3c7' : i === 1 ? '#f0f0f0' : i === 2 ? '#fde8d0' : '#f5f5f5',
                      color: i === 0 ? '#b45309' : i === 1 ? '#6b7280' : i === 2 ? '#c2410c' : C.muted,
                    }}>
                      {i + 1}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'center' }}>{c.visits}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                    <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 10px', borderRadius: 20, fontWeight: 600, fontSize: 12 }}>{c.stamps}</span>
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'center', color: C.muted }}>{c.lastVisit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── QUICK ACTIONS CARDS ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { icon: '📣', title: 'إرسال حملة', desc: 'أرسل عرض أو تذكير لعملائك', bg: '#faf5ff', border: '#e9d5ff' },
            { icon: '🎫', title: 'تعديل البطاقة', desc: 'غيّر المكافأة أو عدد الطوابع', bg: '#eff6ff', border: '#bfdbfe' },
            { icon: '📊', title: 'تصدير البيانات', desc: 'حمّل تقرير العملاء كـ CSV', bg: '#f0fdf4', border: '#bbf7d0' },
            { icon: '⚙️', title: 'إعدادات المحل', desc: 'عدّل اسم المحل والشعار', bg: '#fefce8', border: '#fde68a' },
          ].map((action, i) => (
            <button key={i} style={{
              background: action.bg,
              border: `1px solid ${action.border}`,
              borderRadius: 14,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              cursor: 'pointer',
              textAlign: 'right',
              fontFamily: ff,
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = C.shadowMd; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
            >
              <span style={{ fontSize: 28 }}>{action.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{action.title}</span>
              <span style={{ fontSize: 12, color: C.muted }}>{action.desc}</span>
            </button>
          ))}
        </div>

        {/* Footer spacer */}
        <div style={{ height: 40 }} />
      </main>
    </div>
  );
}
