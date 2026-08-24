'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star, Handshake } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore } from '@/store/cart'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { cn, formatPrice, getProductName, getEffectivePrice, getDiscountPercent } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { lang } = useLanguageStore()
  const { addItem } = useCartStore()
  const tr = t(lang)

  const isLease = (product.listing_type ?? 'sale') === 'lease'
  const name = getProductName(product, lang)
  const effectivePrice = getEffectivePrice(product)
  const discountPercent = getDiscountPercent(product)
  const isOnSale = discountPercent !== null && !isLease
  const isOutOfStock = product.stock === 0 && !isLease

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock || isLease) return
    addItem(product)
    toast.success(tr.common.addedToCart)
  }

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className={cn(
        'bg-white rounded-2xl border border-surface-border overflow-hidden flex flex-col',
        'shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-0.5',
        className
      )}>
        <div className="relative aspect-[4/3] bg-surface-soft overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={name}
              fill
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingCart size={28} className="text-text-muted opacity-20" />
            </div>
          )}

          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {isLease && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-brand-600 text-white shadow-sm">
                {tr.lease.badge}
              </span>
            )}
            {product.is_best_seller && !isLease && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-400 text-white shadow-sm">
                <Star size={9} fill="currentColor" />
                {tr.common.bestSeller}
              </span>
            )}
            {product.is_featured && !product.is_best_seller && !isLease && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-brand-600 text-white shadow-sm">
                {tr.common.featured}
              </span>
            )}
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <span className="text-xs font-semibold text-text-muted bg-white px-3 py-1.5 rounded-full border border-surface-border">
                {tr.product.outOfStock}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 px-3.5 pt-3 pb-3.5 gap-2">
          {product.category && (
            <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider leading-none">
              {lang === 'sq' ? product.category.name_sq : product.category.name_en}
            </p>
          )}

          <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors duration-200 flex-1">
            {name}
          </h3>

          <div className="flex items-center justify-between gap-2 mt-1">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-base text-text-primary">
                  {formatPrice(effectivePrice)}
                </span>
                {isOnSale && discountPercent && (
                  <span className="text-[10px] font-extrabold bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-md">
                    -{discountPercent}%
                  </span>
                )}
              </div>
              {isOnSale && (
                <span className="text-xs text-text-muted line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {isLease ? (
              <span className="p-2 rounded-xl bg-brand-50 text-brand-600 flex-shrink-0">
                <Handshake size={14} />
              </span>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={cn(
                  'p-2 rounded-xl transition-all duration-200 flex-shrink-0',
                  isOutOfStock
                    ? 'bg-surface-muted text-text-muted cursor-not-allowed'
                    : 'bg-brand-600 hover:bg-brand-700 active:scale-95 text-white'
                )}
              >
                <ShoppingCart size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
