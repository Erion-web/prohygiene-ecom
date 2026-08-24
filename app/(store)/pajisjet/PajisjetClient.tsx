'use client'

import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { ProductCard } from '@/components/store/ProductCard'
import type { Product } from '@/types'

interface PajisjetClientProps {
  products: Product[]
}

export function PajisjetClient({ products }: PajisjetClientProps) {
  const { lang } = useLanguageStore()
  const tr = t(lang)

  return (
    <div className="animate-fade-in pb-24 sm:pb-0">
      <section className="bg-surface-soft border-b border-surface-border py-12 md:py-16">
        <div className="container-custom text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full mb-4">
            {tr.lease.badge}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4">
            {tr.lease.pageTitle}
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            {tr.lease.pageSubtitle}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-custom">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-text-muted text-lg">{tr.lease.noDevices}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
