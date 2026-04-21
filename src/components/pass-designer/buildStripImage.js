// Composites a wide "strip" PNG for Apple Wallet storeCard passes.
// The strip is the visual band across the middle of the pass — Apple
// stretches a 1125x432 (2x) image to fit. We draw the card background
// color, then repeat the reward icon across, so a coffee card shows
// coffee cups instead of stars.
//
// Returns a Blob on success, null on failure.

export async function buildStripImage({ iconUrl, cardColor, textColor, count }) {
  if (!iconUrl || typeof document === 'undefined') return null
  const W = 1125
  const H = 432
  const total = Math.max(1, Math.min(count || 10, 10))

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = W
        canvas.height = H
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = cardColor || '#10B981'
        ctx.fillRect(0, 0, W, H)

        const gap = 20
        const cellW = (W - gap * (total + 1)) / total
        const iconSize = Math.min(cellW, H - 80)
        const y = (H - iconSize) / 2

        ctx.globalAlpha = 0.92
        for (let i = 0; i < total; i++) {
          const x = gap + i * (cellW + gap) + (cellW - iconSize) / 2
          ctx.drawImage(img, x, y, iconSize, iconSize)
        }
        ctx.globalAlpha = 1

        canvas.toBlob((blob) => resolve(blob), 'image/png')
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = iconUrl
  })
}
