// Stamp icons are hidden for now — we render the slot index as a number
// inside each circle instead of the reward icon. Flip the `showIcons`
// flag below to re-enable icon rendering.
const showIcons = false

export default function StampRow({ total, earned, icon, cardColor, textColor }) {
  const max = Math.min(total || 10, 12)
  return (
    <div className="pd-stamps" dir="ltr">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < earned
        const style = filled
          ? { background: cardColor, borderColor: cardColor, color: textColor }
          : { background: 'rgba(255,255,255,0.14)', borderColor: textColor, color: textColor }
        return (
          <span key={i} className={`pd-stamp ${filled ? 'filled' : ''}`} style={style}>
            {showIcons && icon
              ? <img src={icon} alt="" style={{ opacity: filled ? 1 : 0.55 }} />
              : <span style={{ fontSize: '0.75em', fontWeight: 700, opacity: filled ? 1 : 0.55 }}>{i + 1}</span>}
          </span>
        )
      })}
    </div>
  )
}
