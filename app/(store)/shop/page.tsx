import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ShopClient } from './ShopClient'
import { fetchShopProductsPage } from '@/lib/shop/products'
import { parseShopListParams, SHOP_PAGE_SIZE } from '@/lib/shop/query'
import type { Category } from '@/types'

export const metadata: Metadata = {
  title: 'Detergjente & Produkte Higjiene Online — Dyqani',
  description: 'Shfleto mbi 200 detergjente, kimikate pastrimi, dezinfektues dhe produkte higjiene. Dërgim 24h në tërë Kosovën. Çmime nga €1.50 — shumicë dhe pakicë.',
  alternates: { canonical: 'https://prohygiene.shop/shop' },
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const filters = parseShopListParams(sp)
  const supabase = await createClient()

  const [categoriesRes, productsResult] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    fetchShopProductsPage(supabase, { ...filters, page: 1 }, SHOP_PAGE_SIZE),
  ])

  return (
    <Suspense fallback={<div className="section container-custom">Loading...</div>}>
      <ShopClient
        categories={(categoriesRes.data as Category[]) ?? []}
        initialProducts={productsResult.products}
        total={productsResult.total}
        filters={filters}
        pageSize={SHOP_PAGE_SIZE}
      />
    </Suspense>
  )
}
