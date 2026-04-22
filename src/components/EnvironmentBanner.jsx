// Fixed top banner on non-production builds so staging/preview is visually
// impossible to confuse with production. Reads VITE_WAYA_ENV at build time.
//
// VITE_WAYA_ENV values:
//   - 'production' (or unset)  → renders nothing
//   - 'staging'                 → yellow "STAGING" banner
//   - anything else             → orange "PREVIEW — <value>" banner
//
// Mounted in src/main.jsx above <App />.

const ENV = (import.meta.env.VITE_WAYA_ENV || '').toLowerCase()

export default function EnvironmentBanner() {
  if (!ENV || ENV === 'production') return null

  const isStaging = ENV === 'staging'
  const bg = isStaging ? '#facc15' : '#fb923c'
  const label = isStaging
    ? 'STAGING — not production data'
    : `PREVIEW — ${ENV}`

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '6px 12px',
        background: bg,
        color: '#0f172a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}
    >
      {label}
    </div>
  )
}
