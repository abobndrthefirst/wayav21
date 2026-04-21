// WCAG 2.1 contrast ratio between two colors.
// Accepts #RGB, #RRGGBB, or rgb(...) strings. Returns a ratio in [1, 21].

function parseColor(input) {
  if (!input) return [0, 0, 0]
  const s = String(input).trim()
  if (s.startsWith('#')) {
    const h = s.slice(1)
    if (h.length === 3) {
      const r = parseInt(h[0] + h[0], 16)
      const g = parseInt(h[1] + h[1], 16)
      const b = parseInt(h[2] + h[2], 16)
      return [r, g, b]
    }
    if (h.length === 6) {
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
    }
  }
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])]
  return [0, 0, 0]
}

function relLuminance([r, g, b]) {
  const f = (c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

export function contrastRatio(bg, fg) {
  const lBg = relLuminance(parseColor(bg))
  const lFg = relLuminance(parseColor(fg))
  const [hi, lo] = lBg > lFg ? [lBg, lFg] : [lFg, lBg]
  return (hi + 0.05) / (lo + 0.05)
}

// WCAG thresholds — pass fields are small text, so AA = 4.5, AAA = 7.
export function contrastRating(ratio) {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA-Large'
  return 'Fail'
}

export function pickReadableText(bg) {
  const ratioOnWhite = contrastRatio(bg, '#FFFFFF')
  const ratioOnBlack = contrastRatio(bg, '#000000')
  return ratioOnWhite >= ratioOnBlack ? '#FFFFFF' : '#000000'
}
