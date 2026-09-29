import { nameSimilarity, normalizeProductName } from '@/lib/comparisons/parse-price'

export interface OurProductRow {
  id: string
  sku: string
  name_sq: string
  name_en: string
  price: number
  sale_price: number | null
}

const MIN_NAME_SCORE = 0.55

export function findBestProductMatch(
  competitorName: string,
  externalSku: string | null,
  ourProducts: OurProductRow[]
): { productId: string | null; confidence: number | null } {
  if (externalSku) {
    const skuNorm = externalSku.trim().toLowerCase()
    const exact = ourProducts.find(p => p.sku.trim().toLowerCase() === skuNorm)
    if (exact) return { productId: exact.id, confidence: 1 }
  }

  let best: { id: string; score: number } | null = null
  for (const p of ourProducts) {
    const score = Math.max(
      nameSimilarity(competitorName, p.name_sq),
      nameSimilarity(competitorName, p.name_en)
    )
    if (!best || score > best.score) best = { id: p.id, score }
  }

  if (best && best.score >= MIN_NAME_SCORE) {
    return { productId: best.id, confidence: Math.round(best.score * 100) / 100 }
  }
  return { productId: null, confidence: null }
}

export function searchOurProducts(query: string, ourProducts: OurProductRow[], limit = 10) {
  const q = normalizeProductName(query)
  if (!q) return []
  return ourProducts
    .map(p => ({
      product: p,
      score: Math.max(nameSimilarity(q, p.name_sq), nameSimilarity(q, p.name_en), q === p.sku.toLowerCase() ? 1 : 0),
    }))
    .filter(x => x.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
