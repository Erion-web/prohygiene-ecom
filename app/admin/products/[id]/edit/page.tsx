import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { ProductForm } from '../../ProductForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { listMaterialProductOptions } from '@/lib/lease/sync-material'
import type { DeviceMaterial } from '@/types'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const [productRes, deviceMaterialsRes, categoriesRes, brandsRes, materials] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('device_materials').select('*, material:materials(*)').eq('product_id', id),
    supabase.from('categories').select('id, name_sq, name_en').eq('is_active', true).order('sort_order'),
    supabase.from('brands').select('id, name').eq('is_active', true).order('sort_order'),
    listMaterialProductOptions(supabase),
  ])

  if (!productRes.data) notFound()

  return (
    <div>
      <AdminHeader
        title={productRes.data.name_sq}
        subtitle={`SKU ${productRes.data.sku}${productRes.data.category_id ? '' : ' · Pa kategori'}`}
        actions={
          <Link href="/admin/products" className="btn-ghost gap-1.5 text-sm">
            <ArrowLeft size={15} />
            Kthehu
          </Link>
        }
      />
      <div className="admin-page">
        <ProductForm
          categories={categoriesRes.data ?? []}
          brands={brandsRes.data ?? []}
          materials={materials.filter(m => m.product_id !== id)}
          initialDeviceMaterials={(deviceMaterialsRes.data as DeviceMaterial[]) ?? []}
          product={productRes.data}
        />
      </div>
    </div>
  )
}
