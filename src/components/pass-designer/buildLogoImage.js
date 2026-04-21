// Composites a square "logo" PNG for wallets when the merchant hasn't
// uploaded a custom logo. Google Wallet requires a logo image URL — passing
// no logo causes the class definition to fail validation silently with
// "Something went wrong. Please try again." on the save-to-wallet page.
//
// Design: card-color background, shop initial letter centered in readable
// contrast, simple and brand-agnostic. 512x512 is Google's recommended size.

function pickReadableText(bg) {
  const h = (bg || '#000').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.55 ? '#0F172A' : '#FFFFFF'
}

export async function buildLogoImage({ name, cardColor }) {
  if (typeof document === 'undefined') return null
  const SIZE = 512
  const initial = (name || 'W').trim().charAt(0).toUpperCase() || 'W'
  const bg = cardColor || '#10B981'
  const fg = pickReadableText(bg)

  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = SIZE
      canvas.height = SIZE
      const ctx = canvas.getContext('2d')

      ctx.fillStyle = bg
      ctx.fillRect(0, 0, SIZE, SIZE)

      ctx.fillStyle = fg
      ctx.font = `bold ${Math.floor(SIZE * 0.5)}px "Inter", "Noto Sans Arabic", system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(initial, SIZE / 2, SIZE / 2 + SIZE * 0.03)

      canvas.toBlob((blob) => resolve(blob), 'image/png')
    } catch {
      resolve(null)
    }
  })
}
