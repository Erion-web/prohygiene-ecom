import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ShopClient } from './ShopClient'
import {
  mapStoreSearchRowToProduct,
  sanitizeStoreSearch,
  searchStoreProducts,
} from '@/lib/search/store-products'
import type { Category, Product } from '@/types'

export const metadata: Metadata = {
  title: 'Detergjente & Produkte Higjiene Online — Dyqani',
  description: 'Shfleto mbi 200 detergjente, kimikate pastrimi, dezinfektues dhe produkte higjiene. Dërgim 24h në tërë Kosovën. Çmime nga €1.50 — shumicë dhe pakicë.',
  alternates: { canonical: 'https://prohygiene.shop/shop' },
}

async function getShopData(search?: string) {
  const supabase = await createClient()
  const sanitized = search ? sanitizeStoreSearch(search) : ''

  const categoriesRes = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  let initialProducts: Product[] = []

  if (sanitized.length >= 2) {
    const { data, error } = await searchStoreProducts(supabase, sanitized, 100)
    if (!error) {
      initialProducts = data.map(mapStoreSearchRowToProduct)
    }
  } else {
    const productsRes = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_active', true)
      .eq('listing_type', 'sale')
      .order('created_at', { ascending: false })

    initialProducts = (productsRes.data ?? []) as Product[]
  }

  return {
    categories: (categoriesRes.data as Category[]) ?? [],
    initialProducts,
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const { categories, initialProducts } = await getShopData(search)

  return (
    <Suspense fallback={<div className="section container-custom">Loading...</div>}>
      <ShopClient
        categories={categories}
        initialProducts={initialProducts}
      />
    </Suspense>
  )
}
