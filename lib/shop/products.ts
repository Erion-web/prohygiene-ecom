import type { SupabaseClient } from '@supabase/supabase-js'
import { sanitizeStoreSearch } from '@/lib/search/store-products'
import type { Product } from '@/types'
import type { ShopListFilters } from './query'

async function resolveCategoryId(supabase: SupabaseClient, slug: string) {
  const { data } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  return data?.id ?? null
}

function applySort<T extends { order: (column: string, options: { ascending: boolean }) => T }>(
  query: T,
  sort: ShopListFilters['sort'],
): T {
  switch (sort) {
    case 'price_asc':
      return query.order('price', { ascending: true })
    case 'price_desc':
      return query.order('price', { ascending: false })
    case 'best_sellers':
      return query
        .order('is_best_seller', { ascending: false })
        .order('created_at', { ascending: false })
    default:
      return query.order('created_at', { ascending: false })
  }
}

export async function fetchShopProductsPage(
  supabase: SupabaseClient,
  filters: ShopListFilters,
  pageSize: number,
) {
  const page = Math.max(1, filters.page)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const search = filters.search ? sanitizeStoreSearch(filters.search) : ''

  let query = supabase
    .from('products')
    .select('*, category:categories(*)', { count: 'exact' })
    .eq('is_active', true)
    .eq('listing_type', 'sale')

  if (search.length >= 2) {
    query = query.or(`name_sq.ilike.%${search}%,name_en.ilike.%${search}%,sku.ilike.%${search}%`)
  }

  if (filters.category) {
    const categoryId = await resolveCategoryId(supabase, filters.category)
    if (categoryId) query = query.eq('category_id', categoryId)
    else return { products: [] as Product[], total: 0 }
  }

  if (filters.audience_type) {
    query = query.in('audience_type', [filters.audience_type, 'both'])
  }

  if (filters.on_sale) {
    query = query.not('sale_price', 'is', null)
  }

  if (filters.in_stock) {
    query = query.gt('stock', 0)
  }

  if (filters.featured) {
    query = query.eq('is_featured', true)
  }

  if (filters.min_price != null) {
    query = query.or(
      `sale_price.gte.${filters.min_price},and(sale_price.is.null,price.gte.${filters.min_price})`,
    )
  }

  if (filters.max_price != null) {
    query = query.or(
      `sale_price.lte.${filters.max_price},and(sale_price.is.null,price.lte.${filters.max_price})`,
    )
  }

  query = applySort(query, filters.sort)

  const { data, count, error } = await query.range(from, to)

  if (error) {
    return { products: [] as Product[], total: 0, error }
  }

  return {
    products: (data ?? []) as Product[],
    total: count ?? 0,
    error: null,
  }
}
