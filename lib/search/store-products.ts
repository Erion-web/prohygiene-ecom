import type { SupabaseClient } from '@supabase/supabase-js'
import type { AudienceType, ListingType, Product } from '@/types'

export type StoreSearchProductRow = {
  id: string
  slug: string
  sku: string
  name_sq: string
  name_en: string
  price: number
  sale_price: number | null
  stock: number
  unit: string
  image_url: string | null
  audience_type: AudienceType
  listing_type: ListingType
  available_for_lease: boolean
  is_featured: boolean
  is_best_seller: boolean
  vat_rate: number
  category_id: string | null
  category_slug: string | null
  category_name_sq: string | null
  category_name_en: string | null
}

export function sanitizeStoreSearch(q: string) {
  return q.replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

export function mapStoreSearchRowToProduct(row: StoreSearchProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name_sq: row.name_sq,
    name_en: row.name_en,
    slug: row.slug,
    description_sq: null,
    description_en: null,
    category_id: row.category_id,
    brand_id: null,
    audience_type: row.audience_type,
    listing_type: row.listing_type,
    available_for_lease: row.available_for_lease,
    price: Number(row.price),
    sale_price: row.sale_price != null ? Number(row.sale_price) : null,
    stock: row.stock,
    unit: row.unit,
    image_url: row.image_url,
    gallery_urls: [],
    is_featured: row.is_featured,
    is_best_seller: row.is_best_seller,
    is_active: true,
    vat_rate: Number(row.vat_rate),
    meta_title_sq: null,
    meta_title_en: null,
    meta_description_sq: null,
    meta_description_en: null,
    created_at: '',
    updated_at: '',
    category: row.category_id
      ? {
          id: row.category_id,
          name_sq: row.category_name_sq ?? '',
          name_en: row.category_name_en ?? '',
          slug: row.category_slug ?? '',
          description_sq: null,
          description_en: null,
          image_url: null,
          parent_id: null,
          audience_type: row.audience_type,
          sort_order: 0,
          is_active: true,
          created_at: '',
          updated_at: '',
        }
      : null,
  }
}

export async function searchStoreProducts(
  supabase: SupabaseClient,
  query: string,
  limit = 8,
) {
  const sanitized = sanitizeStoreSearch(query)
  if (sanitized.length < 2) {
    return { data: [] as StoreSearchProductRow[], error: null }
  }

  const { data, error } = await supabase.rpc('search_store_products', {
    search_query: sanitized,
    result_limit: limit,
  })

  return {
    data: (data ?? []) as StoreSearchProductRow[],
    error,
  }
}
