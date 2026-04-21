import { emojiToDataUrl } from './PresetIconPicker'

function icon(emoji) {
  if (typeof document === 'undefined') return ''
  try { return emojiToDataUrl(emoji) } catch { return '' }
}

export const TEMPLATES = [
  {
    key: 'cafe',
    nameEn: 'Café',
    nameAr: 'مقهى',
    emoji: '☕',
    design: {
      loyalty_type: 'stamp',
      stamps_required: 10,
      card_color: '#10B981',
      text_color: '#FFFFFF',
      reward_title: 'Free coffee',
      reward_title_ar: 'قهوة مجانية',
      reward_description: 'Enjoy a free drink on us!',
      reward_description_ar: 'استمتع بمشروب مجاني!',
      barcode_type: 'QR',
      rewardEmoji: '☕',
    },
  },
  {
    key: 'barber',
    nameEn: 'Barber',
    nameAr: 'حلاق',
    emoji: '✂️',
    design: {
      loyalty_type: 'stamp',
      stamps_required: 10,
      card_color: '#1a1a2e',
      text_color: '#F1F5F9',
      reward_title: 'Free haircut',
      reward_title_ar: 'قصة شعر مجانية',
      reward_description: 'Buy 10, get one free',
      reward_description_ar: 'اشتر 10 واحصل على واحدة مجانية',
      barcode_type: 'QR',
      rewardEmoji: '✂️',
    },
  },
  {
    key: 'restaurant',
    nameEn: 'Restaurant',
    nameAr: 'مطعم',
    emoji: '🍕',
    design: {
      loyalty_type: 'stamp',
      stamps_required: 10,
      card_color: '#EF4444',
      text_color: '#FFFFFF',
      reward_title: 'Free meal',
      reward_title_ar: 'وجبة مجانية',
      reward_description: 'Reward for loyal diners',
      reward_description_ar: 'مكافأة لعملائنا المخلصين',
      barcode_type: 'QR',
      rewardEmoji: '🍕',
    },
  },
  {
    key: 'gym',
    nameEn: 'Gym',
    nameAr: 'نادي رياضي',
    emoji: '🔥',
    design: {
      loyalty_type: 'points',
      reward_threshold: 100,
      card_color: '#1a1a2e',
      text_color: '#F59E0B',
      reward_title: 'Free session',
      reward_title_ar: 'جلسة مجانية',
      reward_description: 'Earn points every visit',
      reward_description_ar: 'اكسب نقاط مع كل زيارة',
      barcode_type: 'QR',
      rewardEmoji: '🔥',
    },
  },
  {
    key: 'salon',
    nameEn: 'Salon',
    nameAr: 'صالون',
    emoji: '🌸',
    design: {
      loyalty_type: 'stamp',
      stamps_required: 8,
      card_color: '#EC4899',
      text_color: '#FFFFFF',
      reward_title: 'Free treatment',
      reward_title_ar: 'علاج مجاني',
      reward_description: 'Pamper yourself with us',
      reward_description_ar: 'دللي نفسك معنا',
      barcode_type: 'QR',
      rewardEmoji: '🌸',
    },
  },
  {
    key: 'spa',
    nameEn: 'Spa',
    nameAr: 'سبا',
    emoji: '✨',
    design: {
      loyalty_type: 'stamp',
      stamps_required: 6,
      card_color: '#14B8A6',
      text_color: '#FFFFFF',
      reward_title: 'Free massage',
      reward_title_ar: 'مساج مجاني',
      reward_description: 'Relax and earn rewards',
      reward_description_ar: 'استرخي واكسبي المكافآت',
      barcode_type: 'QR',
      rewardEmoji: '✨',
    },
  },
  {
    key: 'retail',
    nameEn: 'Retail',
    nameAr: 'متجر',
    emoji: '🛍️',
    design: {
      loyalty_type: 'coupon',
      coupon_discount: '20% OFF',
      coupon_code: 'WELCOME20',
      card_color: '#8B5CF6',
      text_color: '#FFFFFF',
      reward_title: '20% off your next purchase',
      reward_title_ar: 'خصم 20% على طلبك القادم',
      reward_description: 'Show this pass at checkout',
      reward_description_ar: 'اعرض البطاقة عند الدفع',
      barcode_type: 'QR',
      rewardEmoji: '🏷️',
    },
  },
  {
    key: 'pharmacy',
    nameEn: 'Pharmacy',
    nameAr: 'صيدلية',
    emoji: '❤️',
    design: {
      loyalty_type: 'points',
      reward_threshold: 50,
      card_color: '#3B82F6',
      text_color: '#FFFFFF',
      reward_title: 'Health rewards',
      reward_title_ar: 'مكافآت الصحة',
      reward_description: 'Earn points on every purchase',
      reward_description_ar: 'اكسب نقاط مع كل شراء',
      barcode_type: 'QR',
      rewardEmoji: '❤️',
    },
  },
]

export function materializeTemplate(tpl, isAr) {
  const d = { ...tpl.design }
  if (isAr) {
    if (d.reward_title_ar) d.reward_title = d.reward_title_ar
    if (d.reward_description_ar) d.reward_description = d.reward_description_ar
  }
  delete d.reward_title_ar
  delete d.reward_description_ar
  if (d.rewardEmoji) {
    d.reward_icon_url = icon(d.rewardEmoji)
    delete d.rewardEmoji
  }
  return d
}
