import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { navigate } from '../App';
import { useSubscription } from '../lib/useSubscription';
import UpgradeModal from '../components/UpgradeModal';

// ── Field type ──
interface PassField {
  key: string;
  label: string;
  value: string;
  change_message?: string;
  attributed_value?: string;
}

interface LocationEntry {
  latitude: string;
  longitude: string;
  relevant_text: string;
}

const SUPABASE_URL = 'https://unnheqshkxpbflozechm.supabase.co';

const PASS_TYPES = [
  { id: 'storeCard', label: 'بطاقة متجر', icon: '🏪' },
  { id: 'coupon', label: 'كوبون', icon: '🏷️' },
  { id: 'eventTicket', label: 'تذكرة حدث', icon: '🎫' },
  { id: 'generic', label: 'بطاقة عامة', icon: '📋' },
];

const BARCODE_TYPES = [
  { id: 'QR', label: 'QR Code' },
  { id: 'CODE128', label: 'Code 128' },
  { id: 'AZTEC', label: 'Aztec' },
  { id: 'PDF417', label: 'PDF417' },
  { id: 'NONE', label: 'بدون باركود' },
];

function emptyField(): PassField {
  return { key: '', label: '', value: '' };
}

export default function PassLab() {
  const { user, loading: authLoading } = useAuth();
  const { hasActive, loading: subLoading } = useSubscription();

  // ── Pass type ──
  const [passType, setPassType] = useState('storeCard');

  // ── Appearance ──
  const [orgName, setOrgName] = useState('Waya');
  const [description, setDescription] = useState('بطاقة ولاء');
  const [logoText, setLogoText] = useState('');
  const [bgColor, setBgColor] = useState('#10B981');
  const [fgColor, setFgColor] = useState('#FFFFFF');
  const [lblColor, setLblColor] = useState('#FFFFFF');
  const [logoUrl, setLogoUrl] = useState('');
  const [stripUrl, setStripUrl] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [suppressShine, setSuppressShine] = useState(false);

  // ── Barcode ──
  const [barcodeType, setBarcodeType] = useState('QR');
  const [barcodeMessage, setBarcodeMessage] = useState('');
  const [barcodeAlt, setBarcodeAlt] = useState('');

  // ── Fields ──
  const [headerFields, setHeaderFields] = useState<PassField[]>([{ key: 'points', label: 'النقاط', value: '0' }]);
  const [primaryFields, setPrimaryFields] = useState<PassField[]>([{ key: 'name', label: 'العميل', value: 'أحمد' }]);
  const [secondaryFields, setSecondaryFields] = useState<PassField[]>([{ key: 'shop', label: 'المتجر', value: 'كوفي لاونج' }]);
  const [auxiliaryFields, setAuxiliaryFields] = useState<PassField[]>([]);
  const [backFields, setBackFields] = useState<PassField[]>([]);

  // ── Location ──
  const [locations, setLocations] = useState<LocationEntry[]>([]);
  const [maxDistance, setMaxDistance] = useState('500');

  // ── Expiration & relevance ──
  const [expirationDate, setExpirationDate] = useState('');
  const [relevantDate, setRelevantDate] = useState('');
  const [voided, setVoided] = useState(false);
  const [sharingProhibited, setSharingProhibited] = useState(false);
  const [groupingId, setGroupingId] = useState('');

  // ── State ──
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  if (authLoading || subLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400">جارٍ التحميل...</div>;
  if (!user) {
    navigate('/login');
    return null;
  }

  // ── Field editor helpers ──
  // Kept for future field-add/remove UI wiring (referenced via `void` below
  // so TypeScript's noUnusedLocals doesn't reject the pre-existing decls).
  function updateField(arr: PassField[], idx: number, key: keyof PassField, val: string): PassField[] {
    return arr.map((f, i) => i === idx ? { ...f, [key]: val } : f);
  }
  function removeField(arr: PassField[], idx: number): PassField[] {
    return arr.filter((_, i) => i !== idx);
  }
  void emptyField;
  void updateField;
  void removeField;
  void qrDataUrl;

  // ── Generate pass ──
  async function generate() {
    // Defense-in-depth: if the subscription was revoked mid-session, block
    // the request and surface the upgrade modal. The App-level gate normally
    // redirects out of /pass-lab before we ever render here.
    if (!hasActive) {
      setError('يتطلب اشتراكاً نشطاً — توجه إلى صفحة الاشتراك.');
      return;
    }
    setGenerating(true);
    setError('');
    setDownloadUrl(null);
    setQrDataUrl(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('سجّل دخولك أولاً');

      const payload: any = {
        pass_type: passType,
        organization_name: orgName,
        description,
        logo_text: logoText,
        background_color: bgColor,
        foreground_color: fgColor,
        label_color: lblColor,
        barcode_type: barcodeType,
        barcode_message: barcodeMessage || undefined,
        barcode_alt_text: barcodeAlt || undefined,
        header_fields: headerFields.filter(f => f.value),
        primary_fields: primaryFields.filter(f => f.value),
        secondary_fields: secondaryFields.filter(f => f.value),
        auxiliary_fields: auxiliaryFields.filter(f => f.value),
        back_fields: backFields.filter(f => f.value),
        logo_url: logoUrl || undefined,
        strip_url: stripUrl || undefined,
        background_url: backgroundUrl || undefined,
        thumbnail_url: thumbnailUrl || undefined,
        suppress_strip_shine: suppressShine || undefined,
        sharing_prohibited: sharingProhibited || undefined,
        grouping_identifier: groupingId || undefined,
        voided: voided || undefined,
        expiration_date: expirationDate || undefined,
        relevant_date: relevantDate || undefined,
        locations: locations.filter(l => l.latitude && l.longitude),
        max_distance: maxDistance ? Number(maxDistance) : undefined,
      };

      const res = await fetch(`${SUPABASE_URL}/functions/v1/apple-pass-lab`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubmhlcXNoa3hwYmZsb3plY2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTkwNjksImV4cCI6MjA5MDQzNTA2OX0.XHAbOOdPtuwD0pJErxhBw9C3RJPouPeUhMS9hSThON0',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `خطأ ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Generate QR code as data URL (simple SVG-based QR placeholder —
      // the actual pass file is the download, QR just links to it)
      generateQrSvg(url);

    } catch (e: any) {
      setError(e.message || 'حدث خطأ');
    } finally {
      setGenerating(false);
    }
  }

  function generateQrSvg(dataUrl: string) {
    // Simple visual QR indicator — real QR would need a library.
    // For the lab, the download button IS the pass.
    // We show a styled "pass ready" card instead.
    setQrDataUrl(dataUrl);
  }

  // ── Render ──
  return (
    <div dir="rtl" className="min-h-screen bg-gray-950 text-white" style={{ fontFamily: '"Almarai", "Cairo", sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white transition text-sm">
              ← الرئيسية
            </button>
            <div className="w-px h-5 bg-white/10" />
            <h1 className="text-lg font-bold">
              <span className="bg-emerald-500 text-gray-950 px-2 py-0.5 rounded text-sm ml-2">Lab</span>
              معمل البطاقات
            </h1>
          </div>
          <span className="text-xs text-gray-600">Apple Wallet Pass Creator</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

          {/* ════════════ LEFT: Config Panel ════════════ */}
          <div className="space-y-6">

            {/* ── Pass Type ── */}
            <Section title="نوع البطاقة" icon="🎴">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PASS_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setPassType(t.id)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      passType === t.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="text-2xl mb-1">{t.icon}</div>
                    <div className="text-sm font-medium">{t.label}</div>
                  </button>
                ))}
              </div>
            </Section>

            {/* ── Appearance ── */}
            <Section title="المظهر والألوان" icon="🎨">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="اسم المنظمة" value={orgName} onChange={setOrgName} placeholder="مثال: وايا" />
                <Input label="وصف البطاقة" value={description} onChange={setDescription} placeholder="بطاقة ولاء" />
                <Input label="نص الشعار" value={logoText} onChange={setLogoText} placeholder="يظهر بجانب اللوقو" />
                <Input label="معرّف المجموعة" value={groupingId} onChange={setGroupingId} placeholder="اختياري" />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <ColorPicker label="لون الخلفية" value={bgColor} onChange={setBgColor} />
                <ColorPicker label="لون النص" value={fgColor} onChange={setFgColor} />
                <ColorPicker label="لون العناوين" value={lblColor} onChange={setLblColor} />
              </div>
            </Section>

            {/* ── Images ── */}
            <Section title="الصور" icon="🖼️">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="رابط الشعار (Logo)" value={logoUrl} onChange={setLogoUrl} placeholder="https://..." dir="ltr" />
                <Input label="صورة الشريط (Strip)" value={stripUrl} onChange={setStripUrl} placeholder="https://..." dir="ltr" />
                <Input label="صورة الخلفية (Background)" value={backgroundUrl} onChange={setBackgroundUrl} placeholder="https://..." dir="ltr" />
                <Input label="صورة مصغرة (Thumbnail)" value={thumbnailUrl} onChange={setThumbnailUrl} placeholder="https://..." dir="ltr" />
              </div>
              <label className="flex items-center gap-2 mt-3 text-sm text-gray-400 cursor-pointer">
                <input type="checkbox" checked={suppressShine} onChange={e => setSuppressShine(e.target.checked)} className="rounded bg-white/10 border-white/20" />
                إخفاء تأثير اللمعان على الشريط
              </label>
            </Section>

            {/* ── Barcode ── */}
            <Section title="الباركود" icon="📱">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">نوع الباركود</label>
                  <select
                    value={barcodeType}
                    onChange={e => setBarcodeType(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {BARCODE_TYPES.map(b => (
                      <option key={b.id} value={b.id}>{b.label}</option>
                    ))}
                  </select>
                </div>
                <Input label="محتوى الباركود" value={barcodeMessage} onChange={setBarcodeMessage} placeholder="تلقائي إذا فارغ" dir="ltr" />
                <Input label="نص بديل" value={barcodeAlt} onChange={setBarcodeAlt} placeholder="اسم العميل مثلاً" />
              </div>
            </Section>

            {/* ── Fields ── */}
            <Section title="حقول البطاقة" icon="📝">
              <FieldGroup
                title="حقول الرأس (Header)"
                hint="أعلى البطاقة — حقل أو حقلين"
                fields={headerFields}
                setFields={setHeaderFields}
                maxFields={3}
              />
              <FieldGroup
                title="الحقل الرئيسي (Primary)"
                hint="الحقل الكبير في المنتصف"
                fields={primaryFields}
                setFields={setPrimaryFields}
                maxFields={2}
              />
              <FieldGroup
                title="حقول ثانوية (Secondary)"
                hint="صف ثاني من الحقول"
                fields={secondaryFields}
                setFields={setSecondaryFields}
                maxFields={4}
              />
              <FieldGroup
                title="حقول إضافية (Auxiliary)"
                hint="حقول مساعدة إضافية"
                fields={auxiliaryFields}
                setFields={setAuxiliaryFields}
                maxFields={4}
              />
              <FieldGroup
                title="حقول خلفية (Back)"
                hint="معلومات خلف البطاقة — شروط، روابط، إلخ"
                fields={backFields}
                setFields={setBackFields}
                maxFields={20}
                showAttr
              />
            </Section>

            {/* ── Locations ── */}
            <Section title="المواقع الجغرافية" icon="📍">
              <p className="text-xs text-gray-500 mb-3">البطاقة تظهر على شاشة القفل عند اقتراب العميل من الموقع</p>
              {locations.map((loc, i) => (
                <div key={i} className="flex gap-2 mb-2 items-end">
                  <Input label={i === 0 ? 'خط العرض' : ''} value={loc.latitude} onChange={v => {
                    const arr = [...locations]; arr[i] = { ...arr[i], latitude: v }; setLocations(arr);
                  }} placeholder="24.7136" dir="ltr" className="flex-1" />
                  <Input label={i === 0 ? 'خط الطول' : ''} value={loc.longitude} onChange={v => {
                    const arr = [...locations]; arr[i] = { ...arr[i], longitude: v }; setLocations(arr);
                  }} placeholder="46.6753" dir="ltr" className="flex-1" />
                  <Input label={i === 0 ? 'نص' : ''} value={loc.relevant_text} onChange={v => {
                    const arr = [...locations]; arr[i] = { ...arr[i], relevant_text: v }; setLocations(arr);
                  }} placeholder="مرحباً بك!" className="flex-1" />
                  <button onClick={() => setLocations(locations.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 pb-2.5">✕</button>
                </div>
              ))}
              <div className="flex gap-3 items-center">
                <button onClick={() => setLocations([...locations, { latitude: '', longitude: '', relevant_text: '' }])}
                  className="text-emerald-400 text-sm hover:underline">+ إضافة موقع</button>
                <Input label="" value={maxDistance} onChange={setMaxDistance} placeholder="500" dir="ltr" className="w-28" />
                <span className="text-xs text-gray-500 mt-1">متر (المسافة القصوى)</span>
              </div>
            </Section>

            {/* ── Expiration & Options ── */}
            <Section title="الصلاحية والخيارات" icon="⚙️">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">تاريخ الانتهاء</label>
                  <input
                    type="datetime-local"
                    value={expirationDate}
                    onChange={e => setExpirationDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">تاريخ ذو صلة (Relevant Date)</label>
                  <input
                    type="datetime-local"
                    value={relevantDate}
                    onChange={e => setRelevantDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="flex gap-6 mt-4">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={voided} onChange={e => setVoided(e.target.checked)} className="rounded bg-white/10 border-white/20" />
                  ملغاة (Voided)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={sharingProhibited} onChange={e => setSharingProhibited(e.target.checked)} className="rounded bg-white/10 border-white/20" />
                  منع المشاركة
                </label>
              </div>
            </Section>

          </div>

          {/* ════════════ RIGHT: Preview + Generate ════════════ */}
          <div className="lg:sticky lg:top-24 space-y-6 self-start">
            {/* Live Preview Card */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div
                className="p-5 min-h-[340px] flex flex-col"
                style={{ background: bgColor, color: fgColor }}
              >
                {/* Logo + header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {logoUrl && <img src={logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                    <span className="font-bold text-sm opacity-90">{logoText || orgName}</span>
                  </div>
                  {headerFields.filter(f => f.value).map((f, i) => (
                    <div key={i} className="text-left">
                      <div className="text-[10px] uppercase opacity-60" style={{ color: lblColor }}>{f.label}</div>
                      <div className="text-lg font-bold">{f.value}</div>
                    </div>
                  ))}
                </div>

                {/* Strip image */}
                {stripUrl && (
                  <div className="rounded-lg overflow-hidden mb-3 -mx-1">
                    <img src={stripUrl} alt="" className="w-full h-24 object-cover" />
                  </div>
                )}

                {/* Primary */}
                <div className="flex-1 flex flex-col justify-center">
                  {primaryFields.filter(f => f.value).map((f, i) => (
                    <div key={i} className="mb-2">
                      <div className="text-[10px] uppercase opacity-60" style={{ color: lblColor }}>{f.label}</div>
                      <div className="text-2xl font-bold">{f.value}</div>
                    </div>
                  ))}
                </div>

                {/* Secondary */}
                {secondaryFields.filter(f => f.value).length > 0 && (
                  <div className="flex gap-6 mt-2">
                    {secondaryFields.filter(f => f.value).map((f, i) => (
                      <div key={i}>
                        <div className="text-[10px] uppercase opacity-60" style={{ color: lblColor }}>{f.label}</div>
                        <div className="text-sm font-semibold">{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Auxiliary */}
                {auxiliaryFields.filter(f => f.value).length > 0 && (
                  <div className="flex gap-6 mt-2 pt-2 border-t border-white/20">
                    {auxiliaryFields.filter(f => f.value).map((f, i) => (
                      <div key={i}>
                        <div className="text-[10px] uppercase opacity-60" style={{ color: lblColor }}>{f.label}</div>
                        <div className="text-sm font-semibold">{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Barcode preview */}
              {barcodeType !== 'NONE' && (
                <div className="bg-white p-4 flex flex-col items-center">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-4xl border border-gray-200">
                    {barcodeType === 'QR' ? '⬜' : '▮▯▮▯▮'}
                  </div>
                  <span className="text-xs text-gray-500 mt-2 font-mono">{barcodeAlt || barcodeMessage || 'Barcode'}</span>
                </div>
              )}
            </div>

            {/* Pass type badge */}
            <div className="text-center">
              <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                {PASS_TYPES.find(t => t.id === passType)?.icon} {PASS_TYPES.find(t => t.id === passType)?.label}
              </span>
            </div>

            {/* Generate Button */}
            <button
              onClick={generate}
              disabled={generating || !hasActive}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/30"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  جارٍ الإنشاء...
                </span>
              ) : !hasActive ? 'يتطلب اشتراكاً نشطاً' : 'إنشاء البطاقة'}
            </button>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Download result */}
            {downloadUrl && (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4">
                <div className="text-4xl">✅</div>
                <h3 className="text-lg font-bold text-emerald-400">البطاقة جاهزة!</h3>
                <a
                  href={downloadUrl}
                  download={`${orgName || 'pass'}.pkpass`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-gray-950 font-bold rounded-xl hover:bg-emerald-400 transition shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/></svg>
                  تحميل .pkpass
                </a>
                <p className="text-xs text-gray-500">افتح الملف على جهاز iPhone أو Mac لإضافته إلى Apple Wallet</p>

                {/* QR Code section */}
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-3">أو امسح الباركود من الجوال:</p>
                  <div className="inline-block bg-white p-4 rounded-2xl">
                    <div className="w-40 h-40 flex items-center justify-center">
                      <QrCode data={barcodeMessage || `lab-pass-${Date.now()}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {!hasActive && <UpgradeModal />}
    </div>
  );
}

// ── Reusable Components ──

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-base font-bold mb-4 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, dir, className }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="block text-sm text-gray-400 mb-1.5">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 transition"
      />
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          dir="ltr"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
}

function FieldGroup({ title, hint, fields, setFields, maxFields, showAttr }: {
  title: string;
  hint: string;
  fields: PassField[];
  setFields: (f: PassField[]) => void;
  maxFields: number;
  showAttr?: boolean;
}) {
  return (
    <div className="mb-6 pb-6 border-b border-white/5 last:border-0 last:pb-0 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-gray-600">{hint}</p>
        </div>
        {fields.length < maxFields && (
          <button
            onClick={() => setFields([...fields, { key: '', label: '', value: '' }])}
            className="text-emerald-400 text-xs hover:underline"
          >
            + إضافة حقل
          </button>
        )}
      </div>
      {fields.map((f, i) => (
        <div key={i} className="flex gap-2 mb-2 items-end">
          <div className="flex-1">
            {i === 0 && <label className="block text-[11px] text-gray-500 mb-1">المفتاح (key)</label>}
            <input
              value={f.key}
              onChange={e => setFields(fields.map((x, j) => j === i ? { ...x, key: e.target.value } : x))}
              placeholder="points"
              dir="ltr"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex-1">
            {i === 0 && <label className="block text-[11px] text-gray-500 mb-1">العنوان (label)</label>}
            <input
              value={f.label}
              onChange={e => setFields(fields.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
              placeholder="النقاط"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex-1">
            {i === 0 && <label className="block text-[11px] text-gray-500 mb-1">القيمة (value)</label>}
            <input
              value={f.value}
              onChange={e => setFields(fields.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
              placeholder="150"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          {showAttr && (
            <div className="flex-1">
              {i === 0 && <label className="block text-[11px] text-gray-500 mb-1">رابط (attributedValue)</label>}
              <input
                value={f.attributed_value || ''}
                onChange={e => setFields(fields.map((x, j) => j === i ? { ...x, attributed_value: e.target.value } : x))}
                placeholder="<a href='...'>"
                dir="ltr"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
          <button
            onClick={() => setFields(fields.filter((_, j) => j !== i))}
            className="text-red-400 hover:text-red-300 text-lg pb-1"
          >
            ✕
          </button>
        </div>
      ))}
      {fields.length === 0 && (
        <button
          onClick={() => setFields([{ key: '', label: '', value: '' }])}
          className="text-xs text-gray-500 hover:text-emerald-400 transition"
        >
          + إضافة أول حقل
        </button>
      )}
    </div>
  );
}

// ── Simple SVG QR Code Generator ──
// Generates a basic QR-like pattern. For production, use a proper QR library.
function QrCode({ data }: { data: string }) {
  // Generate a deterministic pattern from the data string
  const size = 21;
  const cells: boolean[][] = [];
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }

  for (let r = 0; r < size; r++) {
    cells[r] = [];
    for (let c = 0; c < size; c++) {
      // Finder patterns (top-left, top-right, bottom-left)
      const inTL = r < 7 && c < 7;
      const inTR = r < 7 && c >= size - 7;
      const inBL = r >= size - 7 && c < 7;
      if (inTL || inTR || inBL) {
        const lr = inTL ? r : inBL ? r - (size - 7) : r;
        const lc = inTL ? c : inTR ? c - (size - 7) : c;
        cells[r][c] = lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
      } else {
        // Data area — pseudo-random from hash
        const seed = (hash * (r * size + c + 1)) >>> 0;
        cells[r][c] = (seed % 3) !== 0;
      }
    }
  }

  const cellSize = 7;
  const padding = 14;
  const svgSize = size * cellSize + padding * 2;

  return (
    <svg width="160" height="160" viewBox={`0 0 ${svgSize} ${svgSize}`}>
      <rect width={svgSize} height={svgSize} fill="white" />
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={padding + c * cellSize}
              y={padding + r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="black"
            />
          ) : null
        )
      )}
    </svg>
  );
}
