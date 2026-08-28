import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { SalesClient } from './SalesClient'
import {
  SALES_PAGE_SIZE,
  applySalesListFilters,
  parseSalesListParams,
  sanitizeSalesSearch,
  type SalesListFilters,
} from './query'

async function getData(filters: SalesListFilters) {
  const supabase = await createClient()
  const q = sanitizeSalesSearch(filters.q)
  const from = (filters.page - 1) * SALES_PAGE_SIZE
  const to = from + SALES_PAGE_SIZE - 1

  // Explicit `any` here is deliberate: reassigning this query through a helper
  // otherwise makes TS try to fully resolve Supabase's generated builder type
  // across both assignment sites, which blows up with "Type instantiation is
  // excessively deep and possibly infinite" (a known supabase-js/TS pain point).
  let listQuery: any = supabase
    .from('products')
    .select(
      'id, sku, name_sq, price, sale_price, image_url, is_active, category:categories(name_sq), brand:brands(name)',
      { count: 'exact' },
    )
    .order('name_sq', { ascending: true })

  listQuery = applySalesListFilters(listQuery, filters, q)

  const baseActive = () =>
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true)

  const [productsRes, totalRes, onSaleRes] = await Promise.all([
    listQuery.range(from, to),
    baseActive(),
    baseActive().not('sale_price', 'is', null),
  ])

  const total = totalRes.count ?? 0
  const onSale = onSaleRes.count ?? 0

  return {
    products: productsRes.data ?? [],
    matched: productsRes.count ?? 0,
    stats: {
      total,
      onSale,
      noSale: total - onSale,
    },
  }
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseSalesListParams(await searchParams)
  const { products, matched, stats } = await getData(filters)

  return (
    <div>
      <AdminHeader
        title="Menaxhimi i Zbritjeve"
        subtitle="Vendosni ose hiqni çmimet e zbritura për produkte individualisht ose në grup"
      />
      <div className="admin-page">
        <SalesClient
          products={products}
          matched={matched}
          page={filters.page}
          pageSize={SALES_PAGE_SIZE}
          stats={stats}
          filters={filters}
        />
      </div>
    </div>
  )
}
