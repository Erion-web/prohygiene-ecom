import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, Truck, ShieldCheck, Building2, FileText, Star, Tag, Home, ChefHat } from 'lucide-react'
import { ProductCard } from '@/components/store/ProductCard'
import { CategorySidebarNav } from '@/components/store/CategorySidebarNav'
import { HeroCarousel } from '@/components/store/HeroCarousel'
import { BundlesSection } from '@/components/store/BundlesSection'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { getHomeCatalog } from '@/lib/store/catalog'

export const metadata: Metadata = {
  title: 'Detergjente & Produkte Higjiene Online | Dërgim 24h Kosovë',
  description: 'Bli detergjente, kimikate pastrimi, dezinfektues dhe produkte higjiene online. Dërgim 24h në tërë Kosovën. Transport falas mbi €30. Çmime shumice për HORECA dhe biznese. Partner i Shtepiaku.',
  alternates: { canonical: 'https://prohygiene.shop' },
  keywords: [
    'detergjent online Kosovë', 'kimikate pastrimi Kosovë', 'produkte higjiene online',
    'dezinfektues Kosovë', 'detergjent me shumice', 'furnizim HORECA Kosovë',
    'shtepiaku detergjente', 'letra higjienike', 'pastrim profesional Kosovë',
  ],
}

const lang = 'sq' as const

async function getHomeData() {
  try {
    return await getHomeCatalog()
  } catch {
    const { mockCategories, mockFeaturedProducts, mockBestSellers } = await import('@/lib/data/mock')
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

  const localBusinessLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'ProHygiene',
    url: 'https://prohygiene.shop',
    telephone: '+38346108040',
    email: 'info@prohygiene.shop',
    address: { '@type': 'PostalAddress', streetAddress: 'Rruga Rexhep Krasniqi', addressLocality: 'Prishtinë', addressCountry: 'XK' },
    priceRange: '€€',
    openingHours: 'Mo-Fr 08:00-17:00',
    sameAs: ['https://shtepiaku.com'],
    description: 'Detergjente, kimikate pastrimi dhe produkte higjiene — dërgim 24h në tërë Kosovën.',
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'A bëni dërgim në tërë Kosovën?',
        acceptedAnswer: { '@type': 'Answer', text: 'Po, bëjmë dërgim në tërë Kosovën brenda 24-48 orëve. Dërgimi është falas për porosi mbi €30.' },
      },
      {
        '@type': 'Question',
        name: 'A keni çmime shumice për biznese dhe HORECA?',
        acceptedAnswer: { '@type': 'Answer', text: 'Po. Ofrojmë çmime speciale shumice për hotele, restorante, kafene dhe biznese. Na kontaktoni në 046 10 80 40 për ofertë personale.' },
      },
      {
        '@type': 'Question',
        name: 'Si mund të porosis detergjente online?',
        acceptedAnswer: { '@type': 'Answer', text: 'Shfleto dyqanin në prohygiene.shop, shto produktet në shportë dhe porosit online. Paguaj me kartë ose kesh kur arrin produkti.' },
      },
      {
        '@type': 'Question',
        name: 'Cilat janë metodat e pagesës?',
        acceptedAnswer: { '@type': 'Answer', text: 'Pranojmë pagesë me kartë (Visa/Mastercard) dhe kesh pas dorëzimit (cash on delivery).' },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    <div className="animate-fade-in">
      {/* ── TRUST BAR ── */}
      <div className="bg-brand-600 text-white">
        <div className="container-custom py-2.5">
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-1.5">
            {trustItems.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-1.5 flex-shrink-0">
                <Icon size={13} className="text-brand-200 flex-shrink-0" />
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
              <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface-muted" />}>
                <CategorySidebarNav categories={categories} lang={lang} />
              </Suspense>

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
              <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 animate-pulse aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/7]" />
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
      {featured.length > 0 && (
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2">
                {featured.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </Suspense>
          </div>
        </section>
      )}

      {/* ── BEST SELLERS ── */}
      {bestSellers.length > 0 && (
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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {bestSellers.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BUNDLES ── */}
      <BundlesSection />

      {/* ── BUSINESS CTA BANNER ── */}
      <section className="section bg-surface-soft">
        <div className="container-custom">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b3346] via-[#175269] to-[#0e95bd] p-6 sm:p-8 md:p-12">
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
    </>
  )
}
