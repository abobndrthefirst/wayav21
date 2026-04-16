export default function FieldEditor({ label, value, onChange, maxLength = 40, placeholder, multiline, T }) {
  const len = (value || '').length
  const near = maxLength - len <= 5
  const over = len >= maxLength

  const props = {
    className: 'pd-field-input',
    value: value || '',
    onChange: (e) => onChange(e.target.value),
    placeholder,
    maxLength,
  }

  return (
    <div className="pd-field">
      <label>{label}</label>
      {multiline ? <textarea {...props} rows={2} /> : <input type="text" {...props} />}
      {maxLength && (
        <div className={`pd-char-count ${over ? 'over' : near ? 'warn' : ''}`}>
          {len}/{maxLength}
        </div>
      )}
    </div>
  )
}
