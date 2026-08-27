import { AdminHeader } from '@/components/admin/AdminHeader'
import { createClient } from '@/lib/supabase/server'
import { MaterialsClient } from './MaterialsClient'
import type { Material, UtilityCategory } from '@/types'

export default async function LeaseMaterialsPage() {
  const supabase = await createClient()
  const [materialsRes, categoriesRes] = await Promise.all([
    supabase.from('materials').select('*, utility_category:utility_categories(*)').order('name_sq'),
    supabase.from('utility_categories').select('*').eq('is_active', true).order('sort_order'),
  ])

  return (
    <div>
      <AdminHeader title="Lëndët e Para" subtitle="Materialet për pajisjet në shfrytëzim" />
      <div className="admin-page">
        <MaterialsClient
          initialMaterials={(materialsRes.data as Material[]) ?? []}
          categories={(categoriesRes.data as UtilityCategory[]) ?? []}
        />
      </div>
    </div>
  )
}
