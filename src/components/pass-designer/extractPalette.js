// Extract 5 dominant colors from an image URL using canvas + median-cut-ish bucketing.
// Returns an array of hex strings, brightest-first. Safe across CORS if the image
// host returns Access-Control-Allow-Origin (Supabase Storage does by default).

function toHex(n) {
  return n.toString(16).padStart(2, '0')
}

function rgbHex(r, g, b) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

function quantize(v, step = 32) {
  return Math.min(255, Math.floor(v / step) * step + step / 2)
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export async function extractPalette(url, opts = {}) {
  const { count = 5, size = 64 } = opts
  if (!url) return []

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        const buckets = new Map()
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3]
          if (a < 128) continue
          const r = quantize(data[i])
          const g = quantize(data[i + 1])
          const b = quantize(data[i + 2])
          const key = `${r},${g},${b}`
          const entry = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 }
          entry.r += data[i]; entry.g += data[i + 1]; entry.b += data[i + 2]; entry.n += 1
          buckets.set(key, entry)
        }

        const sorted = [...buckets.values()]
          .map(e => ({ r: Math.round(e.r / e.n), g: Math.round(e.g / e.n), b: Math.round(e.b / e.n), n: e.n }))
          .sort((a, b) => b.n - a.n)

        const picked = []
        for (const c of sorted) {
          const l = luminance(c.r, c.g, c.b)
          if (l > 245 || l < 10) continue
          const hex = rgbHex(c.r, c.g, c.b)
          if (!picked.includes(hex)) picked.push(hex)
          if (picked.length >= count) break
        }
        if (picked.length === 0 && sorted.length) {
          const c = sorted[0]
          picked.push(rgbHex(c.r, c.g, c.b))
        }
        resolve(picked)
      } catch {
        resolve([])
      }
    }
    img.onerror = () => resolve([])
    img.src = url
  })
}
