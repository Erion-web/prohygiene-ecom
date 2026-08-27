import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { BrandForm } from '../../BrandForm'

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: brand } = await supabase.from('brands').select('*').eq('id', id).single()
  if (!brand) notFound()

  return (
    <div>
      <AdminHeader title={`Ndrysho: ${brand.name}`} subtitle="Përditëso informacionin e brendit" />
      <div className="admin-page max-w-2xl">
        <BrandForm brand={brand} />
      </div>
    </div>
  )
}
