import { motion } from 'framer-motion'
import BarcodePreview from './BarcodePreview'

function StampRow({ total, earned, icon, textColor }) {
  const max = Math.min(total || 10, 12)
  return (
    <div className="pd-stamps" dir="ltr">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < earned
        return (
          <span key={i} className={`pd-stamp ${filled ? 'filled' : ''}`} style={{ borderColor: textColor, color: textColor }}>
            {filled && icon ? <img src={icon} alt="" /> : filled ? <span>★</span> : icon ? <img src={icon} alt="" style={{ opacity: .25 }} /> : <span style={{ opacity: .35 }}>★</span>}
          </span>
        )
      })}
    </div>
  )
}

export default function ApplePassPreview({ data, sampleName, T }) {
  const { name, loyaltyType, stampsRequired, rewardThreshold, rewardTitle, couponDiscount, cardColor, textColor, logoUrl, backgroundUrl, rewardIconUrl, barcodeType } = data

  const balance = loyaltyType === 'points' ? `0 / ${rewardThreshold}`
    : loyaltyType === 'tiered' ? T('Bronze', 'برونزي')
    : loyaltyType === 'coupon' ? couponDiscount
    : null

  const balanceLabel = loyaltyType === 'stamp' ? null
    : loyaltyType === 'points' ? T('Points', 'النقاط')
    : loyaltyType === 'tiered' ? T('Tier', 'المستوى')
    : T('Offer', 'العرض')

  const bgStyle = backgroundUrl
    ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}

  return (
    <motion.div
      className="pd-pass pd-pass-apple"
      animate={{ backgroundColor: backgroundUrl ? undefined : cardColor, color: textColor }}
      transition={{ duration: .4 }}
    >
      <div className="pd-pass-body" style={bgStyle}>
        {backgroundUrl && <div className="pd-pass-overlay" />}

        <div className="pd-pass-header">
          <div className="pd-pass-logo-wrap">
            {logoUrl
              ? <img src={logoUrl} alt="" className="pd-pass-logo" />
              : <div className="pd-pass-logo pd-pass-logo-placeholder" style={{ color: textColor }}>{(name || 'W').charAt(0)}</div>
            }
            <span className="pd-pass-org">{name || T('Business', 'النشاط')}</span>
          </div>
          {balanceLabel && (
            <div className="pd-pass-balance-area">
              <div className="pd-pass-balance-label">{T('BALANCE', 'الرصيد')}</div>
              <div className="pd-pass-balance-val">{balance}</div>
            </div>
          )}
        </div>

        <div className="pd-pass-mid">
          {loyaltyType === 'stamp' ? (
            <StampRow total={stampsRequired} earned={0} icon={rewardIconUrl} textColor={textColor} />
          ) : backgroundUrl ? (
            null
          ) : null}
        </div>

        <div className="pd-pass-fields">
          <div className="pd-pass-field">
            <div className="pd-pass-field-label">{T('NAME', 'الاسم')}</div>
            <div className="pd-pass-field-value">{sampleName}</div>
          </div>
          <div className="pd-pass-field" style={{ textAlign: 'end' }}>
            <div className="pd-pass-field-label">{T('STATUS', 'الحالة')}</div>
            <div className="pd-pass-field-value">{T('Member', 'عضو')}</div>
          </div>
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
          <BarcodePreview type={barcodeType} />
          <div className="pd-pass-barcode-hint">{T('Scan to earn points', 'امسح لكسب النقاط')}</div>
        </motion.div>
      )}
    </motion.div>
  )
}
