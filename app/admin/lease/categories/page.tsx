import { AdminHeader } from '@/components/admin/AdminHeader'
import { createClient } from '@/lib/supabase/server'
import { UtilityCategoriesClient } from './UtilityCategoriesClient'
import type { UtilityCategory } from '@/types'

export default async function LeaseCategoriesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('utility_categories')
    .select('*')
    .order('sort_order')

  return (
    <div>
      <AdminHeader title="Kategoritë e Lëndëve" subtitle="Aroma, sapuni, letër dhe materiale të tjera" />
      <div className="admin-page">
        <UtilityCategoriesClient initialCategories={(data as UtilityCategory[]) ?? []} />
      </div>
    </div>
  )
}
