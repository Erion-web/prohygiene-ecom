'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeMaterialUnit, syncProductMaterial } from '@/lib/lease/sync-material'
import { saveProductSchema, type SaveProductInput } from '@/lib/validation/admin-schemas'
import { actionError, type ActionResult } from '@/lib/actions/types'

export async function saveProductAction(raw: SaveProductInput): Promise<ActionResult<{ id: string }>> {
  const { authorized } = await requireAdmin()
  if (!authorized) return actionError('Forbidden')

  const parsed = saveProductSchema.safeParse(raw)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Invalid product data')
  }

  const input = parsed.data
  const supabase = await createServiceClient()
  const [coverImage, ...galleryImages] = input.images

  const payload = {
    sku: input.sku,
    name_sq: input.name_sq,
    name_en: input.name_en || input.name_sq,
    slug: input.slug,
    description_sq: input.description_sq || null,
    description_en: input.description_en || null,
    category_id: input.category_id || null,
    audience_type: input.audience_type,
    listing_type: input.for_sale ? 'sale' as const : 'lease' as const,
    available_for_lease: input.for_lease,
    price: input.price,
    sale_price: input.sale_price ?? null,
    stock: input.stock,
    unit: normalizeMaterialUnit(input.unit),
    vat_rate: input.vat_rate,
    image_url: coverImage ?? null,
    gallery_urls: galleryImages,
    brand_id: input.brand_id || null,
    is_featured: input.is_featured,
    is_best_seller: input.is_best_seller,
    is_active: input.is_active,
    is_material: input.is_material,
  }

  let productId = input.id
  if (productId) {
    const { error } = await supabase.from('products').update(payload).eq('id', productId)
    if (error) {
      console.error('[saveProduct] update failed', error)
      return actionError('Failed to save product')
    }
  } else {
    const { data, error } = await supabase.from('products').insert(payload).select('id').single()
    if (error || !data) {
      console.error('[saveProduct] insert failed', error)
      return actionError('Failed to save product')
    }
    productId = data.id
  }

  if (!productId) return actionError('Failed to save product')

  const { error: deleteDmError } = await supabase.from('device_materials').delete().eq('product_id', productId)
  if (deleteDmError) {
    console.error('[saveProduct] device_materials delete failed', deleteDmError)
    return actionError('Failed to save device materials')
  }

  if (input.for_lease && input.device_materials.length > 0) {
    const { error: dmError } = await supabase.from('device_materials').insert(
      input.device_materials.map(row => ({
        product_id: productId,
        material_id: row.material_id,
        capacity: row.capacity,
      }))
    )
    if (dmError) {
      console.error('[saveProduct] device_materials insert failed', dmError)
      return actionError('Failed to save device materials')
    }
  }

  const materialSync = await syncProductMaterial(supabase, productId, {
    is_material: input.is_material,
    name_sq: input.name_sq,
    name_en: input.name_en || input.name_sq,
    category_id: input.category_id || null,
    unit: input.unit,
    is_active: input.is_active,
  })
  if (materialSync.error) {
    return actionError(materialSync.error)
  }

  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return { ok: true, data: { id: productId } }
}
