import { useEffect, useRef, useState } from 'react'
import QrScannerLib from 'qr-scanner'

/**
 * Fullscreen QR scanner modal.
 *
 * Props:
 *   onDetect(code: string) — called once when a QR code is decoded
 *   onClose()              — user dismissed the scanner
 *   isAr                   — RTL flag for labels
 */
export default function QrScanner({ onDetect, onClose, isAr }) {
  const videoRef = useRef(null)
  const scannerRef = useRef(null)
  const firedRef = useRef(false)
  const [status, setStatus] = useState('starting') // starting | running | denied | nocamera | error
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    const video = videoRef.current
    if (!video) return

    const handleResult = (result) => {
      if (firedRef.current) return
      const code = typeof result === 'string' ? result : result?.data
      if (!code) return
      firedRef.current = true
      try { scannerRef.current?.stop() } catch {}
      onDetect(code)
    }

    const start = async () => {
      try {
        const hasCamera = await QrScannerLib.hasCamera()
        if (cancelled) return
        if (!hasCamera) {
          setStatus('nocamera')
          return
        }
        const scanner = new QrScannerLib(video, handleResult, {
          preferredCamera: 'environment',
          highlightScanRegion: false,
          highlightCodeOutline: false,
          maxScansPerSecond: 5,
          returnDetailedScanResult: true,
        })
        scannerRef.current = scanner
        await scanner.start()
        if (!cancelled) setStatus('running')
      } catch (e) {
        if (cancelled) return
        const m = String(e?.message || e || '')
        if (/permission|denied|NotAllowed/i.test(m)) setStatus('denied')
        else if (/NotFound|no camera/i.test(m)) setStatus('nocamera')
        else { setStatus('error'); setErrMsg(m) }
      }
    }
    start()

    return () => {
      cancelled = true
      try { scannerRef.current?.stop() } catch {}
      try { scannerRef.current?.destroy() } catch {}
      scannerRef.current = null
    }
  }, [onDetect])

  const labels = {
    aim:     isAr ? 'وجّه الكاميرا نحو رمز QR للعميل' : 'Point the camera at the customer QR',
    starting:isAr ? 'جارٍ تشغيل الكاميرا…' : 'Starting camera…',
    denied:  isAr ? 'الإذن للكاميرا مرفوض. فعّله من إعدادات المتصفح ثم أعد المحاولة.' : 'Camera permission denied. Enable it in browser settings and retry.',
    nocamera:isAr ? 'لا توجد كاميرا متاحة على هذا الجهاز.' : 'No camera available on this device.',
    error:   isAr ? 'تعذّر تشغيل الكاميرا' : 'Could not start camera',
    close:   isAr ? 'إغلاق' : 'Close',
  }

  return (
    <div className="qr-scan-overlay" role="dialog" aria-modal="true" dir={isAr ? 'rtl' : 'ltr'}>
      <video
        ref={videoRef}
        className="qr-scan-video"
        playsInline
        muted
        autoPlay
      />

      {/* Centered scan target */}
      <div className="qr-scan-target" aria-hidden="true">
        <span className="qr-scan-corner tl" />
        <span className="qr-scan-corner tr" />
        <span className="qr-scan-corner bl" />
        <span className="qr-scan-corner br" />
      </div>

      <div className="qr-scan-topbar">
        <button
          type="button"
          className="qr-scan-close"
          onClick={onClose}
          aria-label={labels.close}
        >
          ✕
        </button>
      </div>

      <div className="qr-scan-bottombar">
        {status === 'running' && <p className="qr-scan-hint">{labels.aim}</p>}
        {status === 'starting' && <p className="qr-scan-hint">{labels.starting}</p>}
        {status === 'denied' && <p className="qr-scan-hint err">{labels.denied}</p>}
        {status === 'nocamera' && <p className="qr-scan-hint err">{labels.nocamera}</p>}
        {status === 'error' && <p className="qr-scan-hint err">{labels.error}{errMsg ? ` — ${errMsg}` : ''}</p>}
      </div>
    </div>
  )
}
