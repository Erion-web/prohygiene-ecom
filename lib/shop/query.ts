import type { AudienceType } from '@/types'

export const SHOP_PAGE_SIZE = 24

export type ShopSort = 'newest' | 'price_asc' | 'price_desc' | 'best_sellers' | 'featured'

export type ShopListFilters = {
  category?: string
  audience_type?: AudienceType
  search?: string
  on_sale: boolean
  in_stock: boolean
  featured: boolean
  min_price?: number
  max_price?: number
  sort: ShopSort
  page: number
}

function first(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key]
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

export function parseShopListParams(
  sp: Record<string, string | string[] | undefined>,
): ShopListFilters {
  const page = Math.max(1, parseInt(first(sp, 'page'), 10) || 1)
  const sortRaw = first(sp, 'sort')
  const sort: ShopSort =
    sortRaw === 'price_asc' || sortRaw === 'price_desc' || sortRaw === 'best_sellers' || sortRaw === 'featured'
      ? sortRaw
      : 'newest'
  const audience = first(sp, 'audience_type')
  const minPrice = first(sp, 'min_price')
  const maxPrice = first(sp, 'max_price')

  return {
    category: first(sp, 'category') || undefined,
    audience_type:
      audience === 'home' || audience === 'business' || audience === 'both'
        ? audience
        : undefined,
    search: first(sp, 'search').trim() || undefined,
    on_sale: first(sp, 'on_sale') === 'true',
    in_stock: first(sp, 'in_stock') === 'true',
    featured: first(sp, 'featured') === 'true',
    min_price: minPrice ? Number(minPrice) : undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
    sort,
    page,
  }
}

export function shopListSearchParams(filters: ShopListFilters) {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.audience_type) params.set('audience_type', filters.audience_type)
  if (filters.search) params.set('search', filters.search)
  if (filters.on_sale) params.set('on_sale', 'true')
  if (filters.in_stock) params.set('in_stock', 'true')
  if (filters.featured) params.set('featured', 'true')
  if (filters.min_price != null) params.set('min_price', String(filters.min_price))
  if (filters.max_price != null) params.set('max_price', String(filters.max_price))
  if (filters.sort !== 'newest') params.set('sort', filters.sort)
  if (filters.page > 1) params.set('page', String(filters.page))
  return params.toString()
}

export function shopFiltersKey(filters: ShopListFilters) {
  return shopListSearchParams({ ...filters, page: 1 })
}
