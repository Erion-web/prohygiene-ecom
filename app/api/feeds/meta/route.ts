import { createPublicClient } from '@/lib/supabase/public'
import { applyPriceGate, getGatedBrandIds } from '@/lib/store/price-gate'
import type { Product } from '@/types'

export const revalidate = 3600

const SITE = 'https://prohygiene.shop'

const HEADERS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'sale_price',
  'link',
  'image_link',
  'additional_image_link',
  'brand',
  'google_product_category',
  'product_type',
] as const

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function money(n: number): string {
  return `${n.toFixed(2)} EUR`
}

export async function GET() {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(name_sq), brand:brands(name)')
    .eq('is_active', true)
    .eq('listing_type', 'sale')
    .eq('is_material', false)
    .not('image_url', 'is', null)

  if (error) {
    return new Response(error.message, { status: 500 })
  }

  // Brands with hidden prices must not leak into the public feed.
  const gatedBrandIds = await getGatedBrandIds()
  const products = applyPriceGate((data ?? []) as Product[], gatedBrandIds, false)

  const rows = products
    .filter(p => !p.price_hidden && p.price > 0 && p.image_url)
    .map(p => {
      const onSale = p.sale_price != null && p.sale_price > 0 && p.sale_price < p.price
      const description = (p.description_sq ?? p.meta_description_sq ?? p.name_sq).trim()
      const cells: string[] = [
        p.sku || p.id,
        p.name_sq,
        description,
        p.stock > 0 ? 'in stock' : 'out of stock',
        'new',
        money(p.price),
        onSale ? money(p.sale_price as number) : '',
        `${SITE}/product/${p.slug}`,
        p.image_url as string,
        (p.gallery_urls ?? []).slice(0, 10).join(','),
        p.brand?.name ?? 'ProHygiene',
        '',
        p.category?.name_sq ?? '',
      ]
      return cells.map(csvCell).join(',')
    })

  const csv = [HEADERS.join(','), ...rows].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
