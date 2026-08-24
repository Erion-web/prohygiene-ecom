'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, ChevronRight, Package, Tag, Users, Star, CheckCircle, AlertCircle, Clock, Handshake } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore } from '@/store/cart'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { formatPrice, getProductName, getProductDescription, getEffectivePrice, getDiscountPercent, getCategoryName, isLowStock } from '@/lib/utils'
import { QuantitySelector } from '@/components/ui/QuantitySelector'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/store/ProductCard'
import { LeaseInquiryModal } from '@/components/store/LeaseInquiryModal'
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
  const [inquiryOpen, setInquiryOpen] = useState(false)

  const isLease = (product.listing_type ?? 'sale') === 'lease'
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
    if (isOutOfStock || isLease) return
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
      <LeaseInquiryModal product={product} isOpen={inquiryOpen} onClose={() => setInquiryOpen(false)} />

      <div className="bg-surface-soft border-b border-surface-border">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-xs text-text-muted">
            <Link href="/" className="hover:text-brand-600 transition-colors">{tr.nav.home}</Link>
            <ChevronRight size={12} />
            {isLease ? (
              <>
                <Link href="/pajisjet" className="hover:text-brand-600 transition-colors">{tr.nav.leaseDevices}</Link>
              </>
            ) : (
              <>
                <Link href="/shop" className="hover:text-brand-600 transition-colors">{tr.nav.shop}</Link>
                {product.category && (
                  <>
                    <ChevronRight size={12} />
                    <Link href={`/shop?category=${product.category.slug}`} className="hover:text-brand-600 transition-colors">
                      {getCategoryName(product.category, lang)}
                    </Link>
                  </>
                )}
              </>
            )}
            <ChevronRight size={12} />
            <span className="text-text-primary font-medium line-clamp-1">{name}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-5 sm:py-8 md:py-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          <div className="space-y-4">
            <div className="relative aspect-square bg-surface-soft rounded-3xl border border-surface-border overflow-hidden">
              {images.length > 0 ? (
                <Image
                  src={images[selectedImage]}
                  alt={name}
                  fill
                  className="object-contain p-6"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package size={64} className="text-text-muted opacity-20" />
                </div>
              )}
              {isLease && (
                <div className="absolute top-4 left-4">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-brand-600 text-white shadow-sm">
                    {tr.lease.badge}
                  </span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      'relative w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all',
                      selectedImage === i ? 'border-brand-500 shadow-brand-sm' : 'border-surface-border hover:border-brand-200'
                    )}
                  >
                    <Image src={img} alt="" fill className="object-contain p-1" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {product.is_best_seller && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Star size={12} fill="currentColor" />
                  {tr.common.bestSeller}
                </Badge>
              )}
              {isOnSale && !isLease && (
                <Badge variant="danger">-{discountPercent}%</Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text-primary mb-2 leading-tight">
              {name}
            </h1>

            <p className="text-sm text-text-muted mb-4 font-mono">SKU: {product.sku}</p>

            {!isLease && (
              <div className="mb-6">
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
            )}

            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-black text-text-primary">
                {formatPrice(effectivePrice)}
              </span>
              {isOnSale && !isLease && (
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
              {isLease ? tr.lease.priceInfo : `${tr.product.priceIncludesVat} (${product.vat_rate}%)`}
            </p>

            <p className="text-text-secondary leading-relaxed mb-6">
              {description || (lang === 'sq'
                ? 'Ky produkt është i ri në gamën tonë! Për çdo detaj rreth përdorimit, përbërësve apo përfitimeve të tij, na kontaktoni direkt në telefon. Jemi këtu për t\'ju ndihmuar të bëni zgjedhjen e duhur.'
                : 'This product is new to our range! For details about its use, ingredients or benefits, please contact us directly by phone. We\'re here to help you make the right choice.'
              )}
            </p>

            {isLease ? (
              <div className="hidden sm:block mb-6">
                <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6">
                  <h3 className="font-extrabold text-text-primary text-lg mb-2">{tr.lease.ctaTitle}</h3>
                  <p className="text-sm text-text-secondary mb-4">{tr.lease.ctaDesc}</p>
                  <button
                    type="button"
                    onClick={() => setInquiryOpen(true)}
                    className="btn-primary py-3.5 px-8 text-base w-full sm:w-auto"
                  >
                    <Handshake size={20} />
                    {tr.lease.reserveDevice}
                  </button>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}

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

        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-surface-border px-4 pt-3 safe-bottom flex items-center gap-3 shadow-elevated">
          {isLease ? (
            <button
              type="button"
              onClick={() => setInquiryOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white active:scale-95 transition-all"
            >
              <Handshake size={17} />
              {tr.lease.reserveDevice}
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-extrabold text-text-primary mb-6">
              {tr.product.relatedProducts}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
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
