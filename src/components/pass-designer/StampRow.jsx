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
            {icon
              ? <img src={icon} alt="" style={{ opacity: filled ? 1 : 0.55 }} />
              : (filled ? <span>★</span> : <span style={{ opacity: .45 }}>★</span>)}
          </span>
        )
      })}
    </div>
  )
}
