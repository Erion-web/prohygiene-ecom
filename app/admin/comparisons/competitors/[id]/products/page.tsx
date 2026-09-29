import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { CompetitorProductsClient } from './CompetitorProductsClient'
import {
  COMPETITOR_PRODUCTS_PAGE_SIZE,
  competitorProductsSearchFilter,
  parseCompetitorProductsParams,
} from './query'
import type { CompetitorProduct } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CompetitorProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const filters = parseCompetitorProductsParams(await searchParams)
  const supabase = await createClient()

  const { data: competitor } = await supabase.from('competitors').select('name').eq('id', id).single()
  if (!competitor) notFound()

  const from = (filters.page - 1) * COMPETITOR_PRODUCTS_PAGE_SIZE
  const to = from + COMPETITOR_PRODUCTS_PAGE_SIZE - 1

  let listQuery = supabase
    .from('competitor_products')
    .select('*', { count: 'exact' })
    .eq('competitor_id', id)
    .order('name')

  const searchFilter = competitorProductsSearchFilter(filters.q)
  if (searchFilter) listQuery = listQuery.or(searchFilter)

  const [{ data: products, count: matched }, { data: ourProducts }] = await Promise.all([
    listQuery.range(from, to),
    supabase.from('products').select('id, sku, name_sq').eq('is_active', true).order('name_sq'),
  ])

  const total = matched ?? 0

  return (
    <div>
      <AdminHeader
        title={`Produktet: ${competitor.name}`}
        subtitle={
          total
            ? `${total} produkte të skrapuara`
            : 'Lista e skrapuar. Lidh manualisht me produktet tona.'
        }
      />
      <div className="admin-page">
        <CompetitorProductsClient
          products={(products ?? []) as CompetitorProduct[]}
          ourProducts={ourProducts ?? []}
          matched={total}
          page={filters.page}
          pageSize={COMPETITOR_PRODUCTS_PAGE_SIZE}
          initialQuery={filters.q}
        />
      </div>
    </div>
  )
}
