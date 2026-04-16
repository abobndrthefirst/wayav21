import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BARCODE_OPTIONS = [
  { id: 'QR', label: 'QR Code' },
  { id: 'CODE128', label: 'Code 128' },
  { id: 'AZTEC', label: 'Aztec' },
  { id: 'PDF417', label: 'PDF 417' },
  { id: 'NONE', label: 'None' },
]

function MiniBarcode({ type }) {
  if (type === 'QR') return (
    <svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="4" y="4" width="4" height="4" rx=".5" fill="#fff"/><rect x="16" y="4" width="4" height="4" rx=".5" fill="#fff"/><rect x="4" y="16" width="4" height="4" rx=".5" fill="#fff"/><rect x="14" y="14" width="3" height="3" rx=".5"/><rect x="19" y="19" width="3" height="3" rx=".5"/><rect x="14" y="19" width="3" height="3" rx=".5" opacity=".4"/></svg>
  )
  if (type === 'CODE128') return (
    <svg viewBox="0 0 24 24" fill="currentColor">{[2,4,7,9,11,14,16,18,20,22].map((x,i) => <rect key={i} x={x} y="3" width={i%3===0?2:1} height="18" rx=".3"/>)}</svg>
  )
  if (type === 'AZTEC') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="1"/><rect x="6" y="6" width="12" height="12" rx="1"/><rect x="10" y="10" width="4" height="4" rx=".5" fill="currentColor" stroke="none"/></svg>
  )
  if (type === 'PDF417') return (
    <svg viewBox="0 0 24 24" fill="currentColor">{[0,1,2,3,4,5].map(r => [2,4,7,9,11,14,16,18,20,22].map((x,i) => <rect key={`${r}-${i}`} x={x} y={r*3.5+3} width={i%3===0?2:1} height="2.5" rx=".2"/>))}</svg>
  )
  if (type === 'NONE') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
  )
  return null
}

const Chevron = () => (
  <svg className="pd-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6l4 4 4-4"/></svg>
)

export default function BarcodeSelector({ value, onChange, T }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const current = BARCODE_OPTIONS.find(o => o.id === value) || BARCODE_OPTIONS[0]

  return (
    <div className="pd-field">
      <label>{T('Barcode type', 'نوع الباركود')}</label>
      <div className="pd-barcode-wrap" ref={ref}>
        <button type="button" className={`pd-barcode-btn ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
          <MiniBarcode type={current.id} />
          <span>{current.label}</span>
          <Chevron />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              className="pd-barcode-dd"
              initial={{ opacity: 0, y: -6, scale: .97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: .97 }}
              transition={{ duration: .18 }}
            >
              {BARCODE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  className={`pd-barcode-opt ${value === opt.id ? 'active' : ''}`}
                  onClick={() => { onChange(opt.id); setOpen(false) }}
                >
                  <MiniBarcode type={opt.id} />
                  <span>{opt.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
