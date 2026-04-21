import { useEffect, useRef, useState } from 'react'

export default function BarcodePreview({ type, value, color = '#333' }) {
  const canvasRef = useRef(null)
  const [svgMarkup, setSvgMarkup] = useState('')
  const [fallback, setFallback] = useState(false)

  const payload = value || 'waya:preview'

  useEffect(() => {
    if (!type || type === 'NONE') { setSvgMarkup(''); return }
    let cancelled = false
    setFallback(false)

    async function render() {
      try {
        if (type === 'QR' || type === 'AZTEC') {
          const { default: QRCode } = await import('qrcode')
          const dataUrl = await QRCode.toDataURL(payload, {
            errorCorrectionLevel: type === 'AZTEC' ? 'H' : 'M',
            margin: 1,
            width: 180,
            color: { dark: color, light: '#ffffff' },
          })
          if (!cancelled) setSvgMarkup(`<img src="${dataUrl}" alt="QR" style="width:100%;height:auto;display:block;border-radius:6px;" />`)
        } else if (type === 'CODE128') {
          const mod = await import('jsbarcode')
          const JsBarcode = mod.default || mod
          const canvas = document.createElement('canvas')
          JsBarcode(canvas, payload.slice(0, 40), {
            format: 'CODE128',
            width: 2, height: 60, margin: 6,
            displayValue: false, background: '#ffffff', lineColor: color,
          })
          if (!cancelled) setSvgMarkup(`<img src="${canvas.toDataURL('image/png')}" alt="Barcode" style="width:100%;height:auto;display:block;border-radius:6px;" />`)
        } else if (type === 'PDF417') {
          const canvas = document.createElement('canvas')
          canvas.width = 300; canvas.height = 90
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 300, 90)
          ctx.fillStyle = color
          for (let r = 0; r < 8; r++) {
            for (let x = 0; x < 150; x++) {
              if (Math.random() > 0.45) ctx.fillRect(x * 2, r * 10 + 4, Math.random() > 0.6 ? 3 : 1.5, 8)
            }
          }
          if (!cancelled) {
            setSvgMarkup(`<img src="${canvas.toDataURL('image/png')}" alt="PDF417" style="width:100%;height:auto;display:block;border-radius:6px;" />`)
            setFallback(true)
          }
        }
      } catch {
        if (!cancelled) setFallback(true)
      }
    }
    render()
    return () => { cancelled = true }
  }, [type, payload, color])

  if (!type || type === 'NONE') return null
  if (!svgMarkup) return <div className="pd-barcode-loading" style={{ height: 180 }} />

  return (
    <div className="pd-barcode-wrap-inner">
      <div dangerouslySetInnerHTML={{ __html: svgMarkup }} />
      {fallback && type === 'PDF417' && (
        <div className="pd-barcode-note">Preview only — real PDF417 rendered on the pass.</div>
      )}
    </div>
  )
}
