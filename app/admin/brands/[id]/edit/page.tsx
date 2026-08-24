import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BrandForm } from '../../BrandForm'

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: brand } = await supabase.from('brands').select('*').eq('id', id).single()
  if (!brand) notFound()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-black text-text-primary mb-6">Ndrysho: {brand.name}</h1>
      <BrandForm brand={brand} />
    </div>
  )
}
