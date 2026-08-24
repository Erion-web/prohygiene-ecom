import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { ProductForm } from '../../ProductForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { DeviceMaterial, Material } from '@/types'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const [productRes, deviceMaterialsRes, categoriesRes, brandsRes, materialsRes] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('device_materials').select('*, material:materials(*)').eq('product_id', id),
    supabase.from('categories').select('id, name_sq, name_en').eq('is_active', true).order('sort_order'),
    supabase.from('brands').select('id, name').eq('is_active', true).order('sort_order'),
    supabase.from('materials').select('*').eq('is_active', true).order('name_sq'),
  ])

  if (!productRes.data) notFound()

  return (
    <div>
      <AdminHeader
        title={`Modifiko: ${productRes.data.name_sq}`}
        actions={
          <Link href="/admin/products" className="btn-ghost gap-1.5 text-sm">
            <ArrowLeft size={15} />
            Kthehu
          </Link>
        }
      />
      <div className="p-6">
        <ProductForm
          categories={categoriesRes.data ?? []}
          brands={brandsRes.data ?? []}
          materials={(materialsRes.data as Material[]) ?? []}
          initialDeviceMaterials={(deviceMaterialsRes.data as DeviceMaterial[]) ?? []}
          product={productRes.data}
        />
      </div>
    </div>
  )
}
