import { motion } from 'framer-motion'
import BarcodePreview from './BarcodePreview'
import StampRow from './StampRow'

export default function ApplePassPreview({ data, sampleName, T }) {
  const { name, stampsRequired, rewardTitle, cardColor, cardGradient, textColor, logoUrl, backgroundUrl, rewardIconUrl, sampleBalance = 0 } = data

  const balance = `${Math.min(sampleBalance, stampsRequired)} / ${stampsRequired}`

  const bgStyle = backgroundUrl
    ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : cardGradient?.from && cardGradient?.to
      ? { backgroundImage: `linear-gradient(${cardGradient.angle ?? 135}deg, ${cardGradient.from}, ${cardGradient.to})` }
      : {}

  return (
    <motion.div
      className="pd-pass pd-pass-apple"
      animate={{ backgroundColor: backgroundUrl || cardGradient ? undefined : cardColor, color: textColor }}
      transition={{ duration: .4 }}
    >
      <div className="pd-pass-body" style={bgStyle}>
        {(backgroundUrl || cardGradient) && <div className="pd-pass-overlay" />}

        <div className="pd-pass-header">
          <div className="pd-pass-logo-wrap">
            {logoUrl
              ? <img src={logoUrl} alt="" className="pd-pass-logo" />
              : <div className="pd-pass-logo pd-pass-logo-placeholder" style={{ color: textColor }}>{(name || 'W').charAt(0)}</div>
            }
            <span className="pd-pass-org">{name || T('Business', 'النشاط')}</span>
          </div>
          <div className="pd-pass-balance-area">
            <div className="pd-pass-balance-label">{T('STAMPS', 'الأختام')}</div>
            <div className="pd-pass-balance-val">{balance}</div>
          </div>
        </div>

        <div className="pd-pass-mid">
          <StampRow
            total={stampsRequired}
            earned={sampleBalance}
            icon={rewardIconUrl}
            cardColor={cardColor}
            textColor={textColor}
          />
        </div>

        <div className="pd-pass-fields">
          <div className="pd-pass-field">
            <div className="pd-pass-field-label">{T('NAME', 'الاسم')}</div>
            <div className="pd-pass-field-value">{sampleName}</div>
          </div>
          <div className="pd-pass-field" style={{ textAlign: 'end' }}>
            <div className="pd-pass-field-label">{T('REWARD', 'المكافأة')}</div>
            <div className="pd-pass-field-value">{rewardTitle || T('Reward', 'مكافأة')}</div>
          </div>
        </div>
      </div>

      <motion.div
        className="pd-pass-barcode"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: .3 }}
      >
        <BarcodePreview value={`waya:preview:${name || 'draft'}`} />
        <div className="pd-pass-barcode-hint">{T('Scan to earn', 'امسح لكسب')}</div>
      </motion.div>
    </motion.div>
  )
}
