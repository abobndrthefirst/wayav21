import { useEffect, useState } from 'react'

export default function BarcodePreview({ value, color = '#333' }) {
  const [dataUrl, setDataUrl] = useState('')
  const payload = value || 'waya:preview'

  useEffect(() => {
    let cancelled = false
    import('qrcode').then(({ default: QRCode }) => {
      QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 180,
        color: { dark: color, light: '#ffffff' },
      }).then((url) => {
        if (!cancelled) setDataUrl(url)
      }).catch(() => {})
    })
    return () => { cancelled = true }
  }, [payload, color])

  if (!dataUrl) return <div className="pd-barcode-loading" style={{ height: 180 }} />

  return (
    <div className="pd-barcode-wrap-inner">
      <img src={dataUrl} alt="QR" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 6 }} />
    </div>
  )
}
