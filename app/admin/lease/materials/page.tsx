import { AdminHeader } from '@/components/admin/AdminHeader'
import { createClient } from '@/lib/supabase/server'
import { MaterialsClient } from './MaterialsClient'
import type { Category, Material } from '@/types'

export default async function MaterialsPage() {
  const supabase = await createClient()
  const [materialsRes, categoriesRes] = await Promise.all([
    supabase.from('materials').select('*, category:categories(*)').order('name_sq'),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
  ])

  return (
    <div>
      <AdminHeader title="Lëndët" subtitle="Materialet e rimbushjes për pajisjet" />
      <div className="admin-page">
        <MaterialsClient
          initialMaterials={(materialsRes.data as Material[]) ?? []}
          categories={(categoriesRes.data as Category[]) ?? []}
        />
      </div>
    </div>
  )
}
