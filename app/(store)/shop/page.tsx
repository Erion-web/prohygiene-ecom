import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ShopClient } from './ShopClient'
import type { Category } from '@/types'

export const metadata: Metadata = {
  title: 'Dyqani — ProHygiene',
  description: 'Shfletoni gamën tonë të plotë të produkteve të higjienës dhe pastrimit',
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
