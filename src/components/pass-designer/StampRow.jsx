export default function StampRow({ total, earned, icon, textColor }) {
  const max = Math.min(total || 10, 12)
  return (
    <div className="pd-stamps" dir="ltr">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < earned
        return (
          <span key={i} className={`pd-stamp ${filled ? 'filled' : ''}`} style={{ borderColor: textColor, color: textColor }}>
            {filled && icon ? (
              <img src={icon} alt="" />
            ) : filled ? (
              <span>★</span>
            ) : icon ? (
              <img src={icon} alt="" style={{ opacity: .25 }} />
            ) : (
              <span style={{ opacity: .35 }}>★</span>
            )}
          </span>
        )
      })}
    </div>
  )
}
