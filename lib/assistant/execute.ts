import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlanItem } from './schemas'

export type ItemResult = { label: string; ok: boolean; message: string }

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ë/g, 'e')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || 'produkt'
  )
}

const norm = (s: string) => s.trim().toLowerCase()

export async function executePlan(supabase: SupabaseClient, plan: PlanItem[]): Promise<ItemResult[]> {
  const [{ data: cats }, { data: brands }, { data: existing }] = await Promise.all([
    supabase.from('categories').select('id, name_sq'),
    supabase.from('brands').select('id, name'),
    supabase.from('products').select('sku, slug'),
  ])
  const catByName = new Map((cats ?? []).map(c => [norm(c.name_sq), c.id as string]))
  const brandByName = new Map((brands ?? []).map(b => [norm(b.name), b.id as string]))
  const usedSkus = new Set((existing ?? []).map(p => norm(p.sku)))
  const usedSlugs = new Set((existing ?? []).map(p => p.slug as string))

  const results: ItemResult[] = []

  for (const item of plan) {
    const label = item.type === 'create_product' ? item.name_sq : item.sku
    try {
      let categoryId: string | null | undefined
      if (item.category_name) {
        categoryId = catByName.get(norm(item.category_name))
        if (!categoryId) {
          results.push({ label, ok: false, message: `Kategoria "${item.category_name}" nuk ekziston` })
          continue
        }
      }
      let brandId: string | null | undefined
      if (item.brand_name) {
        brandId = brandByName.get(norm(item.brand_name))
        if (!brandId) {
          results.push({ label, ok: false, message: `Brendi "${item.brand_name}" nuk ekziston` })
          continue
        }
      }

      if (item.type === 'create_product') {
        let sku = item.sku?.trim()
        if (sku && usedSkus.has(norm(sku))) {
          results.push({ label, ok: false, message: `SKU ${sku} ekziston tashmë` })
          continue
        }
        if (!sku) {
          do sku = `PH-${Math.floor(100000 + Math.random() * 900000)}`
          while (usedSkus.has(norm(sku)))
        }
        let slug = slugify(item.name_sq)
        if (usedSlugs.has(slug)) slug = `${slug}-${slugify(sku!)}`
        usedSkus.add(norm(sku!))
        usedSlugs.add(slug)

        const { error } = await supabase.from('products').insert({
          sku,
          name_sq: item.name_sq,
          name_en: item.name_en || item.name_sq,
          slug,
          description_sq: item.description_sq || null,
          description_en: item.description_en || null,
          category_id: categoryId ?? null,
          brand_id: brandId ?? null,
          audience_type: item.audience_type,
          listing_type: 'sale',
          available_for_lease: false,
          price: item.price,
          sale_price: item.sale_price ?? null,
          stock: item.stock,
          unit: item.unit,
          vat_rate: 18,
          image_url: null,
          gallery_urls: [],
          is_featured: item.is_featured,
          is_best_seller: false,
          is_active: item.is_active,
          is_material: false,
        })
        results.push(error ? { label, ok: false, message: error.message } : { label, ok: true, message: `U krijua (${sku})` })
      } else {
        const patch: Record<string, unknown> = {}
        for (const k of [
          'name_sq', 'description_sq', 'price', 'sale_price', 'stock',
          'audience_type', 'is_active', 'is_featured', 'is_best_seller',
        ] as const) {
          if (item[k] !== undefined) patch[k] = item[k]
        }
        if (categoryId) patch.category_id = categoryId
        if (brandId) patch.brand_id = brandId
        if (Object.keys(patch).length === 0) {
          results.push({ label, ok: false, message: 'Asnjë ndryshim' })
          continue
        }
        const { data, error } = await supabase
          .from('products')
          .update(patch)
          .eq('sku', item.sku)
          .select('id')
        if (error) results.push({ label, ok: false, message: error.message })
        else if (!data?.length) results.push({ label, ok: false, message: 'SKU nuk u gjet' })
        else results.push({ label, ok: true, message: 'U përditësua' })
      }
    } catch (e) {
      results.push({ label, ok: false, message: e instanceof Error ? e.message : 'Gabim' })
    }
  }
  return results
}
