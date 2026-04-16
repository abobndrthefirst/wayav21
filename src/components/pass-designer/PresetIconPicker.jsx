import { useState } from 'react'

const PRESET_ICONS = [
  { key: 'coffee', emoji: '☕' },
  { key: 'tea', emoji: '🍵' },
  { key: 'pizza', emoji: '🍕' },
  { key: 'burger', emoji: '🍔' },
  { key: 'donut', emoji: '🍩' },
  { key: 'icecream', emoji: '🍦' },
  { key: 'cake', emoji: '🎂' },
  { key: 'cookie', emoji: '🍪' },
  { key: 'gift', emoji: '🎁' },
  { key: 'star', emoji: '⭐' },
  { key: 'heart', emoji: '❤️' },
  { key: 'crown', emoji: '👑' },
  { key: 'sparkles', emoji: '✨' },
  { key: 'tag', emoji: '🏷️' },
  { key: 'bag', emoji: '🛍️' },
  { key: 'cart', emoji: '🛒' },
  { key: 'flower', emoji: '🌸' },
  { key: 'cut', emoji: '✂️' },
  { key: 'sun', emoji: '☀️' },
  { key: 'fire', emoji: '🔥' },
]

export function emojiToDataUrl(emoji, size = 96) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.font = `${Math.floor(size * 0.78)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.04)
  return canvas.toDataURL('image/png')
}

export default function PresetIconPicker({ selected, onSelect }) {
  const [selKey, setSelKey] = useState(null)
  return (
    <div className="pd-icon-grid">
      {PRESET_ICONS.map(it => (
        <button
          key={it.key}
          type="button"
          className={`pd-icon-tile ${selKey === it.key ? 'sel' : ''}`}
          title={it.key}
          onClick={() => { setSelKey(it.key); onSelect(emojiToDataUrl(it.emoji)) }}
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>{it.emoji}</span>
        </button>
      ))}
    </div>
  )
}
