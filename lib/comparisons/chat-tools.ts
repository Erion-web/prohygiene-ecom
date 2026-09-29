import { createServiceClient } from '@/lib/supabase/server'
import { searchOurProducts, type OurProductRow } from '@/lib/comparisons/match-products'
import { sanitizeSearch } from '@/lib/admin/sanitize-search'

export async function toolSearchCompetitorProducts(args: {
  query: string
  competitorName?: string
  limit?: number
}) {
  const supabase = await createServiceClient()
  const q = sanitizeSearch(args.query)
  const limit = Math.min(Math.max(args.limit ?? 8, 1), 20)

  let competitorId: string | null = null
  if (args.competitorName?.trim()) {
    const name = sanitizeSearch(args.competitorName)
    const { data: comp } = await supabase
      .from('competitors')
      .select('id, name')
      .ilike('name', `%${name}%`)
      .limit(1)
      .maybeSingle()
    competitorId = comp?.id ?? null
  }

  let query = supabase
    .from('competitor_products')
    .select(`
      id, name, price, currency, product_url, scraped_at, external_sku,
      competitor:competitors(id, name),
      matched_product:products(id, sku, name_sq, price, sale_price)
    `)
    .order('scraped_at', { ascending: false })
    .limit(limit)

  if (competitorId) query = query.eq('competitor_id', competitorId)
  if (q) query = query.or(`name.ilike.%${q}%,external_sku.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return { error: error.message, items: [] }

  return {
    items: (data ?? []).map(row => ({
      id: row.id,
      name: row.name,
      price: row.price,
      currency: row.currency,
      product_url: row.product_url,
      scraped_at: row.scraped_at,
      external_sku: row.external_sku,
      competitor: row.competitor,
      matched_product: row.matched_product,
    })),
  }
}

export async function toolCompareWithOurProduct(args: { ourProductId?: string; query?: string }) {
  const supabase = await createServiceClient()
  const { data: ourRows } = await supabase
    .from('products')
    .select('id, sku, name_sq, name_en, price, sale_price')
    .eq('is_active', true)

  const ours = (ourRows ?? []) as OurProductRow[]
  let product: OurProductRow | undefined

  if (args.ourProductId) {
    product = ours.find(p => p.id === args.ourProductId)
  } else if (args.query) {
    product = searchOurProducts(args.query, ours, 1)[0]?.product
  }

  if (!product) return { error: 'Produkti ynë nuk u gjet', comparisons: [] }

  const effective = product.sale_price != null && product.sale_price < product.price
    ? product.sale_price
    : product.price

  const { data: competitorRows } = await supabase
    .from('competitor_products')
    .select(`
      id, name, price, currency, product_url, scraped_at,
      competitor:competitors(id, name)
    `)
    .eq('matched_product_id', product.id)
    .not('price', 'is', null)

  const comparisons = (competitorRows ?? []).map(row => {
    const cp = Number(row.price)
    const diff = cp - effective
    return {
      competitor: row.competitor,
      competitor_product_name: row.name,
      competitor_price: cp,
      competitor_url: row.product_url,
      scraped_at: row.scraped_at,
      our_price: effective,
      difference_eur: Math.round(diff * 100) / 100,
      we_are_cheaper: diff > 0,
    }
  })

  return {
    our_product: {
      id: product.id,
      sku: product.sku,
      name_sq: product.name_sq,
      price: product.price,
      sale_price: product.sale_price,
      effective_price: effective,
    },
    comparisons,
  }
}

export const COMPARISON_TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'search_competitor_products',
      description: 'Search stored competitor catalog rows by product name or SKU. Never scrape.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Product name or SKU fragment' },
          competitorName: { type: 'string', description: 'Optional competitor name filter' },
          limit: { type: 'number' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'compare_with_our_product',
      description: 'Compare our product price to matched competitor rows already in the database.',
      parameters: {
        type: 'object',
        properties: {
          ourProductId: { type: 'string', description: 'UUID of our product' },
          query: { type: 'string', description: 'Search our catalog if id unknown' },
        },
      },
    },
  },
]

export async function runComparisonTool(name: string, args: Record<string, unknown>) {
  if (name === 'search_competitor_products') {
    return toolSearchCompetitorProducts(args as Parameters<typeof toolSearchCompetitorProducts>[0])
  }
  if (name === 'compare_with_our_product') {
    return toolCompareWithOurProduct(args as Parameters<typeof toolCompareWithOurProduct>[0])
  }
  return { error: `Unknown tool: ${name}` }
}
