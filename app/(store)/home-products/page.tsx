import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/store/ProductCard'
import { CategoryCard } from '@/components/store/CategoryCard'
import Link from 'next/link'
import { Home, ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Produktet Shtëpiake | ProHygiene' }

export default async function HomeProductsPage() {
  const supabase = await createClient()

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .eq('listing_type', 'sale')
      .in('audience_type', ['home', 'both'])
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .in('audience_type', ['home', 'both'])
      .order('sort_order'),
  ])

  const products = productsRes.data ?? []
  const categories = categoriesRes.data ?? []

  return (
    <div className="animate-fade-in">
      {/* Hero */}
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
        {/* Categories */}
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

        {/* Products */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">
              Të Gjitha Produktet ({products.length})
            </h2>
            <Link href="/shop?audience_type=home" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              {`Shiko në dyqan`} <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
