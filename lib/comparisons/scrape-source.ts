import { usesJsonCatalog } from '@/lib/comparisons/json-api-catalog'
import type { Competitor } from '@/types'

export type ScrapeSourceKind = 'html' | 'json_api'

export interface ScrapeCursor {
  source?: ScrapeSourceKind
  nextUrl?: string | null
  pageCount?: number
  productOffset?: number
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
