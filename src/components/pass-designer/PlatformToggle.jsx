import { motion } from 'framer-motion'

const AppleIcon = () => (
  <svg viewBox="0 0 18 18" fill="currentColor"><path d="M14.1 9.5c0-1.9 1.5-2.8 1.6-2.9-.9-1.3-2.2-1.5-2.7-1.5-1.1-.1-2.2.7-2.8.7s-1.5-.7-2.4-.6c-1.3 0-2.4.7-3.1 1.8-1.3 2.3-.3 5.7 1 7.5.6.9 1.4 2 2.4 1.9 1-.1 1.3-.6 2.5-.6s1.5.6 2.5.6 1.7-1 2.3-1.9c.7-1.1 1-2.1 1-2.2-.1 0-2-.7-2.3-2.8zM12.2 3.7c.5-.6.9-1.5.8-2.4-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.3.8.1 1.7-.4 2.3-1.1z"/></svg>
)

const GoogleIcon = () => (
  <svg viewBox="0 0 18 18" fill="none"><path d="M17.2 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.6c-.2 1.1-.8 2-1.7 2.6v2.1h2.7c1.6-1.5 2.6-3.6 2.6-6.3z" fill="#4285F4"/><path d="M9 18c2.3 0 4.3-.8 5.7-2.1l-2.7-2.1c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H1.2v2.2C2.6 16 5.5 18 9 18z" fill="#34A853"/><path d="M4 11c-.2-.5-.3-1-.3-1.5s.1-1.1.3-1.5V5.8H1.2C.4 7.3 0 9.1 0 10.5c0 1.4.4 2.7 1.2 3.7L4 11z" fill="#FBBC05"/><path d="M9 3.6c1.3 0 2.5.4 3.4 1.3l2.5-2.5C13.2.9 11.3 0 9 0 5.5 0 2.6 2 1.2 4.8L4 7c.7-2.1 2.7-3.4 5-3.4z" fill="#EA4335"/></svg>
)

export default function PlatformToggle({ value, onChange, T }) {
  const items = [
    { id: 'apple', label: T('Apple Wallet', 'محفظة آبل'), Icon: AppleIcon },
    { id: 'google', label: T('Google Wallet', 'محفظة جوجل'), Icon: GoogleIcon },
  ]

  const activeIdx = items.findIndex(i => i.id === value)
  const btnWidth = 160

  return (
    <div className="pd-toggle">
      <motion.div
        className="pd-toggle-pill"
        layoutId="pd-pill"
        style={{ width: btnWidth, insetInlineStart: 4 + activeIdx * btnWidth }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      {items.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`pd-toggle-btn ${value === id ? 'active' : ''}`}
          style={{ width: btnWidth }}
          onClick={() => onChange(id)}
        >
          <Icon /> {label}
        </button>
      ))}
    </div>
  )
}
