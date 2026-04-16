const COLOR_PRESETS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#1a1a2e', '#6366F1', '#D97706']

export default function ColorPickerField({ label, value, onChange, presets = COLOR_PRESETS }) {
  const handleHex = (e) => {
    let v = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
    if (v.length === 6) onChange('#' + v)
  }

  return (
    <div className="pd-field">
      <label>{label}</label>
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
