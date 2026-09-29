import { sanitizeSearch } from '@/lib/admin/sanitize-search'

export const COMPETITOR_PRODUCTS_PAGE_SIZE = 25

export function parseCompetitorProductsParams(
  searchParams: Record<string, string | string[] | undefined>
) {
  const rawPage = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const q = typeof searchParams.q === 'string' ? sanitizeSearch(searchParams.q) : ''
  return { page, q }
}

export function competitorProductsSearchFilter(q: string) {
  if (!q) return null
  return `name.ilike.%${q}%,external_sku.ilike.%${q}%`
}
