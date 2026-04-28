import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, Truck, ShieldCheck, Building2, FileText, Star, Tag, Home, ChefHat } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/store/ProductCard'
import { CategorySidebarNav } from '@/components/store/CategorySidebarNav'
import { HeroCarousel } from '@/components/store/HeroCarousel'
import { BundlesSection } from '@/components/store/BundlesSection'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { mockCategories, mockFeaturedProducts, mockBestSellers } from '@/lib/data/mock'
import type { Product, Category } from '@/types'

const lang = 'sq' as const

async function getHomeData() {
  try {
    const supabase = await createClient()
    const [productsRes, categoriesRes, bannersRes] = await Promise.all([
      supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(24),
      supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('banners')
        .select('id, image_url')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ])
    const products: Product[] = productsRes.data ?? []
    const categories: Category[] = categoriesRes.data ?? []

    return {
      featured: products.filter(p => p.is_featured).slice(0, 8).length > 0
        ? products.filter(p => p.is_featured).slice(0, 8)
        : mockFeaturedProducts,
      bestSellers: products.filter(p => p.is_best_seller).slice(0, 8).length > 0
        ? products.filter(p => p.is_best_seller).slice(0, 8)
        : mockBestSellers,
      categories: categories.length > 0 ? categories : mockCategories,
      banners: bannersRes.data ?? [],
    }
  } catch {
    return {
      featured: mockFeaturedProducts,
      bestSellers: mockBestSellers,
      categories: mockCategories,
      banners: [],
    }
  }
}

const trustItems = [
  { icon: Truck,       label: 'Dërgim 24-48 orë',     sub: 'Tërë Kosova' },
  { icon: ShieldCheck, label: 'Pagesa e Sigurt',        sub: 'SSL Enkriptuar' },
  { icon: Building2,   label: 'Çmime Biznesi',          sub: 'HORECA & Shumicë' },
  { icon: FileText,    label: 'Faturë Fiskale',         sub: 'Çdo Blerje' },
]

