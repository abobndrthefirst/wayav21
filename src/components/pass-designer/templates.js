import { emojiToDataUrl } from './PresetIconPicker'
import { supabase } from '../../lib/supabase'

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
      loyalty_type: 'stamp',
      stamps_required: 10,
      card_color: '#1a1a2e',
      text_color: '#F59E0B',
      reward_title: 'Free session',
      reward_title_ar: 'جلسة مجانية',
      reward_description: 'Earn a stamp every visit',
      reward_description_ar: 'اكسب ختماً مع كل زيارة',
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
      loyalty_type: 'stamp',
      stamps_required: 10,
      card_color: '#8B5CF6',
      text_color: '#FFFFFF',
      reward_title: 'Free item',
      reward_title_ar: 'منتج مجاني',
      reward_description: 'Thanks for shopping with us',
      reward_description_ar: 'شكراً لتسوقك معنا',
      barcode_type: 'QR',
      rewardEmoji: '🛍️',
    },
  },
  {
    key: 'pharmacy',
    nameEn: 'Pharmacy',
    nameAr: 'صيدلية',
    emoji: '❤️',
    design: {
      loyalty_type: 'stamp',
      stamps_required: 10,
      card_color: '#3B82F6',
      text_color: '#FFFFFF',
      reward_title: 'Free product',
      reward_title_ar: 'منتج مجاني',
      reward_description: 'Stamp earned on every visit',
      reward_description_ar: 'ختم مع كل زيارة',
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

// Admin-curated, AI-generated card_templates rows are mapped into the same
// shape as the built-ins above so TemplateGallery + useDesignState consume
// them without branching. Only published rows flow back (RLS enforces this).
function adminRowToTemplate(row) {
  const theme = row?.theme || {}
  const grad = theme.gradient && theme.gradient.from && theme.gradient.to
    ? { from: theme.gradient.from, to: theme.gradient.to, angle: Number(theme.gradient.angle) || 135 }
    : null
  return {
    key: `admin-${row.id}`,
    nameEn: row.name || 'AI Template',
    nameAr: row.name || 'قالب ذكي',
    emoji: '✨',
    isAdmin: true,
    design: {
      loyalty_type: 'stamp',
      stamps_required: 10,
      card_color: theme.card_color || '#1a1a2e',
      text_color: theme.text_color || '#FFFFFF',
      card_gradient: grad,
      background_url: row.background_url || '',
      reward_title: 'Free reward',
      reward_title_ar: 'مكافأة مجانية',
      reward_description: '',
      reward_description_ar: '',
      barcode_type: 'QR',
      rewardEmoji: '✨',
      // AI templates render as credit-card-style minimal passes — wallet
      // pass functions read this flag and emit a stripped-down layout
      // (holder name + AI bg + QR, nothing else).
      minimal_layout: true,
    },
  }
}

// Returns built-in templates plus published admin templates. Failure to load
// admin rows is non-fatal — fall back to built-ins so the merchant designer
// still works offline / with cold cache.
export async function loadAllTemplates() {
  try {
    const { data, error } = await supabase
      .from('card_templates')
      .select('id, name, theme, background_url, is_published, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('[loadAllTemplates] admin fetch failed:', error.message)
      return TEMPLATES
    }
    return [...(data || []).map(adminRowToTemplate), ...TEMPLATES]
  } catch (e) {
    console.warn('[loadAllTemplates] admin fetch threw:', e)
    return TEMPLATES
  }
}
