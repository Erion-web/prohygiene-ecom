import type { SupabaseClient } from '@supabase/supabase-js'
import type { MaterialUnit } from '@/types'
import { sanitizeSearch } from '@/lib/admin/sanitize-search'

export const PRODUCT_UNITS: { value: MaterialUnit; label: string }[] = [
  { value: 'cope', label: 'copë' },
  { value: 'pako', label: 'pako' },
  { value: 'ml', label: 'ml' },
]

export function normalizeMaterialUnit(unit: string): MaterialUnit {
  const match = PRODUCT_UNITS.find(u => u.value === unit)
  return match?.value ?? 'cope'
}

function isMissingColumnError(message: string | undefined, column: string) {
  return Boolean(message?.includes(`'${column}' column`))
}

async function resolveUtilityCategoryId(
  supabase: SupabaseClient,
  productCategoryId: string | null
) {
  const { data: utilities, error } = await supabase
    .from('utility_categories')
    .select('id, slug, name_sq')
    .limit(50)

  if (error || !utilities?.length) return null

  if (productCategoryId) {
    const { data: category } = await supabase
      .from('categories')
      .select('slug, name_sq')
      .eq('id', productCategoryId)
      .maybeSingle()
    const match = utilities.find(row =>
      row.slug === category?.slug || row.name_sq === category?.name_sq
    )
    if (match?.id) return match.id
  }

  return utilities[0]?.id ?? null
}

async function findMaterialId(supabase: SupabaseClient, productId: string) {
  const { data } = await supabase
    .from('materials')
    .select('id')
    .eq('product_id', productId)
    .maybeSingle()
  return data?.id ?? null
}

async function writeMaterialRow(
  supabase: SupabaseClient,
  product: {
    id: string
    name_sq: string
    name_en: string | null
    category_id: string | null
    unit: string
  },
  cachedUtilityCategoryId?: string | null
): Promise<{ id: string | null; error: string | null }> {
  const existingId = await findMaterialId(supabase, product.id)
  const base = {
    product_id: product.id,
    name_sq: product.name_sq,
    name_en: product.name_en || product.name_sq,
    unit: normalizeMaterialUnit(product.unit),
    is_active: true,
  }

  if (existingId) {
    const { error } = await supabase.from('materials').update({
      name_sq: base.name_sq,
      name_en: base.name_en,
      unit: base.unit,
      is_active: true,
    }).eq('id', existingId)
    return { id: existingId, error: error?.message ?? null }
  }

  const utilityCategoryId = cachedUtilityCategoryId === undefined
    ? await resolveUtilityCategoryId(supabase, product.category_id)
    : cachedUtilityCategoryId
  const attempts: Record<string, unknown>[] = []
  if (product.category_id) attempts.push({ ...base, category_id: product.category_id })
  if (utilityCategoryId) attempts.push({ ...base, utility_category_id: utilityCategoryId })
  attempts.push({ ...base })

  let lastError: string | null = null
  for (const payload of attempts) {
    const { data, error } = await supabase
      .from('materials')
      .insert(payload)
      .select('id')
      .maybeSingle()

    if (data?.id) return { id: data.id, error: null }

    lastError = error?.message ?? lastError
    if (
      error &&
      !isMissingColumnError(error.message, 'category_id') &&
      !isMissingColumnError(error.message, 'utility_category_id') &&
      !error.message.includes('utility_category_id')
    ) {
      const recovered = await findMaterialId(supabase, product.id)
      if (recovered) return { id: recovered, error: null }
    }
  }

  const recovered = await findMaterialId(supabase, product.id)
  return { id: recovered, error: recovered ? null : lastError }
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

  const result = await writeMaterialRow(supabase, {
    id: productId,
    name_sq: data.name_sq,
    name_en: data.name_en,
    category_id: data.category_id,
    unit: data.unit,
  })
  return { error: result.id ? null : result.error }
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

export async function listMaterialProductOptions(
  supabase: SupabaseClient,
  q = ''
): Promise<MaterialProductOption[]> {
  const safeQ = sanitizeSearch(q)
  let query = supabase
    .from('products')
    .select('id, sku, name_sq, name_en, category_id, unit, is_active')
    .eq('is_material', true)
    .order('name_sq')

  if (safeQ) query = query.or(`name_sq.ilike.%${safeQ}%,name_en.ilike.%${safeQ}%,sku.ilike.%${safeQ}%`)

  const { data: products, error } = await query
  if (error || !products?.length) {
    if (error) console.error('[materials] product list failed', error.message)
    return []
  }

  const utilityCategoryId = await resolveUtilityCategoryId(supabase, products.find(p => p.category_id)?.category_id ?? null)
  const options: MaterialProductOption[] = []
  for (const product of products) {
    const row = await writeMaterialRow(supabase, product, utilityCategoryId)
    if (!row.id) continue
    options.push({
      id: row.id,
      product_id: product.id,
      name_sq: product.name_sq,
      sku: product.sku,
      unit: normalizeMaterialUnit(product.unit),
      is_active: Boolean(product.is_active),
    })
  }

  return options
}