export default async function HomePage() {
  const { featured, bestSellers, categories, banners } = await getHomeData()

  return (
    <div className="animate-fade-in">
      {/* ── TRUST BAR ── */}
      <div className="bg-brand-600 text-white">
        <div className="container-custom">
          <div className="flex items-center justify-center gap-6 md:gap-12 py-2.5 overflow-x-auto no-scrollbar">
            {trustItems.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-2 flex-shrink-0">
                <Icon size={15} className="text-brand-200 flex-shrink-0" />
                <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
                <span className="hidden sm:inline text-brand-200 text-xs">— {sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT: SIDEBAR + HERO ── */}
      <section className="container-custom py-4 md:py-6">
        <div className="flex gap-5">
          {/* LEFT SIDEBAR — hidden on mobile, visible lg+ */}
          <aside className="hidden lg:block w-56 xl:w-64 flex-shrink-0">
            <div className="sticky top-20 bg-white border border-surface-border rounded-2xl p-3 shadow-soft">
              <CategorySidebarNav categories={categories} lang={lang} />

              {/* Business promo in sidebar */}
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white">
                <Building2 size={18} className="text-brand-200 mb-2" />
                <p className="text-xs font-bold mb-1">Jeni Biznes?</p>
                <p className="text-[11px] text-brand-100 leading-snug mb-2.5">Çmime ekskluzive për HORECA & shumicë</p>
                <Link
                  href="/contact"
                  className="flex items-center gap-1 text-[11px] font-bold text-white hover:text-brand-100 transition-colors"
                >
                  Kontaktoni <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN */}
          <div className="flex-1 min-w-0">
            {/* Hero Carousel */}
            <Suspense fallback={
              <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 animate-pulse" style={{ aspectRatio: '16/7', minHeight: 240 }} />
            }>
              <HeroCarousel banners={banners} />
            </Suspense>

            {/* Mini promo banners */}
            <div className="flex sm:grid sm:grid-cols-3 gap-3 mt-4 overflow-x-auto no-scrollbar">
              <Link href="/home-products" className="group flex items-center gap-3 p-4 rounded-xl bg-white border border-surface-border hover:border-brand-300 hover:shadow-soft transition-all duration-200 flex-shrink-0 min-w-[220px] sm:min-w-0">
                <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                  <Home size={18} className="text-sky-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate group-hover:text-brand-600 transition-colors">Për Shtëpi</p>
                  <p className="text-[11px] text-text-muted truncate">Pastrim & higjienë personale</p>
                </div>
                <ArrowRight size={14} className="text-brand-400 ml-auto flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link href="/business" className="group flex items-center gap-3 p-4 rounded-xl bg-white border border-surface-border hover:border-brand-300 hover:shadow-soft transition-all duration-200 flex-shrink-0 min-w-[220px] sm:min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <ChefHat size={18} className="text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate group-hover:text-brand-600 transition-colors">HORECA</p>
                  <p className="text-[11px] text-text-muted truncate">Furnizim profesional</p>
                </div>
                <ArrowRight size={14} className="text-brand-400 ml-auto flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link href="/campaigns" className="group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-brand-50 to-white border border-brand-100 hover:border-brand-300 hover:shadow-soft transition-all duration-200 flex-shrink-0 min-w-[220px] sm:min-w-0">
                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Tag size={18} className="text-brand-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-700 truncate">Ofertat e Javës</p>
                  <p className="text-[11px] text-brand-500 truncate">Zbritje të veçanta</p>
                </div>
                <ArrowRight size={14} className="text-brand-400 ml-auto flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── MOBILE CATEGORIES ── */}
      <section className="lg:hidden container-custom pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <Link href="/shop" className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white text-xs font-semibold rounded-full">
            🛒 Të Gjitha
          </Link>
          {categories.slice(0, 7).map(cat => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white border border-surface-border text-text-secondary text-xs font-medium rounded-full hover:border-brand-300 hover:text-brand-600 transition-colors"
            >
              {lang === 'sq' ? cat.name_sq : cat.name_en}
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="section bg-surface-soft">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-brand-400 rounded-full" />
              <div>
                <h2 className="text-xl font-extrabold text-text-primary">Produktet e Zgjedhura</h2>
                <p className="text-text-muted text-xs mt-0.5">Të selektuara me kujdes për ju</p>
              </div>
            </div>
            <Link href="/shop?featured=true" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Shiko të gjitha <ArrowRight size={15} />
            </Link>
          </div>

          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Suspense>
        </div>
      </section>

      {/* ── BEST SELLERS ── */}
      <section className="section">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-amber-400 rounded-full" />
              <div className="flex items-center gap-2">
                <Star size={18} className="text-amber-500" fill="currentColor" />
                <div>
                  <h2 className="text-xl font-extrabold text-text-primary">Më të Shitur</h2>
                  <p className="text-text-muted text-xs mt-0.5">Zgjedhjet e klientëve tanë</p>
                </div>
              </div>
            </div>
            <Link href="/shop?sort=best_sellers" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Shiko të gjitha <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {bestSellers.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BUNDLES ── */}
      <BundlesSection />

      {/* ── BUSINESS CTA BANNER ── */}
      <section className="section bg-surface-soft">
        <div className="container-custom">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b3346] via-[#175269] to-[#0e95bd] p-8 md:p-12">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-brand-400/10 blur-2xl" />

            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-brand-400/20 text-brand-300 text-xs font-bold px-3 py-1 rounded-full border border-brand-400/30 mb-4">
                  <Tag size={11} />
                  Çmime Speciale Biznesi
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                  Jeni Biznes apo HORECA?
                </h2>
                <p className="text-white/70 leading-relaxed text-sm md:text-base">
                  Porositni me sasi të mëdha dhe merrni çmime ekskluzive. Mbështetje dedikuar për hotele, restorante dhe biznese.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-3 md:items-end">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-brand-400 hover:bg-brand-300 text-[#0b3346] font-bold px-6 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-sm"
                >
                  Kontaktoni për Çmime
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/business"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 text-sm"
                >
                  Shiko Produktet Biznesi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
