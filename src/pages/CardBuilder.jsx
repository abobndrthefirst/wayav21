import React, { useState, useEffect } from 'react';

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

// ─── Brand Tokens ────────────────────────────────────────────────────────────
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
  shadowLg: '0 10px 30px rgba(0,0,0,0.12)',
  error: '#EF4444',
  success: '#16A34A',
};

const ff = '"Cairo", "Space Grotesk", sans-serif';

// ─── Templates ───────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'cafe',
    name: 'مقهى',
    nameEn: 'Café',
    icon: '☕',
    bgColor: '#4A2C2A',
    stampColor: '#D4A574',
    textColor: '#FFFFFF',
    stamps: 8,
    reward: 'قهوة مجانية',
    rewardEn: 'Free Coffee',
    stampIcon: '☕',
    description: 'اشترِ ٨ قهوات واحصل على واحدة مجاناً',
  },
  {
    id: 'restaurant',
    name: 'مطعم',
    nameEn: 'Restaurant',
    icon: '🍽️',
    bgColor: '#1B5E20',
    stampColor: '#A5D6A7',
    textColor: '#FFFFFF',
    stamps: 10,
    reward: 'وجبة مجانية',
    rewardEn: 'Free Meal',
    stampIcon: '🍽️',
    description: 'اجمع ١٠ طوابع واحصل على وجبة مجانية',
  },
  {
    id: 'salon',
    name: 'صالون',
    nameEn: 'Salon',
    icon: '✂️',
    bgColor: '#880E4F',
    stampColor: '#F48FB1',
    textColor: '#FFFFFF',
    stamps: 6,
    reward: 'خدمة مجانية',
    rewardEn: 'Free Service',
    stampIcon: '✂️',
    description: 'اجمع ٦ طوابع واحصل على خدمة مجانية',
  },
  {
    id: 'retail',
    name: 'متجر',
    nameEn: 'Retail',
    icon: '🛍️',
    bgColor: '#E65100',
    stampColor: '#FFCC80',
    textColor: '#FFFFFF',
    stamps: 12,
    reward: 'خصم ٢٠٪',
    rewardEn: '20% Discount',
    stampIcon: '🛍️',
    description: 'اجمع ١٢ طابع واحصل على خصم ٢٠٪',
  },
  {
    id: 'gym',
    name: 'نادي رياضي',
    nameEn: 'Gym',
    icon: '💪',
    bgColor: '#1A237E',
    stampColor: '#82B1FF',
    textColor: '#FFFFFF',
    stamps: 10,
    reward: 'شهر مجاني',
    rewardEn: 'Free Month',
    stampIcon: '💪',
    description: 'اجمع ١٠ طوابع واحصل على شهر مجاني',
  },
  {
    id: 'bakery',
    name: 'مخبز',
    nameEn: 'Bakery',
    icon: '🥐',
    bgColor: '#F57F17',
    stampColor: '#FFF9C4',
    textColor: '#3E2723',
    stamps: 8,
    reward: 'كيكة مجانية',
    rewardEn: 'Free Cake',
    stampIcon: '🥐',
    description: 'اجمع ٨ طوابع واحصل على كيكة مجانية',
  },
  {
    id: 'custom',
    name: 'مخصص',
    nameEn: 'Custom',
    icon: '🎨',
    bgColor: '#191A23',
    stampColor: '#B9FF66',
    textColor: '#FFFFFF',
    stamps: 10,
    reward: '',
    rewardEn: '',
    stampIcon: '⭐',
    description: 'صمم بطاقتك من الصفر',
  },
];

const STAMP_ICONS = ['☕', '🍽️', '✂️', '🛍️', '💪', '🥐', '⭐', '🎯', '💎', '❤️', '🔥', '🌟', '🎁', '👑', '🍕', '🧁'];

// Types removed (converted from TypeScript)

// ─── Wizard Steps ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'template', label: 'القالب', labelEn: 'Template' },
  { id: 'design', label: 'التصميم', labelEn: 'Card Design' },
  { id: 'rewards', label: 'المكافآت', labelEn: 'Rewards' },
  { id: 'location', label: 'الموقع', labelEn: 'Location' },
  { id: 'review', label: 'المراجعة', labelEn: 'Review' },
];

