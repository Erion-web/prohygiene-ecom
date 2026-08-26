import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { ProductForm } from '../ProductForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ lease?: string; return?: string }>
}) {
  const { lease, return: returnTo } = await searchParams
  const isLease = lease === '1'

  const supabase = await createClient()
  const [{ data: categories }, { data: brands }, { data: materials }] = await Promise.all([
    supabase.from('categories').select('id, name_sq, name_en').eq('is_active', true).order('sort_order'),
    supabase.from('brands').select('id, name').eq('is_active', true).order('sort_order'),
    supabase.from('materials').select('*').eq('is_active', true).order('name_sq'),
  ])

  return (
    <div>
      <AdminHeader
        title={isLease ? 'Shto Pajisje (Shfrytëzim)' : 'Shto Produkt të Ri'}
        actions={
          <Link href={returnTo ?? '/admin/products'} className="btn-ghost gap-1.5 text-sm">
            <ArrowLeft size={15} />
            Kthehu
          </Link>
        }
      />
      <div className="p-4">
        <ProductForm
          categories={categories ?? []}
          brands={brands ?? []}
          materials={materials ?? []}
          defaultForLease={isLease}
          returnTo={returnTo}
        />
      </div>
    </div>
  )
}
