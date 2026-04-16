export default function BarcodePreview({ type, color = '#333' }) {
  if (type === 'NONE' || !type) return null

  if (type === 'QR')
    return (
      <svg viewBox="0 0 180 180" fill={color} xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="50" height="50" rx="4" fillOpacity=".9" />
        <rect x="120" y="10" width="50" height="50" rx="4" fillOpacity=".9" />
        <rect x="10" y="120" width="50" height="50" rx="4" fillOpacity=".9" />
        <rect x="18" y="18" width="34" height="34" rx="2" fill="#fff" />
        <rect x="128" y="18" width="34" height="34" rx="2" fill="#fff" />
        <rect x="18" y="128" width="34" height="34" rx="2" fill="#fff" />
        <rect x="26" y="26" width="18" height="18" rx="1" fill={color} />
        <rect x="136" y="26" width="18" height="18" rx="1" fill={color} />
        <rect x="26" y="136" width="18" height="18" rx="1" fill={color} />
        {[70,82,94,106].map(x => [10,22,34,46,70,82,94,106,120,132,144,156].map(y => (
          <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" rx="1" fillOpacity={Math.random() > .4 ? .85 : .15} />
        )))}
        {[10,22,34,46,70,82,94,106,120,132,144,156].map(x => [70,82,94,106].map(y => (
          <rect key={`${x}-${y}b`} x={x} y={y} width="8" height="8" rx="1" fillOpacity={Math.random() > .45 ? .85 : .15} />
        )))}
        <rect x="120" y="120" width="8" height="8" rx="1" fillOpacity=".85" />
        <rect x="132" y="132" width="8" height="8" rx="1" fillOpacity=".85" />
        <rect x="144" y="144" width="8" height="8" rx="1" fillOpacity=".85" />
        <rect x="156" y="156" width="8" height="8" rx="1" fillOpacity=".85" />
        <rect x="120" y="144" width="8" height="8" rx="1" fillOpacity=".85" />
        <rect x="144" y="120" width="8" height="8" rx="1" fillOpacity=".85" />
      </svg>
    )

  if (type === 'CODE128')
    return (
      <svg viewBox="0 0 200 60" fill={color} xmlns="http://www.w3.org/2000/svg">
        {[2,6,8,13,15,18,22,25,27,30,34,37,39,42,46,49,51,54,58,61,63,66,70,73,75,78,82,85,87,90,94,97,99,102,106,109,111,114,118,121,123,126,130,133,135,138,142,145,148,151,155,158,160,163,167,170,173,176,180,183,186,189,193,196].map((x, i) => (
          <rect key={i} x={x} y="4" width={i % 3 === 0 ? 3 : i % 5 === 0 ? 1 : 2} height="52" rx=".5" fillOpacity={i % 7 === 0 ? .5 : .9} />
        ))}
      </svg>
    )

  if (type === 'AZTEC')
    return (
      <svg viewBox="0 0 180 180" fill={color} xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="160" height="160" rx="2" fill="none" stroke={color} strokeWidth="6" />
        <rect x="24" y="24" width="132" height="132" rx="2" fill="none" stroke={color} strokeWidth="6" opacity=".2" />
        <rect x="38" y="38" width="104" height="104" rx="2" fill="none" stroke={color} strokeWidth="6" />
        <rect x="52" y="52" width="76" height="76" rx="2" fill="none" stroke={color} strokeWidth="6" opacity=".2" />
        <rect x="66" y="66" width="48" height="48" rx="2" fill="none" stroke={color} strokeWidth="6" />
        <rect x="80" y="80" width="20" height="20" rx="2" fill={color} />
        {[20,35,50,65,95,110,125,140].map(x => (
          <rect key={`t${x}`} x={x} y="2" width="6" height="6" rx="1" fillOpacity={Math.random() > .4 ? .7 : .2} />
        ))}
        {[20,35,50,65,95,110,125,140].map(x => (
          <rect key={`b${x}`} x={x} y="172" width="6" height="6" rx="1" fillOpacity={Math.random() > .4 ? .7 : .2} />
        ))}
        {[20,35,50,65,95,110,125,140].map(y => (
          <rect key={`l${y}`} x="2" y={y} width="6" height="6" rx="1" fillOpacity={Math.random() > .4 ? .7 : .2} />
        ))}
        {[20,35,50,65,95,110,125,140].map(y => (
          <rect key={`r${y}`} x="172" y={y} width="6" height="6" rx="1" fillOpacity={Math.random() > .4 ? .7 : .2} />
        ))}
      </svg>
    )

  if (type === 'PDF417')
    return (
      <svg viewBox="0 0 200 80" fill={color} xmlns="http://www.w3.org/2000/svg">
        {Array.from({ length: 8 }).map((_, row) => (
          <g key={row}>
            {[2,5,9,12,14,18,21,24,27,31,34,36,39,43,46,49,52,56,59,61,64,68,71,74,77,81,84,86,89,93,96,99,102,106,109,111,114,118,121,124,127,131,134,136,139,143,146,149,152,156,159,162,165,169,172,175,178,182,185,188,191,195].map((x, i) => (
              <rect key={`${row}-${i}`} x={x} y={row * 10 + 2} width={i % 4 === 0 ? 2 : i % 3 === 0 ? 3 : 1.5} height="8" rx=".3" fillOpacity={i % 6 === 0 ? .4 : .85} />
            ))}
          </g>
        ))}
      </svg>
    )

  return null
}
