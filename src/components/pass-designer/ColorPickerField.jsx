import { contrastRatio, contrastRating } from './contrast'

const COLOR_PRESETS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#1a1a2e', '#6366F1', '#D97706']

export default function ColorPickerField({ label, value, onChange, presets = COLOR_PRESETS, compareTo, T }) {
  const handleHex = (e) => {
    let v = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
    if (v.length === 6) onChange('#' + v)
  }

  const ratio = compareTo ? contrastRatio(value || '#000', compareTo) : null
  const rating = ratio != null ? contrastRating(ratio) : null
  const badgeClass = rating === 'AAA' || rating === 'AA'
    ? 'pd-contrast ok'
    : rating === 'AA-Large'
      ? 'pd-contrast warn'
      : 'pd-contrast fail'
  const badgeLabel = rating === 'Fail'
    ? (T ? T('Low contrast', 'تباين منخفض') : 'Low contrast')
    : rating === 'AA-Large'
      ? (T ? T('Large only', 'نص كبير فقط') : 'Large only')
      : rating

  return (
    <div className="pd-field">
      <label>
        {label}
        {ratio != null && (
          <span className={badgeClass} title={`${ratio.toFixed(2)}:1`}>
            {rating === 'Fail' ? '⚠ ' : '✓ '}{badgeLabel} ({ratio.toFixed(1)}:1)
          </span>
        )}
      </label>
      <div className="pd-color-row">
        {presets.map(c => (
          <button
            key={c}
            type="button"
            className={`pd-swatch ${value === c ? 'sel' : ''}`}
            style={{ background: c, border: c === '#FFFFFF' || c === '#fff' ? '1.5px solid #ccc' : undefined }}
            onClick={() => onChange(c)}
          />
        ))}
        <div className="pd-hex-wrap">
          #<input
            className="pd-hex-input"
            value={value?.replace('#', '') || ''}
            onChange={handleHex}
            maxLength={6}
            spellCheck={false}
          />
        </div>
        <input type="color" className="pd-color-native" value={value || '#000000'} onChange={e => onChange(e.target.value)} />
      </div>
    </div>
  )
}

export const TEXT_COLOR_PRESETS = ['#FFFFFF', '#000000', '#F1F5F9', '#1E293B', '#FEF3C7', '#ECFDF5']
