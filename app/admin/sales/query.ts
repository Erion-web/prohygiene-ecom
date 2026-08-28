export const SALES_PAGE_SIZE = 20

export type SalesSaleFilter = 'all' | 'on_sale' | 'no_sale'

export type SalesListFilters = {
  q: string
  sale: SalesSaleFilter
  page: number
}

function first(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key]
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

export function parseSalesListParams(
  sp: Record<string, string | string[] | undefined>,
): SalesListFilters {
  const page = Math.max(1, parseInt(first(sp, 'page'), 10) || 1)
  const saleRaw = first(sp, 'sale')
  const sale: SalesSaleFilter =
    saleRaw === 'on_sale' || saleRaw === 'no_sale' ? saleRaw : 'all'
  return {
    q: first(sp, 'q').trim(),
    sale,
    page,
  }
}

export function salesListSearchParams(filters: SalesListFilters) {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.sale !== 'all') params.set('sale', filters.sale)
  if (filters.page > 1) params.set('page', String(filters.page))
  return params.toString()
}

export function sanitizeSalesSearch(q: string) {
  return q.replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

type FilterableQuery = {
  eq: (column: string, value: unknown) => FilterableQuery
  or: (filters: string) => FilterableQuery
  not: (column: string, operator: string, value: null) => FilterableQuery
  is: (column: string, value: null) => FilterableQuery
}

// Deliberately not generic over the caller's exact Supabase query builder type —
// doing so makes TS try to fully resolve that (very deep) generated type through
// this function's chain, which blows up with "Type instantiation is excessively
// deep and possibly infinite". Operating on the narrow FilterableQuery interface
// instead keeps the check shallow; cast back to the original type at the call site.
export function applySalesListFilters(
  query: FilterableQuery,
  filters: SalesListFilters,
  q: string,
): FilterableQuery {
  let next = query.eq('is_active', true)
  if (q) {
    next = next.or(`name_sq.ilike.%${q}%,sku.ilike.%${q}%`)
  }
  if (filters.sale === 'on_sale') {
    next = next.not('sale_price', 'is', null)
  }
  if (filters.sale === 'no_sale') {
    next = next.is('sale_price', null)
  }
  return next
}
