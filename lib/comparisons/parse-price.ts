/** Parse Kosovo / EU price strings into EUR amount. */
export function parsePriceText(raw: string | null | undefined): number | null {
  if (!raw) return null
  let s = raw.replace(/\s/g, '').replace(/€|EUR|eur/gi, '')
  s = s.replace(/[^\d.,-]/g, '')
  if (!s) return null

  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > lastDot) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (lastDot > lastComma) {
    s = s.replace(/,/g, '')
  } else if (lastComma >= 0) {
    s = s.replace(',', '.')
  }

  const n = Number.parseFloat(s)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function normalizeProductName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function nameSimilarity(a: string, b: string): number {
  const na = normalizeProductName(a)
  const nb = normalizeProductName(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.85
  const ta = new Set(na.split(' ').filter(w => w.length > 2))
  const tb = new Set(nb.split(' ').filter(w => w.length > 2))
  if (ta.size === 0 || tb.size === 0) return 0
  let overlap = 0
  for (const w of ta) if (tb.has(w)) overlap++
  return overlap / Math.max(ta.size, tb.size)
}
