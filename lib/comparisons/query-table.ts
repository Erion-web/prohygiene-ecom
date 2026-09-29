import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'

export interface ComparisonTableRow {
  ourProductId: string
  sku: string
  name_sq: string
  ourPrice: number
  competitors: Array<{
    competitorProductId: string
    competitorName: string
    price: number
    productUrl: string
    scrapedAt: string
  }>
  cheapestCompetitor: string | null
  cheapestPrice: number | null
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export async function loadComparisonTable(): Promise<ComparisonTableRow[]> {
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('competitor_products')
    .select(`
      id, price, product_url, scraped_at,
      competitor:competitors(name),
      matched_product:products(id, sku, name_sq, price, sale_price)
    `)
    .not('matched_product_id', 'is', null)
    .not('price', 'is', null)

  const byProduct = new Map<string, ComparisonTableRow>()

  for (const row of rows ?? []) {
    const mp = relationOne(row.matched_product as {
      id: string
      sku: string
      name_sq: string
      price: number
      sale_price: number | null
    } | {
      id: string
      sku: string
      name_sq: string
      price: number
      sale_price: number | null
    }[] | null)
    if (!mp) continue

    const ourPrice =
      mp.sale_price != null && mp.sale_price < mp.price ? mp.sale_price : mp.price

    let entry = byProduct.get(mp.id)
    if (!entry) {
      entry = {
        ourProductId: mp.id,
        sku: mp.sku,
        name_sq: mp.name_sq,
        ourPrice,
        competitors: [],
        cheapestCompetitor: null,
        cheapestPrice: null,
      }
      byProduct.set(mp.id, entry)
    }

    const compName = relationOne(row.competitor as { name: string } | { name: string }[] | null)?.name ?? 'Konkurrent'
    entry.competitors.push({
      competitorProductId: row.id as string,
      competitorName: compName,
      price: Number(row.price),
      productUrl: row.product_url as string,
      scrapedAt: row.scraped_at as string,
    })
  }

  for (const entry of byProduct.values()) {
    const cheapest = entry.competitors.reduce(
      (min, c) => (!min || c.price < min.price ? c : min),
      null as (typeof entry.competitors)[0] | null
    )
    if (cheapest) {
      entry.cheapestCompetitor = cheapest.competitorName
      entry.cheapestPrice = cheapest.price
    }
  }

  return [...byProduct.values()].sort((a, b) => a.name_sq.localeCompare(b.name_sq))
}

export function formatComparisonPrice(n: number | null) {
  if (n == null) return '—'
  return formatPrice(n)
}
