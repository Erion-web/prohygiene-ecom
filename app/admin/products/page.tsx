import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { Plus, Upload } from 'lucide-react'
import { ProductsClient } from './ProductsClient'
import {
  PRODUCTS_PAGE_SIZE,
  parseProductListParams,
  sanitizeProductSearch,
  type ProductListFilters,
} from './query'

async function getData(filters: ProductListFilters) {
  const supabase = await createClient()
  const from = (filters.page - 1) * PRODUCTS_PAGE_SIZE
  const to = from + PRODUCTS_PAGE_SIZE - 1
  const q = sanitizeProductSearch(filters.q)

  let listQuery = supabase
    .from('products')
    .select('*, category:categories(name_sq), brand:brands(name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (q) {
    listQuery = listQuery.or(`name_sq.ilike.%${q}%,name_en.ilike.%${q}%,sku.ilike.%${q}%`)
  }
  if (filters.categoryId) listQuery = listQuery.eq('category_id', filters.categoryId)
  if (filters.brandId) listQuery = listQuery.eq('brand_id', filters.brandId)
  if (filters.audience) listQuery = listQuery.eq('audience_type', filters.audience)
  if (filters.status === 'active') listQuery = listQuery.eq('is_active', true)
  if (filters.status === 'inactive') listQuery = listQuery.eq('is_active', false)
  if (filters.stock === 'in') listQuery = listQuery.gt('stock', 0)
  if (filters.stock === 'out') listQuery = listQuery.eq('stock', 0)
  if (filters.stock === 'low') listQuery = listQuery.gt('stock', 0).lte('stock', 10)
  if (filters.onSale) listQuery = listQuery.not('sale_price', 'is', null)
  if (filters.featured) listQuery = listQuery.eq('is_featured', true)
  if (filters.bestSeller) listQuery = listQuery.eq('is_best_seller', true)
  if (filters.listingType === 'sale') listQuery = listQuery.eq('listing_type', 'sale')
  if (filters.listingType === 'lease') listQuery = listQuery.eq('available_for_lease', true)
  if (filters.material === 'yes') listQuery = listQuery.eq('is_material', true)
  if (filters.material === 'no') listQuery = listQuery.eq('is_material', false)

  const [
    productsRes,
    categoriesRes,
    brandsRes,
    totalRes,
    activeRes,
    outRes,
    lowRes,
    saleRes,
  ] = await Promise.all([
    listQuery.range(from, to),
    supabase.from('categories').select('id, name_sq').eq('is_active', true).order('name_sq'),
    supabase.from('brands').select('id, name').eq('is_active', true).order('name'),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('stock', 0),
    supabase.from('products').select('id', { count: 'exact', head: true }).gt('stock', 0).lte('stock', 10),
    supabase.from('products').select('id', { count: 'exact', head: true }).not('sale_price', 'is', null),
  ])

  return {
    products: productsRes.data ?? [],
    matched: productsRes.count ?? 0,
    categories: categoriesRes.data ?? [],
    brands: brandsRes.data ?? [],
    stats: {
      total: totalRes.count ?? 0,
      active: activeRes.count ?? 0,
      outOfStock: outRes.count ?? 0,
      lowStock: lowRes.count ?? 0,
      onSale: saleRes.count ?? 0,
    },
  }
}

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseProductListParams(await searchParams)
  const { products, matched, categories, brands, stats } = await getData(filters)

  return (
    <div>
      <AdminHeader
        title="Produktet"
        subtitle={`${stats.total} produkte gjithsej`}
        actions={
          <div className="flex gap-2">
            <Link href="/admin/products/new?lease=1" className="btn-secondary gap-2 text-sm py-2">
              <Plus size={15} />
              <span className="hidden sm:inline">Pajisje SH</span>
            </Link>
            <Link href="/admin/products/import" className="btn-secondary gap-2 text-sm py-2">
              <Upload size={15} />
              <span className="hidden sm:inline">Importo</span>
            </Link>
            <Link href="/admin/products/new" className="btn-primary gap-2 text-sm py-2">
              <Plus size={15} />
              <span className="hidden sm:inline">Shto Produkt</span>
            </Link>
          </div>
        }
      />
      <ProductsClient
        products={products}
        categories={categories}
        brands={brands}
        matched={matched}
        page={filters.page}
        pageSize={PRODUCTS_PAGE_SIZE}
        stats={stats}
        filters={filters}
      />
    </div>
  )
}
