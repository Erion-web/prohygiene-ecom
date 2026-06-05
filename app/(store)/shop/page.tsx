import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ShopClient } from './ShopClient'
import type { Category } from '@/types'

export const metadata: Metadata = {
  title: 'Detergjente & Produkte Higjiene Online — Dyqani',
  description: 'Shfleto mbi 200 detergjente, kimikate pastrimi, dezinfektues dhe produkte higjiene. Dërgim 24h në tërë Kosovën. Çmime nga €1.50 — shumicë dhe pakicë.',
  alternates: { canonical: 'https://prohygiene.shop/shop' },
}

async function getShopData() {
  const supabase = await createClient()

  const [categoriesRes, productsRes] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  return {
    categories: categoriesRes.data as Category[] ?? [],
    initialProducts: productsRes.data ?? [],
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const { categories, initialProducts } = await getShopData()

  return (
    <Suspense fallback={<div className="section container-custom">Loading...</div>}>
      <ShopClient
        categories={categories}
        initialProducts={initialProducts}
        searchParams={searchParams}
      />
    </Suspense>
  )
}
