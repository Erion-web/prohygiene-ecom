import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { CategoriesClient } from './CategoriesClient'

export default async function CategoriesAdminPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  return (
    <div>
      <AdminHeader title="Kategoritë" subtitle={`${categories?.length ?? 0} kategori`} />
      <div className="admin-page">
        <CategoriesClient initialCategories={categories ?? []} />
      </div>
    </div>
  )
}
