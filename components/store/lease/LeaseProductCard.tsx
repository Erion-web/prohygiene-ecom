'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatPrice, getProductName, getEffectivePrice, getCategoryName } from '@/lib/utils'
import type { Product } from '@/types'
import type { Lang } from '@/types'

interface LeaseProductCardProps {
  product: Product
  lang: Lang
  leaseBadge: string
}

export function LeaseProductCard({ product, lang, leaseBadge }: LeaseProductCardProps) {
  const name = getProductName(product, lang)
  const price = getEffectivePrice(product)
  const categoryName = product.category ? getCategoryName(product.category, lang) : null

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-surface-border bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-elevated">
        <div className="relative aspect-[5/4] bg-gradient-to-b from-brand-50/80 to-surface-soft overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={name}
              fill
              className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-16 rounded-2xl bg-brand-100/60 border border-brand-200/50" />
            </div>
          )}
          <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-brand-950/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {leaseBadge}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {categoryName && (
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-600 mb-2">
              {categoryName}
            </p>
          )}
          <h3 className="text-[15px] sm:text-base font-semibold text-text-primary leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors flex-1">
            {name}
          </h3>
          <div className="mt-4 pt-4 border-t border-surface-border flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted mb-0.5">
                {lang === 'sq' ? 'Nga' : 'From'}
              </p>
              <p className="text-lg font-extrabold text-text-primary tracking-tight">
                {formatPrice(price)}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:gap-2 transition-all">
              {lang === 'sq' ? 'Rezervo' : 'Reserve'}
              <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
