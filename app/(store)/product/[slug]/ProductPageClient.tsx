'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, ChevronRight, Package, Tag, Users, Star, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore } from '@/store/cart'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { formatPrice, getProductName, getProductDescription, getEffectivePrice, getDiscountPercent, getCategoryName, isLowStock } from '@/lib/utils'
import { QuantitySelector } from '@/components/ui/QuantitySelector'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/store/ProductCard'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductPageClientProps {
  product: Product
  relatedProducts: Product[]
}

export function ProductPageClient({ product, relatedProducts }: ProductPageClientProps) {
  const { lang } = useLanguageStore()
  const { addItem } = useCartStore()
  const tr = t(lang)
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  const name = getProductName(product, lang)
  const description = getProductDescription(product, lang)
  const effectivePrice = getEffectivePrice(product)
  const discountPercent = getDiscountPercent(product)
  const isOnSale = discountPercent !== null
  const isOutOfStock = product.stock === 0
  const lowStock = isLowStock(product)

  const images = [
    product.image_url,
    ...product.gallery_urls,
  ].filter(Boolean) as string[]

  const handleAddToCart = () => {
    if (isOutOfStock) return
    addItem(product, qty)
    toast.success(`${name} — ${tr.common.addedToCart}`)
  }

  const audienceLabel: Record<string, { sq: string; en: string }> = {
    home: { sq: 'Shtëpi', en: 'Home' },
    business: { sq: 'Biznes', en: 'Business' },
    both: { sq: 'Të gjithë', en: 'All' },
  }

  return (
    <div className="animate-fade-in pb-24 sm:pb-0">
      {/* Breadcrumb */}
      <div className="bg-surface-soft border-b border-surface-border">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-xs text-text-muted">
            <Link href="/" className="hover:text-brand-600 transition-colors">{tr.nav.home}</Link>
            <ChevronRight size={12} />
            <Link href="/shop" className="hover:text-brand-600 transition-colors">{tr.nav.shop}</Link>
            {product.category && (
              <>
                <ChevronRight size={12} />
                <Link href={`/shop?category=${product.category.slug}`} className="hover:text-brand-600 transition-colors">
                  {getCategoryName(product.category, lang)}
                </Link>
              </>
            )}
            <ChevronRight size={12} />
            <span className="text-text-primary font-medium line-clamp-1">{name}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-square bg-surface-soft rounded-2xl overflow-hidden border border-surface-border">
              {images[selectedImage] ? (
                <Image
                  src={images[selectedImage]}
                  alt={name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl">🧴</span>
                </div>
              )}
              {isOnSale && (
                <div className="absolute top-4 left-4">
                  <Badge variant="sale">-{discountPercent}%</Badge>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      'relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-200',
                      selectedImage === i
                        ? 'border-brand-500 shadow-brand-sm'
                        : 'border-surface-border hover:border-brand-200'
                    )}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {/* Category */}
            {product.category && (
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="text-sm font-semibold text-brand-500 hover:text-brand-700 uppercase tracking-wider mb-3 block"
              >
                {getCategoryName(product.category, lang)}
              </Link>
            )}

            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-4 text-pretty">
              {name}
            </h1>

            {/* Stock status */}
            <div className="flex items-center gap-2 mb-4">
              {isOutOfStock ? (
                <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
                  <AlertCircle size={16} />
                  {tr.product.outOfStock}
                </div>
              ) : lowStock ? (
                <div className="flex items-center gap-1.5 text-amber-600 text-sm font-medium">
                  <Clock size={16} />
                  {tr.product.lowStock} ({product.stock} {tr.product.pieces})
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                  <CheckCircle size={16} />
                  {tr.product.inStock}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-black text-text-primary">
                {formatPrice(effectivePrice)}
              </span>
              {isOnSale && (
                <div className="flex flex-col">
                  <span className="text-lg text-text-muted line-through font-medium">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs text-red-600 font-semibold">
                    {lang === 'sq' ? 'Kurseni' : 'Save'} {formatPrice(product.price - effectivePrice)}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-text-muted mb-6">
              {tr.product.priceIncludesVat} ({product.vat_rate}%)
            </p>

            {/* Description */}
            <p className="text-text-secondary leading-relaxed mb-6">
              {description || (lang === 'sq'
                ? 'Ky produkt është i ri në gamën tonë! Për çdo detaj rreth përdorimit, përbërësve apo përfitimeve të tij, na kontaktoni direkt në telefon. Jemi këtu për t\'ju ndihmuar të bëni zgjedhjen e duhur.'
                : 'This product is new to our range! For details about its use, ingredients or benefits, please contact us directly by phone. We\'re here to help you make the right choice.'
              )}
            </p>

            {/* Quantity + Add to cart — hidden on mobile (sticky bar handles it) */}
            {!isOutOfStock && (
              <div className="hidden sm:flex items-center gap-4 mb-6">
                <div>
                  <label className="label text-xs">{tr.product.quantity}</label>
                  <QuantitySelector value={qty} min={1} max={product.stock} onChange={setQty} size="lg" />
                </div>
                <button onClick={handleAddToCart} className="btn-primary py-3.5 px-8 text-base flex-1 sm:flex-none">
                  <ShoppingCart size={20} />
                  {tr.product.addToCart}
                </button>
              </div>
            )}

            {isOutOfStock && (
              <button disabled className="btn-secondary py-3.5 px-8 text-base w-full opacity-60 cursor-not-allowed mb-6 hidden sm:flex">
                {tr.product.outOfStock}
              </button>
            )}

            {/* Specs */}
            <div className="bg-surface-soft rounded-2xl border border-surface-border p-5 space-y-3">
              {[
                { icon: Package, label: tr.product.sku, value: product.sku },
                { icon: Tag, label: tr.product.unit, value: product.unit },
                {
                  icon: Users,
                  label: tr.product.audience,
                  value: audienceLabel[product.audience_type]?.[lang] ?? product.audience_type
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-surface-border flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-text-muted" />
                  </div>
                  <span className="text-sm text-text-muted w-24">{label}:</span>
                  <span className="text-sm font-semibold text-text-primary">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MOBILE STICKY ADD-TO-CART BAR ── */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-surface-border px-4 py-3 flex items-center gap-3 shadow-elevated">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-xl border border-surface-border flex items-center justify-center text-text-secondary hover:border-brand-400 transition-colors font-bold text-lg"
            >−</button>
            <span className="w-7 text-center font-bold text-text-primary">{qty}</span>
            <button
              onClick={() => setQty(q => Math.min(product.stock, q + 1))}
              disabled={isOutOfStock}
              className="w-9 h-9 rounded-xl border border-surface-border flex items-center justify-center text-text-secondary hover:border-brand-400 transition-colors font-bold text-lg disabled:opacity-30"
            >+</button>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all',
              isOutOfStock
                ? 'bg-surface-muted text-text-muted cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-700 text-white active:scale-95'
            )}
          >
            <ShoppingCart size={17} />
            {isOutOfStock ? tr.product.outOfStock : tr.product.addToCart}
          </button>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-extrabold text-text-primary mb-6">
              {tr.product.relatedProducts}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