// ─── Phone Mockup Component ──────────────────────────────────────────────────
function PhoneMockup({ config }) {
  const filledStamps = Math.min(Math.floor(config.stamps * 0.6), config.stamps);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>معاينة البطاقة</div>

      {/* Phone frame */}
      <div style={{
        width: 280,
        height: 520,
        background: '#1C1C1E',
        borderRadius: 36,
        padding: '12px 10px',
        boxShadow: C.shadowLg,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Notch */}
        <div style={{
          width: 120, height: 28, background: '#1C1C1E', borderRadius: '0 0 16px 16px',
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        }} />

        {/* Screen */}
        <div style={{
          width: '100%', height: '100%', background: '#F5F5F5', borderRadius: 28,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {/* Status bar */}
          <div style={{
            height: 36, background: config.bgColor, display: 'flex', alignItems: 'center',
            justifyContent: 'center', paddingTop: 8,
          }}>
            <span style={{ fontSize: 10, color: config.textColor, opacity: 0.7 }}>9:41</span>
          </div>

          {/* Card header */}
          <div style={{
            background: config.bgColor, padding: '12px 16px 20px', textAlign: 'center',
          }}>
            {/* Logo placeholder */}
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.15)',
              margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, border: '1px solid rgba(255,255,255,0.2)',
            }}>
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="" style={{ width: 36, height: 36, borderRadius: 8 }} />
              ) : (
                TEMPLATES.find(t => t.id === config.templateId)?.icon || '🏪'
              )}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700, color: config.textColor,
              fontFamily: ff, letterSpacing: 0.5,
            }}>
              {config.cardNameAr || config.cardName || 'اسم البطاقة'}
            </div>
            <div style={{
              fontSize: 10, color: config.textColor, opacity: 0.7, fontFamily: ff, marginTop: 2,
            }}>
              {config.businessName || 'اسم المتجر'}
            </div>
          </div>

          {/* Stamps grid */}
          <div style={{ padding: '16px 14px', flex: 1 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(config.stamps, 5)}, 1fr)`,
              gap: 6,
              maxWidth: 220,
              margin: '0 auto',
            }}>
              {Array.from({ length: config.stamps }, (_, i) => {
                const isFilled = i < filledStamps;
                const isGift = i === config.stamps - 1;
                return (
                  <div key={i} style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: isFilled ? config.stampColor : 'rgba(0,0,0,0.06)',
                    border: isFilled ? `1.5px solid ${config.bgColor}` : '1.5px solid rgba(0,0,0,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isFilled ? 16 : 12,
                    transition: 'all 0.2s ease',
                  }}>
                    {isGift ? '🎁' : isFilled ? config.stampIcon : (
                      <span style={{ color: '#C0C0C0', fontSize: 10 }}>{i + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress text */}
            <div style={{
              textAlign: 'center', marginTop: 12, fontSize: 10, color: '#888',
              fontFamily: ff,
            }}>
              {filledStamps}/{config.stamps} — {config.stamps - filledStamps} متبقي للمكافأة
            </div>

            {/* Stamp Me button */}
            <div style={{
              marginTop: 14, textAlign: 'center',
            }}>
              <div style={{
                display: 'inline-block', padding: '8px 28px', borderRadius: 20,
                background: config.bgColor, color: config.textColor,
                fontSize: 12, fontWeight: 700, fontFamily: ff,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                STAMP ME
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div style={{
            height: 44, borderTop: '1px solid #E5E5EA',
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
            padding: '0 20px', background: '#FFFFFF',
          }}>
            <span style={{ fontSize: 16, opacity: 0.4 }}>👤</span>
            <span style={{ fontSize: 16, opacity: 0.4 }}>🎁</span>
            <span style={{ fontSize: 16, opacity: 0.4 }}>⚙️</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', textAlign: 'center' }}>
        معاينة توضيحية فقط — الشكل الفعلي قد يختلف قليلاً
      </div>
    </div>
  );
}

// ─── Color Picker Component ──────────────────────────────────────────────────
function ColorPicker({ label, value, onChange }) {
  const presets = ['#191A23', '#4A2C2A', '#1B5E20', '#880E4F', '#E65100', '#1A237E', '#F57F17', '#00695C', '#4A148C', '#B71C1C'];

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 8, fontFamily: ff }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {presets.map(color => (
          <div
            key={color}
            onClick={() => onChange(color)}
            style={{
              width: 28, height: 28, borderRadius: 8, background: color, cursor: 'pointer',
              border: value === color ? '3px solid #B9FF66' : '2px solid transparent',
              boxShadow: value === color ? '0 0 0 1px #191A23' : 'none',
              transition: 'all 0.15s ease',
            }}
          />
        ))}
        {/* Custom color input */}
        <div style={{ position: 'relative' }}>
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
              width: 28, height: 28, borderRadius: 8, border: '2px dashed #CBD5E1',
              cursor: 'pointer', padding: 0, background: 'none',
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{value}</span>
      </div>
    </div>
  );
}

// ─── Input Field Component ───────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, dir, type, textarea, required }) {
  const shared = {
    value,
    onChange: (e) => onChange(e.target.value),
    placeholder,
    dir: dir || 'rtl',
    style: {
      width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
      border: '1px solid #E5E7EB', fontFamily: ff, outline: 'none',
      transition: 'border-color 0.15s ease', background: '#FAFAFA',
      minHeight: textarea ? 80 : 'auto', resize: textarea ? 'vertical'  : 'none' ,
    },
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6, fontFamily: ff }}>
        {label} {required && <span style={{ color: C.error }}>*</span>}
      </label>
      {textarea ? <textarea {...shared} /> : <input type={type || 'text'} {...shared} />}
    </div>
  );
}

// ─── Main Card Builder ───────────────────────────────────────────────────────
export default function CardBuilder() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    templateId: '',
    cardName: '',
    cardNameAr: '',
    businessName: '',
    description: '',
    bgColor: '#191A23',
    stampColor: '#B9FF66',
    textColor: '#FFFFFF',
    stamps: 10,
    stampIcon: '⭐',
    logoUrl: '',
    rewards: [{
      id: '1', type: 'main', name: 'Free Item', nameAr: 'منتج مجاني',
      stampsRequired: 10, hasExpiry: false, expiryDays: 30,
    }],
    location: {
      businessName: '', address: '', city: '', country: 'Saudi Arabia', phone: '', website: '',
    },
    termsAndConditions: '',
    isPublic: true,
    stampingDelay: 0,
  });

  const updateConfig = (updates) => setConfig(prev => ({ ...prev, ...updates }));
  const updateLocation = (updates) =>
    setConfig(prev => ({ ...prev, location: { ...prev.location, ...updates } }));

  const canProceed = () => {
    switch (step) {
      case 0: return config.templateId !== '';
      case 1: return config.cardNameAr !== '' || config.cardName !== '';
      case 2: return config.rewards.length > 0 && config.rewards[0].nameAr !== '';
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  // ─── Step 0: Template Selection ─────────────────────────────────────────
  const renderTemplateStep = () => (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', fontFamily: ff }}>اختر قالباً</h2>
      <p style={{ fontSize: 14, color: C.muted, margin: '0 0 24px', fontFamily: ff }}>
        اختر قالباً يناسب نشاطك التجاري — يمكنك تخصيصه بالكامل بعد ذلك
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 14,
      }}>
        {TEMPLATES.map(t => {
          const isSelected = config.templateId === t.id;
          return (
            <div
              key={t.id}
              onClick={() => {
                updateConfig({
                  templateId: t.id,
                  bgColor: t.bgColor,
                  stampColor: t.stampColor,
                  textColor: t.textColor,
                  stamps: t.stamps,
                  stampIcon: t.stampIcon,
                  cardNameAr: t.name !== 'مخصص' ? '' : config.cardNameAr,
                  rewards: [{
                    ...config.rewards[0],
                    nameAr: t.reward,
                    name: t.rewardEn,
                    stampsRequired: t.stamps,
                  }],
                });
              }}
              style={{
                background: C.white,
                border: isSelected ? `2px solid ${C.lime}` : '1px solid #E5E7EB',
                borderRadius: 16,
                padding: 20,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? `0 0 0 3px rgba(185,255,102,0.3)` : C.shadow,
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                textAlign: 'center',
              }}
            >
              {/* Mini card preview */}
              <div style={{
                width: '100%', height: 80, borderRadius: 10, background: t.bgColor,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', marginBottom: 12, position: 'relative',
                overflow: 'hidden',
              }}>
                <span style={{ fontSize: 28, marginBottom: 4 }}>{t.icon}</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: Math.min(t.stamps, 5) }, (_, i) => (
                    <div key={i} style={{
                      width: 10, height: 10, borderRadius: 4,
                      background: i < 3 ? t.stampColor : 'rgba(255,255,255,0.2)',
                    }} />
                  ))}
                </div>
              </div>

              <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, fontFamily: ff }}>{t.name}</div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: ff }}>{t.nameEn}</div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: ff, marginTop: 4 }}>
                {t.stamps} طابع
              </div>

              {isSelected && (
                <div style={{
                  marginTop: 8, fontSize: 11, fontWeight: 600, color: C.green,
                  background: '#F0FDF4', padding: '3px 10px', borderRadius: 20,
                  display: 'inline-block',
                }}>
                  ✓ تم الاختيار
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── Step 1: Card Design ────────────────────────────────────────────────
  const renderDesignStep = () => (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', fontFamily: ff }}>تصميم البطاقة</h2>
      <p style={{ fontSize: 14, color: C.muted, margin: '0 0 24px', fontFamily: ff }}>
        خصص شكل بطاقتك — الألوان والأيقونات والمعلومات
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', fontFamily: ff }}>البطاقة الأمامية</h3>

          <Field label="اسم البطاقة (عربي)" value={config.cardNameAr} onChange={v => updateConfig({ cardNameAr: v })}
            placeholder="مثال: بطاقة قهوتي" required />

          <Field label="Card Name (English)" value={config.cardName} onChange={v => updateConfig({ cardName: v })}
            placeholder="e.g. My Coffee Card" dir="ltr" />

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6, fontFamily: ff }}>
              عدد الطوابع <span style={{ color: C.error }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range" min="4" max="20" value={config.stamps}
                onChange={e => updateConfig({ stamps: parseInt(e.target.value) })}
                style={{ flex: 1, accentColor: C.dark }}
              />
              <span style={{
                fontSize: 20, fontWeight: 800, color: C.dark, minWidth: 36,
                textAlign: 'center', fontFamily: ff,
              }}>
                {config.stamps}
              </span>
            </div>
          </div>

          <Field label="وصف البطاقة" value={config.description} onChange={v => updateConfig({ description: v })}
            placeholder="مثال: اشترِ ٨ قهوات واحصل على واحدة مجاناً" textarea />
        </div>

        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', fontFamily: ff }}>البطاقة الخلفية</h3>

          <Field label="اسم المتجر" value={config.businessName} onChange={v => updateConfig({ businessName: v })}
            placeholder="اسم متجرك" required />

          <Field label="الشروط والأحكام" value={config.termsAndConditions}
            onChange={v => updateConfig({ termsAndConditions: v })}
            placeholder="مثال: طابع واحد لكل عملية شراء. المكافآت صالحة لمدة ٣٠ يوماً." textarea />

          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, fontFamily: ff }}>
              البطاقة عامة
            </label>
            <div
              onClick={() => updateConfig({ isPublic: !config.isPublic })}
              style={{
                width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                background: config.isPublic ? C.lime : '#CBD5E1',
                position: 'relative', transition: 'background 0.2s ease',
                border: config.isPublic ? `1px solid ${C.dark}` : '1px solid #CBD5E1',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 9, background: C.white,
                position: 'absolute', top: 2,
                left: config.isPublic ? undefined : 2,
                right: config.isPublic ? 2 : undefined,
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Colors Section */}
      <div style={{
        marginTop: 20, padding: 20, background: '#FAFAFA', borderRadius: 14,
        border: '1px solid #E5E7EB',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', fontFamily: ff }}>🎨 الألوان</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <ColorPicker label="لون الخلفية" value={config.bgColor} onChange={v => updateConfig({ bgColor: v })} />
          <ColorPicker label="لون الطوابع" value={config.stampColor} onChange={v => updateConfig({ stampColor: v })} />
          <ColorPicker label="لون النص" value={config.textColor} onChange={v => updateConfig({ textColor: v })} />
        </div>
      </div>

      {/* Stamp Icon Section */}
      <div style={{
        marginTop: 16, padding: 20, background: '#FAFAFA', borderRadius: 14,
        border: '1px solid #E5E7EB',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', fontFamily: ff }}>أيقونة الطابع</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STAMP_ICONS.map(icon => (
            <div
              key={icon}
              onClick={() => updateConfig({ stampIcon: icon })}
              style={{
                width: 40, height: 40, borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
                background: config.stampIcon === icon ? C.lime : '#F0F0F0',
                border: config.stampIcon === icon ? `2px solid ${C.dark}` : '1px solid #E5E7EB',
                transition: 'all 0.15s ease',
              }}
            >
              {icon}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Step 2s ────────────────────────────────────────────────────
  const renderRewardsStep = () => {
    const addReward = (type) => {
      updateConfig({
        rewards: [...config.rewards, {
          id: Date.now().toString(), type, name: '', nameAr: '',
          stampsRequired: type === 'main' ? config.stamps : Math.floor(config.stamps / 2),
          hasExpiry: false, expiryDays: 30,
        }],
      });
    };

    const updateReward = (id, updates) => {
      updateConfig({
        rewards: config.rewards.map(r => r.id === id ? { ...r, ...updates } : r),
      });
    };

    const removeReward = (id) => {
      updateConfig({ rewards: config.rewards.filter(r => r.id !== id) });
    };

    const rewardTypeConfig = {
      main: { label: 'المكافأة الرئيسية', labelEn: 'Main Reward', icon: '🎁', color: '#16A34A', bg: '#F0FDF4', desc: 'تُصرف تلقائياً عند إكمال جميع الطوابع' },
      signup: { label: 'مكافأة التسجيل', labelEn: 'Sign Up Reward', icon: '👋', color: '#2563EB', bg: '#EFF6FF', desc: 'تُصرف عند تسجيل العميل لأول مرة' },
      interim: { label: 'مكافأة مرحلية', labelEn: 'Interim Reward', icon: '🎯', color: '#9333EA', bg: '#FAF5FF', desc: 'تُصرف عند الوصول لعدد معين من الطوابع' },
    };

    return (
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', fontFamily: ff }}>المكافآت</h2>
        <p style={{ fontSize: 14, color: C.muted, margin: '0 0 8px', fontFamily: ff }}>
          اصنع مكافآت يحبها عملاؤك!
        </p>
        <p style={{ fontSize: 12, color: C.muted, margin: '0 0 24px', fontFamily: ff, opacity: 0.7 }}>
          ملاحظة: القسائم داخل التطبيق تُنشأ تلقائياً. إذا كنت لا تريدها، تواصل معنا.
        </p>

        {/* Add Reward Buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {(['main', 'signup', 'interim'] ).map(type => {
            const tc = rewardTypeConfig[type];
            const exists = config.rewards.some(r => r.type === type && type !== 'interim');
            return (
              <button
                key={type}
                onClick={() => addReward(type)}
                disabled={exists && type !== 'interim'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px', borderRadius: 10,
                  background: exists && type !== 'interim' ? '#F0F0F0' : tc.bg,
                  border: `1px solid ${exists && type !== 'interim' ? '#E5E7EB' : tc.color}20`,
                  color: exists && type !== 'interim' ? '#999' : tc.color,
                  fontSize: 13, fontWeight: 600, cursor: exists && type !== 'interim' ? 'default' : 'pointer',
                  fontFamily: ff, transition: 'all 0.15s ease',
                  opacity: exists && type !== 'interim' ? 0.5 : 1,
                }}
              >
                <span>{tc.icon}</span> + {tc.label}
              </button>
            );
          })}
        </div>

        {/* Rewards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {config.rewards.map(reward => {
            const tc = rewardTypeConfig[reward.type];
            return (
              <div key={reward.id} style={{
                background: C.white, border: '1px solid #E5E7EB', borderRadius: 14,
                padding: 20, position: 'relative',
              }}>
                {/* Type badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: tc.bg, color: tc.color,
                    }}>
                      {tc.icon} {tc.label}
                    </span>
                    <span style={{ fontSize: 11, color: C.muted }}>{tc.desc}</span>
                  </div>
                  {config.rewards.length > 1 && (
                    <button onClick={() => removeReward(reward.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 16, color: C.error, padding: 4,
                    }}>✕</button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="اسم المكافأة (عربي)" value={reward.nameAr}
                    onChange={v => updateReward(reward.id, { nameAr: v })}
                    placeholder="مثال: قهوة مجانية" required />

                  <Field label="Reward Name (English)" value={reward.name}
                    onChange={v => updateReward(reward.id, { name: v })}
                    placeholder="e.g. Free Coffee" dir="ltr" />
                </div>

                {reward.type !== 'signup' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: ff }}>
                      بعد <strong style={{ fontSize: 18 }}>{reward.stampsRequired}</strong> طابع
                    </span>
                  </div>
                )}

                {/* Expiry toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                  <span style={{ fontSize: 13, fontFamily: ff, color: C.muted }}>انتهاء الصلاحية</span>
                  <div
                    onClick={() => updateReward(reward.id, { hasExpiry: !reward.hasExpiry })}
                    style={{
                      width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
                      background: reward.hasExpiry ? C.lime : '#CBD5E1',
                      position: 'relative', transition: 'background 0.2s ease',
                    }}
                  >
                    <div style={{
                      width: 14, height: 14, borderRadius: 7, background: C.white,
                      position: 'absolute', top: 3,
                      left: reward.hasExpiry ? undefined : 3,
                      right: reward.hasExpiry ? 3 : undefined,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                  {reward.hasExpiry && (
                    <span style={{ fontSize: 12, color: C.muted }}>
                      {reward.expiryDays} يوم
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Step 3: Location ───────────────────────────────────────────────────
  const renderLocationStep = () => (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', fontFamily: ff }}>الموقع والبيانات</h2>
      <p style={{ fontSize: 14, color: C.muted, margin: '0 0 24px', fontFamily: ff }}>
        أضف بيانات متجرك ليتمكن العملاء من الوصول إليك
      </p>

      <div style={{
        background: C.white, border: '1px solid #E5E7EB', borderRadius: 14, padding: 24,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="اسم المتجر" value={config.location.businessName}
            onChange={v => updateLocation({ businessName: v })}
            placeholder="اسم المتجر كما يظهر للعملاء" required />

          <Field label="رقم الهاتف" value={config.location.phone}
            onChange={v => updateLocation({ phone: v })}
            placeholder="+966 5XX XXX XXXX" dir="ltr" />

          <Field label="العنوان" value={config.location.address}
            onChange={v => updateLocation({ address: v })}
            placeholder="الحي، الشارع" />

          <Field label="المدينة" value={config.location.city}
            onChange={v => updateLocation({ city: v })}
            placeholder="الرياض" />

          <Field label="البلد" value={config.location.country}
            onChange={v => updateLocation({ country: v })}
            placeholder="المملكة العربية السعودية" />

          <Field label="الموقع الإلكتروني" value={config.location.website}
            onChange={v => updateLocation({ website: v })}
            placeholder="https://yoursite.com" dir="ltr" />
        </div>

        {/* Logo upload placeholder */}
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 8, fontFamily: ff }}>
            الشعار
          </label>
          <div style={{
            width: 128, height: 128, borderRadius: 16,
            border: '2px dashed #CBD5E1', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'border-color 0.2s ease',
            background: '#FAFAFA',
          }}>
            <span style={{ fontSize: 24, marginBottom: 4 }}>📤</span>
            <span style={{ fontSize: 12, color: C.muted, fontFamily: ff }}>رفع الشعار</span>
            <span style={{ fontSize: 10, color: '#B0B0B0', fontFamily: ff }}>128×128px JPG/PNG</span>
          </div>

          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 12, color: C.muted, fontFamily: ff, display: 'block', marginBottom: 6 }}>
              أو اختر أيقونة:
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['💎', '😍', '😎', '🎁', '❤️', '🏆', '⭐', '🏪'].map(icon => (
                <div key={icon} style={{
                  width: 44, height: 44, borderRadius: 10, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, background: '#F0F0F0', border: '1px solid #E5E7EB',
                  transition: 'all 0.15s ease',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#E8E8E8')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#F0F0F0')}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Step 4: Review ─────────────────────────────────────────────────────
  const renderReviewStep = () => (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', fontFamily: ff }}>المراجعة</h2>
      <p style={{ fontSize: 14, color: C.muted, margin: '0 0 24px', fontFamily: ff }}>
        راجع بطاقتك قبل النشر — يمكنك تعديلها لاحقاً في أي وقت
      </p>

      {/* Summary card */}
      <div style={{
        background: C.white, border: '1px solid #E5E7EB', borderRadius: 16, padding: 24,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, fontFamily: ff }}>
            👋 يبدو رائعاً!
          </h3>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
            background: config.isPublic ? '#F0FDF4' : '#FEF3C7',
            color: config.isPublic ? '#16A34A' : '#92400E',
          }}>
            {config.isPublic ? 'عامة' : 'خاصة'}
          </span>
        </div>

        <p style={{ fontSize: 14, color: C.muted, margin: '0 0 20px', fontFamily: ff }}>
          ملخص بطاقة <strong>{config.cardNameAr || config.cardName}</strong>
        </p>

        {/* Card Design Summary */}
        <div style={{
          background: '#FAFAFA', borderRadius: 12, padding: 16, marginBottom: 14,
          border: '1px solid #E5E7EB',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, fontFamily: ff }}>تصميم البطاقة</h4>
            <button onClick={() => setStep(1)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 16, color: C.muted, padding: 4,
            }}>✏️</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, fontFamily: ff }}>
            <div><span style={{ color: C.muted }}>الطوابع المطلوبة:</span> <strong>{config.stamps}</strong></div>
            <div><span style={{ color: C.muted }}>اسم المتجر:</span> <strong>{config.businessName || '—'}</strong></div>
            <div><span style={{ color: C.muted }}>الوصف:</span> <strong>{config.description || '—'}</strong></div>
            <div>
              <span style={{ color: C.muted }}>الألوان: </span>
              <span style={{ display: 'inline-flex', gap: 4, verticalAlign: 'middle' }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: config.bgColor, display: 'inline-block', border: '1px solid #E5E7EB' }} />
                <span style={{ width: 14, height: 14, borderRadius: 4, background: config.stampColor, display: 'inline-block', border: '1px solid #E5E7EB' }} />
              </span>
            </div>
          </div>
        </div>

        {/* Rewards Summary */}
        <div style={{
          background: '#FAFAFA', borderRadius: 12, padding: 16, marginBottom: 14,
          border: '1px solid #E5E7EB',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, fontFamily: ff }}>المكافآت</h4>
            <button onClick={() => setStep(2)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 16, color: C.muted, padding: 4,
            }}>✏️</button>
          </div>
          {config.rewards.map(r => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: '1px solid #E5E7EB', fontSize: 13, fontFamily: ff,
            }}>
              <span style={{ fontSize: 20 }}>🎁</span>
              <div>
                <div style={{ fontWeight: 600 }}>{r.nameAr || r.name || 'بدون اسم'}</div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {r.type === 'signup' ? 'عند التسجيل' : `بعد ${r.stampsRequired} طابع`}
                  {r.hasExpiry ? ` · صالحة ${r.expiryDays} يوم` : ' · بدون انتهاء'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Location Summary */}
        <div style={{
          background: '#FAFAFA', borderRadius: 12, padding: 16,
          border: '1px solid #E5E7EB',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, fontFamily: ff }}>الموقع</h4>
            <button onClick={() => setStep(3)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 16, color: C.muted, padding: 4,
            }}>✏️</button>
          </div>
          <div style={{ fontSize: 13, fontFamily: ff }}>
            <div><span style={{ color: C.muted }}>المتجر:</span> <strong>{config.location.businessName || '—'}</strong></div>
            <div><span style={{ color: C.muted }}>العنوان:</span> {config.location.address || '—'}, {config.location.city || '—'}</div>
            <div><span style={{ color: C.muted }}>الهاتف:</span> {config.location.phone || '—'}</div>
            {config.location.website && (
              <div><span style={{ color: C.muted }}>الموقع:</span> <a href={config.location.website} style={{ color: '#2563EB' }}>{config.location.website}</a></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const stepRenderers = [renderTemplateStep, renderDesignStep, renderRewardsStep, renderLocationStep, renderReviewStep];

  return (
    <div dir="rtl" style={{ fontFamily: ff, background: '#F8F9FB', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <header style={{
        background: C.white, borderBottom: '1px solid #E5E7EB', padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4,
          }}>→</button>
          <div style={{
            width: 32, height: 32, background: C.lime, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: C.dark,
          }}>W</div>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.dark }}>إنشاء بطاقة جديدة</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/dashboard')} style={{
            padding: '8px 18px', borderRadius: 8, background: 'none',
            border: '1px solid #E5E7EB', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: ff, color: C.muted,
          }}>
            حفظ وخروج
          </button>
        </div>
      </header>

      {/* ── Step Progress Bar ────────────────────────────────────────────── */}
      <div style={{
        background: C.white, padding: '16px 32px', borderBottom: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0,
      }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div
              onClick={() => i <= step ? setStep(i) : null}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: i <= step ? 'pointer' : 'default',
                opacity: i <= step ? 1 : 0.4,
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: i < step ? C.lime : i === step ? C.dark : '#E5E7EB',
                color: i < step ? C.dark : i === step ? C.white : '#999',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                border: i === step ? `2px solid ${C.dark}` : 'none',
                transition: 'all 0.2s ease',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 11, fontWeight: i === step ? 700 : 400,
                color: i === step ? C.dark : C.muted,
                marginTop: 4, fontFamily: ff, whiteSpace: 'nowrap',
              }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, maxWidth: 80,
                background: i < step ? C.lime : '#E5E7EB',
                margin: '0 8px', marginBottom: 18,
                borderRadius: 1, transition: 'background 0.3s ease',
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Main Content: Form + Preview ──────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: step === 0 ? '1fr' : '1fr 320px',
        gap: 0, maxWidth: 1200, margin: '0 auto', width: '100%',
      }}>
        {/* Form area */}
        <div style={{ padding: '28px 32px', overflow: 'auto' }}>
          {stepRenderers[step]()}

          {/* Navigation buttons */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 32,
            paddingTop: 20, borderTop: '1px solid #E5E7EB',
          }}>
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              style={{
                padding: '12px 24px', borderRadius: 10,
                background: 'none', border: '1px solid #E5E7EB',
                fontSize: 14, fontWeight: 600, cursor: step === 0 ? 'default' : 'pointer',
                fontFamily: ff, color: step === 0 ? '#CBD5E1' : C.dark,
                opacity: step === 0 ? 0.5 : 1,
              }}
            >
              ← السابق
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
                disabled={!canProceed()}
                style={{
                  padding: '12px 32px', borderRadius: 10,
                  background: canProceed() ? C.lime : '#E5E7EB',
                  border: canProceed() ? `1.5px solid ${C.dark}` : '1px solid #E5E7EB',
                  fontSize: 14, fontWeight: 700, cursor: canProceed() ? 'pointer' : 'default',
                  fontFamily: ff, color: canProceed() ? C.dark : '#999',
                  boxShadow: canProceed() ? `3px 3px 0 ${C.dark}` : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                التالي →
              </button>
            ) : (
              <button
                onClick={() => {
                  // TODO: Save to Supabase
                  alert('🎉 تم نشر البطاقة بنجاح!');
                  navigate('/dashboard');
                }}
                style={{
                  padding: '12px 40px', borderRadius: 10,
                  background: C.lime, border: `1.5px solid ${C.dark}`,
                  fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  fontFamily: ff, color: C.dark,
                  boxShadow: `3px 3px 0 ${C.dark}`,
                  transition: 'all 0.15s ease',
                }}
              >
                🚀 نشر البطاقة
              </button>
            )}
          </div>
        </div>

        {/* Live Preview (shown on all steps except template) */}
        {step > 0 && (
          <div style={{
            padding: '28px 20px', borderRight: '1px solid #E5E7EB',
            background: '#FAFAFA', position: 'sticky', top: 120,
            height: 'fit-content', display: 'flex', justifyContent: 'center',
          }}>
            <PhoneMockup config={config} />
          </div>
        )}
      </div>
    </div>
  );
}
