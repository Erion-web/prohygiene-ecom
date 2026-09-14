import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import type { Product } from '@/types'

// The set of gated brands is global config, safe to cache across requests —
// unlike the gating decision itself, which depends on the viewer's auth state
// and must always be computed fresh per-request (never inside this cache).
export const getGatedBrandIds = unstable_cache(
  async (): Promise<string[]> => {
    const { data } = await createPublicClient()
      .from('brands')
      .select('id')
      .eq('hide_price_unless_authenticated', true)
    return (data ?? []).map(b => b.id as string)
  },
  ['gated-brand-ids'],
  { revalidate: 120, tags: ['brands'] }
)

type GateableProduct = Pick<Product, 'brand_id' | 'price' | 'sale_price'> &
  Partial<Pick<Product, 'effective_price' | 'price_hidden'>>

// Zeroes out the actual price fields (not just hiding them client-side) for
// products under a gated brand when the viewer isn't logged in, so the real
// number never reaches an unauthenticated browser at all.
export function applyPriceGate<T extends GateableProduct>(
  products: T[],
  gatedBrandIds: string[],
  isAuthenticated: boolean
): T[] {
  if (isAuthenticated || gatedBrandIds.length === 0) return products
  const gated = new Set(gatedBrandIds)
  return products.map(p => {
    if (!p.brand_id || !gated.has(p.brand_id)) return p
    return { ...p, price: 0, sale_price: null, effective_price: null, price_hidden: true }
  })
}
