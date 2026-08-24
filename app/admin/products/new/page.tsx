import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { ProductForm } from '../ProductForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewProductPage() {
  const supabase = await createClient()
  const [{ data: categories }, { data: brands }, { data: materials }] = await Promise.all([
    supabase.from('categories').select('id, name_sq, name_en').eq('is_active', true).order('sort_order'),
    supabase.from('brands').select('id, name').eq('is_active', true).order('sort_order'),
    supabase.from('materials').select('*').eq('is_active', true).order('name_sq'),
  ])

  return (
    <div>
      <AdminHeader
        title="Shto Produkt të Ri"
        actions={
          <Link href="/admin/products" className="btn-ghost gap-1.5 text-sm">
            <ArrowLeft size={15} />
            Kthehu
          </Link>
        }
      />
      <div className="p-6">
        <ProductForm categories={categories ?? []} brands={brands ?? []} materials={materials ?? []} />
      </div>
    </div>
  )
}
