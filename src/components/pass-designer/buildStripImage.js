// Composites a wide "strip" PNG for Apple Wallet storeCard passes.
// The strip is the visual band across the middle of the pass — Apple stretches
// a 1125x432 image (@2x) to fit. Design target: aleef-style professional
// stamp-slot row — a cream contrast band with N colored circles, each
// framing the reward icon, soft drop shadows for depth.
//
// Returns a Blob on success, null on failure.

function hexToRgb(hex) {
  const h = (hex || '#10B981').replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function rgba({ r, g, b }, a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

function darken({ r, g, b }, amt = 0.15) {
  return {
    r: Math.max(0, Math.round(r * (1 - amt))),
    g: Math.max(0, Math.round(g * (1 - amt))),
    b: Math.max(0, Math.round(b * (1 - amt))),
  }
}

// Stamp icons are hidden for now — we draw the slot number (1..N) inside
// each circle instead of the reward icon. Flip to true to re-enable icons.
const SHOW_ICONS = false

export async function buildStripImage({ iconUrl, cardColor, count }) {
  if (typeof document === 'undefined') return null

  const W = 1125
  const H = 432
  const total = Math.max(1, Math.min(count || 5, 10))
  const PADDING = 32
  const gap = 28

  const card = hexToRgb(cardColor)
  const cardDarker = darken(card, 0.22)

  // Strip backdrop: cream/off-white so the colored slot circles pop. Using a
  // fixed warm off-white matches the aleef reference rather than tinting the
  // card color (which risks low contrast when the card itself is light).
  const BACKDROP = '#FAF7F2'

  // Compute slot geometry. Cap the diameter so low stamp counts (2–3) don't
  // produce absurdly huge circles that crash out of the strip area. Max of
  // ~58% of strip height keeps them tactile but proportional.
  const MAX_DIAMETER = Math.floor(H * 0.62)
  const usableW = W - PADDING * 2
  const slotW = (usableW - gap * (total - 1)) / total
  const slotH = H - PADDING * 2
  const diameter = Math.min(slotW, slotH, MAX_DIAMETER)
  const radius = diameter / 2
  const rowW = total * diameter + (total - 1) * gap
  const startX = (W - rowW) / 2
  const centerY = H / 2

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = BACKDROP
    ctx.fillRect(0, 0, W, H)

    const drawSlots = (iconImg) => {
      try {
        for (let i = 0; i < total; i++) {
          const cx = startX + i * (diameter + gap) + radius
          const cy = centerY

          // Soft drop shadow under each circle.
          ctx.save()
          ctx.shadowColor = 'rgba(0, 0, 0, 0.18)'
          ctx.shadowBlur = 10
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 3

          // Filled circle in cardColor.
          ctx.beginPath()
          ctx.arc(cx, cy, radius, 0, Math.PI * 2)
          ctx.fillStyle = rgba(card, 0.95)
          ctx.fill()
          ctx.restore()

          // Inner ring stroke — slightly darker than fill, gives the edge definition.
          ctx.beginPath()
          ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2)
          ctx.strokeStyle = rgba(cardDarker, 0.55)
          ctx.lineWidth = 2
          ctx.stroke()

          if (SHOW_ICONS && iconImg) {
            // Icon centered inside, ~58% of diameter so there's breathing room.
            const iconSize = diameter * 0.58
            ctx.drawImage(
              iconImg,
              cx - iconSize / 2,
              cy - iconSize / 2,
              iconSize,
              iconSize,
            )
          } else {
            // Number inside the slot instead of an icon.
            const label = String(i + 1)
            const fontSize = Math.floor(diameter * 0.42)
            ctx.save()
            ctx.fillStyle = '#FFFFFF'
            ctx.font = `700 ${fontSize}px -apple-system, "SF Pro Text", "Segoe UI", system-ui, sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(label, cx, cy + fontSize * 0.05)
            ctx.restore()
          }
        }
        canvas.toBlob((blob) => resolve(blob), 'image/png')
      } catch {
        resolve(null)
      }
    }

    if (!SHOW_ICONS || !iconUrl) {
      drawSlots(null)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => drawSlots(img)
    // Fall back to icon-less slots if the URL fails — still gives the pass structure.
    img.onerror = () => drawSlots(null)
    img.src = iconUrl
  })
}
