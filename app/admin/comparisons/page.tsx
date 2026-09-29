import { AdminHeader } from '@/components/admin/AdminHeader'
import { ComparisonsTableClient } from '@/app/admin/comparisons/ComparisonsTableClient'
import {
  COMPARISON_TABLE_PAGE_SIZE,
  loadComparisonTablePage,
  parseComparisonTableParams,
} from '@/lib/comparisons/query-table'

export const dynamic = 'force-dynamic'

export default async function ComparisonsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseComparisonTableParams(await searchParams)
  const { rows, total } = await loadComparisonTablePage({
    q: filters.q,
    skip: filters.skip,
    take: filters.take,
  })

  return (
    <div>
      <AdminHeader title="Krahasimet" />
      <div className="admin-page">
        <ComparisonsTableClient
          rows={rows}
          total={total}
          page={filters.page}
          pageSize={COMPARISON_TABLE_PAGE_SIZE}
          initialQuery={filters.q}
        />
      </div>
    </div>
  )
}
