import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PlatformToggle from './PlatformToggle'
import PhoneMockup from './PhoneMockup'
import ApplePassPreview from './ApplePassPreview'
import GooglePassPreview from './GooglePassPreview'

export default function DesignerPreviewPanel({ previewData, T, isAr }) {
  const [platform, setPlatform] = useState('apple')
  const sampleName = isAr ? 'أحمد' : 'Ahmed'

  return (
    <div className="pd-preview-panel">
      <PlatformToggle value={platform} onChange={setPlatform} T={T} />

      <PhoneMockup platform={platform}>
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
              <ApplePassPreview data={previewData} sampleName={sampleName} T={T} />
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
              <GooglePassPreview data={previewData} sampleName={sampleName} T={T} />
            </motion.div>
          )}
        </AnimatePresence>
      </PhoneMockup>
    </div>
  )
}
