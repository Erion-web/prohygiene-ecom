import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/store/ProductCard'
import { CategoryCard } from '@/components/store/CategoryCard'
import { Building2, ArrowRight, Phone, CheckCircle } from 'lucide-react'
import { HotelIcon, RestaurantIcon, ClinicIcon, OfficeIcon } from '@/components/store/HorecaSegmentIcons'

export const metadata: Metadata = {
  title: 'Furnizim HORECA & Biznes — Kimikate Profesionale Kosovë',
  description: 'Furnizim profesional për hotele, restorante, kafene dhe biznese në Kosovë. Kimikate pastrimi, detergjente industriale dhe produkte sanitare me çmime shumice. Ofertë personale pa pagesë.',
  alternates: { canonical: 'https://prohygiene.shop/business' },
  keywords: ['HORECA Kosovë', 'furnizim hotel Kosovë', 'kimikate industriale', 'detergjent shumice', 'furnizim restorant Kosovë', 'pastrim profesional'],
}

export default async function BusinessPage() {
  const supabase = await createClient()

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .eq('listing_type', 'sale')
      .in('audience_type', ['business', 'both'])
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .in('audience_type', ['business', 'both'])
      .order('sort_order'),
  ])

  const products = productsRes.data ?? []
  const categories = categoriesRes.data ?? []

  const benefits = [
    'Çmime preferenciale për sasi të mëdha',
    'Furnizim i rregullt dhe i garantuar',
    'Menaxher personal i llogarisë',
    'Fatura fiskale dhe dokumentacion i plotë',
    'Dërgim prioritar',
    'Produkte ekskluzive HORECA',
  ]

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 py-16">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Building2 size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-white">HORECA & Biznese</h1>
                  <p className="text-brand-200 text-sm">Business Solutions</p>
                </div>
              </div>
              <p className="text-brand-100 text-lg leading-relaxed mb-8">
                Partneri juaj profesional për furnizim me produkte higjiene dhe pastrimi. Çmime ekskluzive, dërgim i garantuar, mbështetje dedikuar.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/contact" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 py-3 px-6">
                  <Phone size={16} />
                  Kontaktoni tani
                </Link>
                <Link href="/shop?audience_type=business" className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 py-3 px-6">
                  Shiko katalogun <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
              <h3 className="text-white font-bold mb-4">Përfitimet e Klientëve Biznes</h3>
              <div className="space-y-3">
                {benefits.map(b => (
                  <div key={b} className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-brand-300 flex-shrink-0 mt-0.5" />
                    <span className="text-brand-100 text-sm">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-custom py-10">
        {/* HORECA segments */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-text-primary mb-5">Segmentet HORECA</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: HotelIcon, label: 'Hotele', href: '/shop?audience_type=business&search=hotel' },
              { icon: RestaurantIcon, label: 'Restorante', href: '/shop?audience_type=business&search=restorant' },
              { icon: ClinicIcon, label: 'Spitale & Klinika', href: '/shop?audience_type=business&search=spital' },
              { icon: OfficeIcon, label: 'Zyra & Biznese', href: '/shop?audience_type=business' },
            ].map(seg => (
              <Link key={seg.label} href={seg.href} className="card p-5 text-center hover:border-brand-200 hover:shadow-soft transition-all duration-200 group">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                  <seg.icon className="w-7 h-7" />
                </div>
                <p className="font-semibold text-text-primary text-sm group-hover:text-brand-600 transition-colors">{seg.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-text-primary mb-5">Kategoritë Biznes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {categories.map(cat => (
                <CategoryCard key={cat.id} category={cat} lang="sq" />
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">Produktet Biznes ({products.length})</h2>
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
