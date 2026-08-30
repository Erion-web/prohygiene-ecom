import type { SupabaseClient } from '@supabase/supabase-js'
import type { MaterialUnit } from '@/types'

export const PRODUCT_UNITS: { value: MaterialUnit; label: string }[] = [
  { value: 'cope', label: 'copë' },
  { value: 'pako', label: 'pako' },
  { value: 'ml', label: 'ml' },
]

export function normalizeMaterialUnit(unit: string): MaterialUnit {
  const match = PRODUCT_UNITS.find(u => u.value === unit)
  return match?.value ?? 'cope'
}

export async function syncProductMaterial(
  supabase: SupabaseClient,
  productId: string,
  data: {
    is_material: boolean
    name_sq: string
    name_en: string
    category_id: string | null
    unit: string
    is_active: boolean
  }
): Promise<{ error: string | null }> {
  if (!data.is_material) {
    const { error } = await supabase.from('materials').delete().eq('product_id', productId)
    return { error: error?.message ?? null }
  }

  if (!data.category_id) {
    return { error: 'Kategoria është e detyrueshme për lëndën e parë' }
  }

  const unit = normalizeMaterialUnit(data.unit)
  const { data: existing } = await supabase
    .from('materials')
    .select('id')
    .eq('product_id', productId)
    .maybeSingle()

  const payload = {
    product_id: productId,
    category_id: data.category_id,
    name_sq: data.name_sq,
    name_en: data.name_en || data.name_sq,
    unit,
    is_active: true,
  }

  if (existing?.id) {
    const { error } = await supabase.from('materials').update(payload).eq('id', existing.id)
    return { error: error?.message ?? null }
  }

  const { error } = await supabase.from('materials').insert(payload)
  return { error: error?.message ?? null }
}

export type MaterialProductOption = {
  id: string
  product_id: string
  name_sq: string
  sku?: string
  unit: MaterialUnit
  is_active: boolean
}

export function materialOptionLabel(name: string, unit: string, isActive = true, sku?: string) {
  const base = sku ? `${name} (${unit}) · ${sku}` : `${name} (${unit})`
  return isActive ? base : `${base} · Joaktiv`
}

async function ensureMaterialRows(
  supabase: SupabaseClient,
  products: Array<{
    id: string
    name_sq: string
    name_en: string | null
    category_id: string | null
    unit: string
  }>
) {
  const byProduct = new Map<string, string>()
  if (products.length === 0) return byProduct

  const { data: existing } = await supabase
    .from('materials')
    .select('id, product_id')
    .in('product_id', products.map(p => p.id))

  for (const row of existing ?? []) {
    if (row.product_id) byProduct.set(row.product_id, row.id)
  }

  const missing = products.filter(p => !byProduct.has(p.id))
  if (missing.length === 0) return byProduct

  let fallbackCategory = missing.find(p => p.category_id)?.category_id ?? null
  if (!fallbackCategory) {
    const { data: category } = await supabase.from('categories').select('id').limit(1).maybeSingle()
    fallbackCategory = category?.id ?? null
  }

  for (const product of missing) {
    const categoryId = product.category_id || fallbackCategory
    if (!categoryId) continue

    const payload = {
      product_id: product.id,
      category_id: categoryId,
      name_sq: product.name_sq,
      name_en: product.name_en || product.name_sq,
      unit: normalizeMaterialUnit(product.unit),
      is_active: true,
    }

    const { data: upserted } = await supabase
      .from('materials')
      .upsert(payload, { onConflict: 'product_id' })
      .select('id, product_id')
      .maybeSingle()

    if (upserted?.product_id && upserted.id) {
      byProduct.set(upserted.product_id, upserted.id)
      continue
    }

    const { data: inserted } = await supabase
      .from('materials')
      .insert(payload)
      .select('id, product_id')
      .maybeSingle()

    if (inserted?.product_id && inserted.id) {
      byProduct.set(inserted.product_id, inserted.id)
      continue
    }

    const { data: found } = await supabase
      .from('materials')
      .select('id, product_id')
      .eq('product_id', product.id)
      .maybeSingle()

    if (found?.product_id && found.id) byProduct.set(found.product_id, found.id)
  }

  return byProduct
}

export async function listMaterialProductOptions(
  supabase: SupabaseClient,
  q = ''
): Promise<MaterialProductOption[]> {
  let query = supabase
    .from('products')
    .select('id, sku, name_sq, name_en, category_id, unit, is_active')
    .eq('is_material', true)
    .order('name_sq')

  if (q) query = query.or(`name_sq.ilike.%${q}%,name_en.ilike.%${q}%,sku.ilike.%${q}%`)

  const { data: products, error } = await query
  if (error || !products?.length) {
    if (error) console.error('[materials] product list failed', error.message)
    return []
  }

  const byProduct = await ensureMaterialRows(supabase, products)

  return products
    .filter(p => byProduct.has(p.id))
    .map(p => ({
      id: byProduct.get(p.id) as string,
      product_id: p.id,
      name_sq: p.name_sq,
      sku: p.sku,
      unit: normalizeMaterialUnit(p.unit),
      is_active: Boolean(p.is_active),
    }))
}
