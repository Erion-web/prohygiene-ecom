import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { getActiveCategories } from '@/lib/store/catalog'
import { ShopClient } from './ShopClient'
import { fetchShopProductsPage } from '@/lib/shop/products'
import { parseShopListParams, SHOP_PAGE_SIZE } from '@/lib/shop/query'

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
  const supabase = createPublicClient()

  const [categories, productsResult] = await Promise.all([
    getActiveCategories(),
    fetchShopProductsPage(supabase, { ...filters, page: 1 }, SHOP_PAGE_SIZE),
  ])

  return (
    <Suspense fallback={<div className="section container-custom">Loading...</div>}>
      <ShopClient
        categories={categories}
        initialProducts={productsResult.products}
        total={productsResult.total}
        filters={filters}
        pageSize={SHOP_PAGE_SIZE}
      />
    </Suspense>
  )
}
