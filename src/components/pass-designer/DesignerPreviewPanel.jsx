import { AnimatePresence, motion } from 'framer-motion'
import PlatformToggle from './PlatformToggle'
import PhoneMockup from './PhoneMockup'
import ApplePassPreview from './ApplePassPreview'
import GooglePassPreview from './GooglePassPreview'
import { useState } from 'react'

export default function DesignerPreviewPanel({
  previewData,
  T,
  isAr,
  sampleBalance,
  onSampleBalanceChange,
  darkPreview,
  onDarkPreviewChange,
}) {
  const [platform, setPlatform] = useState('apple')
  const sampleName = isAr ? 'أحمد' : 'Ahmed'

  const effectiveMax = previewData.loyaltyType === 'stamp'
    ? (previewData.stampsRequired || 10)
    : previewData.loyaltyType === 'points'
      ? (previewData.rewardThreshold || 10)
      : 0

  const data = { ...previewData, sampleBalance }

  return (
    <div className={`pd-preview-panel ${darkPreview ? 'dark' : ''}`}>
      <div className="pd-preview-controls">
        <PlatformToggle value={platform} onChange={setPlatform} T={T} />

        <button
          type="button"
          className={`pd-mode-toggle ${darkPreview ? 'dark' : ''}`}
          onClick={() => onDarkPreviewChange?.(!darkPreview)}
          title={T('Toggle dark preview', 'تبديل المعاينة الداكنة')}
        >
          {darkPreview ? '🌙' : '☀'}
        </button>
      </div>

      {effectiveMax > 0 && (
        <div className="pd-sample-slider">
          <label>
            {T('Sample balance', 'رصيد تجريبي')}: <strong>{sampleBalance}</strong> / {effectiveMax}
          </label>
          <input
            type="range"
            min={0}
            max={effectiveMax}
            value={Math.min(sampleBalance, effectiveMax)}
            onChange={(e) => onSampleBalanceChange?.(Number(e.target.value))}
          />
        </div>
      )}

      <PhoneMockup platform={platform} dark={darkPreview}>
        <AnimatePresence mode="wait">
          {platform === 'apple' ? (
            <motion.div
              key="apple"
              initial={{ opacity: 0, rotateY: -8 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 8 }}
              transition={{ duration: .3 }}
              style={{ perspective: 800 }}
            >
              <ApplePassPreview data={data} sampleName={sampleName} T={T} />
            </motion.div>
          ) : (
            <motion.div
              key="google"
              initial={{ opacity: 0, rotateY: 8 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -8 }}
              transition={{ duration: .3 }}
              style={{ perspective: 800 }}
            >
              <GooglePassPreview data={data} sampleName={sampleName} T={T} />
            </motion.div>
          )}
        </AnimatePresence>
      </PhoneMockup>
    </div>
  )
}
