import { usesJsonCatalog } from '@/lib/comparisons/json-api-catalog'
import type { Competitor, JsonCatalogConfig } from '@/types'

export type ScrapeSourceKind = 'html' | 'json_api'

export interface ScrapeCursor {
  source?: ScrapeSourceKind
  nextUrl?: string | null
  pageCount?: number
  productOffset?: number
  /** When JSON API was auto-discovered but not yet on the competitor row. */
  jsonApi?: {
    products_api_url: string
    json_catalog_config: JsonCatalogConfig
  }
}

export function competitorWithCursorJsonApi(
  competitor: Competitor,
  cursor: ScrapeCursor | null | undefined
): Competitor {
  const api = cursor?.jsonApi
  if (!api?.products_api_url?.trim()) return competitor
  return {
    ...competitor,
    products_api_url: api.products_api_url,
    json_catalog_config: api.json_catalog_config ?? competitor.json_catalog_config,
  }
}

export function scrapeSourceKind(competitor: Competitor): ScrapeSourceKind {
  return usesJsonCatalog(competitor) ? 'json_api' : 'html'
}

export function initialScrapeCursor(competitor: Competitor): ScrapeCursor {
  const source = scrapeSourceKind(competitor)
  if (source === 'json_api') {
    return { source: 'json_api', nextUrl: 'json_api', pageCount: 0, productOffset: 0 }
  }
  return { source: 'html', nextUrl: competitor.catalog_url, pageCount: 0 }
}
