import { motion } from 'framer-motion'
import BarcodePreview from './BarcodePreview'
import StampRow from './StampRow'

export default function GooglePassPreview({ data, sampleName, T }) {
  const { name, loyaltyType, stampsRequired, rewardThreshold, rewardTitle, couponDiscount, cardColor, cardGradient, textColor, logoUrl, backgroundUrl, rewardIconUrl, barcodeType, sampleBalance = 0, tiers } = data

  const balance = loyaltyType === 'points' ? `${sampleBalance} / ${rewardThreshold}`
    : loyaltyType === 'tiered' ? (tiers?.[0]?.name || T('Bronze', 'برونزي'))
    : loyaltyType === 'stamp' ? `${Math.min(sampleBalance, stampsRequired)} / ${stampsRequired}`
    : loyaltyType === 'coupon' ? couponDiscount
    : '0'

  const balanceLabel = loyaltyType === 'stamp' ? T('Stamps', 'أختام')
    : loyaltyType === 'points' ? T('Points', 'نقاط')
    : loyaltyType === 'tiered' ? T('Tier', 'المستوى')
    : T('Offer', 'العرض')

  const bgStyle = backgroundUrl
    ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : cardGradient?.from && cardGradient?.to
      ? { backgroundImage: `linear-gradient(${cardGradient.angle ?? 135}deg, ${cardGradient.from}, ${cardGradient.to})` }
      : {}

  return (
    <motion.div
      className="pd-pass pd-pass-google"
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
        </div>

        <div className="pd-pass-mid">
          {loyaltyType === 'stamp' ? (
            <StampRow total={stampsRequired} earned={sampleBalance} icon={rewardIconUrl} textColor={textColor} />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div className="pd-pass-balance-label">{balanceLabel}</div>
              <motion.div
                className="pd-pass-balance-val"
                key={String(balance)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .25 }}
              >
                {balance}
              </motion.div>
            </div>
          )}
        </div>

        <div className="pd-pass-fields">
          <div className="pd-pass-field">
            <div className="pd-pass-field-label">{T('MEMBER', 'العضو')}</div>
            <div className="pd-pass-field-value">{sampleName}</div>
          </div>
          {rewardTitle && (
            <div className="pd-pass-field" style={{ textAlign: 'end' }}>
              <div className="pd-pass-field-label">{T('REWARD', 'المكافأة')}</div>
              <div className="pd-pass-field-value">{rewardTitle}</div>
            </div>
          )}
        </div>
      </div>

      {barcodeType && barcodeType !== 'NONE' && (
        <motion.div
          className="pd-pass-barcode"
          key={barcodeType}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: .3 }}
        >
          <BarcodePreview type={barcodeType} value={`waya:preview:${name || 'draft'}`} />
          <div className="pd-pass-barcode-hint">{T('Scan to earn', 'امسح لكسب')}</div>
        </motion.div>
      )}
    </motion.div>
  )
}
