import { parsePriceText } from '@/lib/comparisons/parse-price'
import type { ExtractedProduct } from '@/lib/comparisons/extract-products'
import type { Competitor, JsonCatalogConfig } from '@/types'

export const JSON_CATALOG_BATCH_SIZE = 100

const DEFAULT_NAME_FIELDS = ['name', 'title', 'productName', 'product_name']
const DEFAULT_PRICE_FIELDS = [
  'discountPrice',
  'salePrice',
  'price',
  'regularPrice',
  'currentPrice',
  'unitPrice',
  'amount',
]
const DEFAULT_SKU_FIELDS = ['barcode', 'sku', 'externalSku', 'code', 'ean', 'productCode']
const DEFAULT_URL_FIELDS = ['url', 'productUrl', 'link', 'href', 'canonicalUrl', 'permalink']

export function usesJsonCatalog(competitor: Pick<Competitor, 'products_api_url'>): boolean {
  return Boolean(competitor.products_api_url?.trim())
}

export function resolveJsonCatalogConfig(
  raw: JsonCatalogConfig | null | undefined
): Required<Pick<JsonCatalogConfig, 'itemsPath' | 'urlTemplate'>> & JsonCatalogConfig {
  const base = raw ?? {}
  return {
    ...base,
    itemsPath: base.itemsPath?.trim() ?? '',
    urlTemplate: base.urlTemplate?.trim() ?? '',
    nameFields: base.nameFields?.length ? base.nameFields : DEFAULT_NAME_FIELDS,
    priceFields: base.priceFields?.length ? base.priceFields : DEFAULT_PRICE_FIELDS,
    skuFields: base.skuFields?.length ? base.skuFields : DEFAULT_SKU_FIELDS,
    urlFields: base.urlFields?.length ? base.urlFields : DEFAULT_URL_FIELDS,
  }
}

function getByPath(value: unknown, path: string): unknown {
  if (!path) return value
  let current: unknown = value
  for (const segment of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function pickString(row: Record<string, unknown>, fields: string[]): string | null {
  for (const key of fields) {
    const v = row[key]
    if (v == null) continue
    const s = String(v).trim()
    if (s) return s
  }
  return null
}

function pickPrice(row: Record<string, unknown>, fields: string[]): { price: number | null; priceRaw: string | null } {
  for (const key of fields) {
    const v = row[key]
    if (v == null || v === '') continue
    const priceRaw = String(v).trim()
    const price = typeof v === 'number' ? v : parsePriceText(priceRaw)
    if (price != null) return { price, priceRaw }
  }
  return { price: null, priceRaw: null }
}

function applyUrlTemplate(template: string, row: Record<string, unknown>): string | null {
  const out = template.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const v = row[key.trim()]
    if (v == null) return ''
    return String(v)
  })
  if (out.includes('{') || !out.startsWith('http')) return null
  return out
}

function productUrlFromRow(
  row: Record<string, unknown>,
  config: ReturnType<typeof resolveJsonCatalogConfig>,
  catalogUrl: string
): string | null {
  const direct = pickString(row, config.urlFields ?? DEFAULT_URL_FIELDS)
  if (direct?.startsWith('http')) return direct
  if (direct) {
    try {
      return new URL(direct, catalogUrl).href
    } catch {
      /* fall through */
    }
  }
  if (config.urlTemplate) {
    return applyUrlTemplate(config.urlTemplate, row)
  }
  return null
}

function mapRowToProduct(
  row: unknown,
  config: ReturnType<typeof resolveJsonCatalogConfig>,
  catalogUrl: string
): ExtractedProduct | null {
  if (!row || typeof row !== 'object') return null
  const obj = row as Record<string, unknown>

  const name = pickString(obj, config.nameFields ?? DEFAULT_NAME_FIELDS)
  if (!name) return null

  const productUrl = productUrlFromRow(obj, config, catalogUrl)
  if (!productUrl) return null

  const { price, priceRaw } = pickPrice(obj, config.priceFields ?? DEFAULT_PRICE_FIELDS)
  const externalSku = pickString(obj, config.skuFields ?? DEFAULT_SKU_FIELDS)

  return { name, price, priceRaw, productUrl, externalSku }
}

export async function fetchJsonCatalogProducts(
  competitor: Competitor
): Promise<ExtractedProduct[]> {
  const apiUrl = competitor.products_api_url?.trim()
  if (!apiUrl) {
    throw new Error('URL e API për produkte mungon')
  }

  const config = resolveJsonCatalogConfig(competitor.json_catalog_config)

  const res = await fetch(apiUrl, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) {
    throw new Error(`API ktheu ${res.status}`)
  }

  const body: unknown = await res.json()
  const list = getByPath(body, config.itemsPath)
  if (!Array.isArray(list)) {
    throw new Error(
      config.itemsPath
        ? `Nuk u gjet listë produktesh te "${config.itemsPath}"`
        : 'Përgjigja e API nuk është listë produktesh'
    )
  }

  const products: ExtractedProduct[] = []
  for (const row of list) {
    const item = mapRowToProduct(row, config, competitor.catalog_url)
    if (item) products.push(item)
  }
  return products
}
