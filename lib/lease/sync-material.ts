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
    is_active: data.is_active,
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
  unit: MaterialUnit
  is_active: boolean
}

export function materialOptionLabel(name: string, unit: string, isActive = true) {
  return isActive ? `${name} (${unit})` : `${name} (${unit}) · Joaktiv`
}

export async function listMaterialProductOptions(
  supabase: SupabaseClient,
  q = ''
): Promise<MaterialProductOption[]> {
  let query = supabase
    .from('products')
    .select('id, name_sq, name_en, category_id, unit, is_active')
    .eq('is_material', true)
    .order('name_sq')

  if (q) query = query.or(`name_sq.ilike.%${q}%,name_en.ilike.%${q}%,sku.ilike.%${q}%`)

  const { data: products } = await query
  if (!products?.length) return []

  const productIds = products.map(p => p.id)
  const { data: existing } = await supabase
    .from('materials')
    .select('id, product_id')
    .in('product_id', productIds)

  const byProduct = new Map(
    (existing ?? []).filter(m => m.product_id).map(m => [m.product_id as string, m.id as string])
  )
  const missing = products.filter(p => !byProduct.has(p.id) && p.category_id)

  if (missing.length > 0) {
    const { data: upserted } = await supabase
      .from('materials')
      .upsert(
        missing.map(p => ({
          product_id: p.id,
          category_id: p.category_id,
          name_sq: p.name_sq,
          name_en: p.name_en || p.name_sq,
          unit: normalizeMaterialUnit(p.unit),
          is_active: true,
        })),
        { onConflict: 'product_id' }
      )
      .select('id, product_id')

    for (const row of upserted ?? []) {
      if (row.product_id) byProduct.set(row.product_id, row.id)
    }
  }

  const unresolved = products.filter(p => !byProduct.has(p.id)).map(p => p.id)
  if (unresolved.length > 0) {
    const { data: again } = await supabase
      .from('materials')
      .select('id, product_id')
      .in('product_id', unresolved)
    for (const row of again ?? []) {
      if (row.product_id) byProduct.set(row.product_id, row.id)
    }
  }

  return products
    .filter(p => byProduct.has(p.id))
    .map(p => ({
      id: byProduct.get(p.id) as string,
      product_id: p.id,
      name_sq: p.name_sq,
      unit: normalizeMaterialUnit(p.unit),
      is_active: Boolean(p.is_active),
    }))
}
