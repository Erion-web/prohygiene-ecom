import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CategoryCard } from '@/components/store/CategoryCard'
import { Home } from 'lucide-react'
import { fetchShopProductsPage } from '@/lib/shop/products'
import { SHOP_PAGE_SIZE, type ShopListFilters } from '@/lib/shop/query'
import { HomeProductsClient } from './HomeProductsClient'

export const metadata: Metadata = { title: 'Produktet Shtëpiake | ProHygiene' }

const HOME_FILTERS: ShopListFilters = {
  audience_type: 'home',
  on_sale: false,
  in_stock: false,
  featured: false,
  sort: 'featured',
  page: 1,
}

export default async function HomeProductsPage() {
  const supabase = await createClient()

  const [productsResult, categoriesRes] = await Promise.all([
    fetchShopProductsPage(supabase, HOME_FILTERS, SHOP_PAGE_SIZE),
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .in('audience_type', ['home', 'both'])
      .order('sort_order'),
  ])

  const categories = categoriesRes.data ?? []

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-br from-sky-50 via-white to-blue-50 border-b border-surface-border py-14">
        <div className="container-custom">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center">
              <Home size={28} className="text-brand-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-text-primary">Produktet Shtëpiake</h1>
              <p className="text-text-secondary">Home Products</p>
            </div>
          </div>
          <p className="text-text-secondary max-w-xl">
            Gjeni çdo gjë që ju nevojitet për pastrim dhe higjienë shtëpiake. Produkte cilësore me çmime të mira, të dërguara drejt tek ju.
          </p>
        </div>
      </section>

      <div className="container-custom py-10">
        {categories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-text-primary mb-5">Kategoritë</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {categories.map(cat => (
                <CategoryCard key={cat.id} category={cat} lang="sq" />
              ))}
            </div>
          </div>
        )}

        <HomeProductsClient
          initialProducts={productsResult.products}
          total={productsResult.total}
          pageSize={SHOP_PAGE_SIZE}
          filters={HOME_FILTERS}
        />
      </div>
    </div>
  )
}
