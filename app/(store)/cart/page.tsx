'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Trash2, ShoppingBag, ArrowRight, Tag, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore } from '@/store/cart'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { formatPrice, getProductName, getEffectivePrice } from '@/lib/utils'
import { QuantitySelector } from '@/components/ui/QuantitySelector'
import { EmptyState } from '@/components/ui/EmptyState'

export default function CartPage() {
  const { lang } = useLanguageStore()
  const tr = t(lang)
  const { items, removeItem, updateQuantity, getSubtotal, getDiscount, getTotal, getItemCount } = useCartStore()

  const subtotal = getSubtotal()
  const discount = getDiscount()
  const total = getTotal()
  const itemCount = getItemCount()
  const freeShippingThreshold = 50
  const shippingCost = total >= freeShippingThreshold ? 0 : 3
  const finalTotal = total + shippingCost

  if (items.length === 0) {
    return (
      <div className="section">
        <div className="container-custom">
          <EmptyState
            icon={ShoppingBag}
            title={tr.cart.empty}
            description={tr.cart.emptyDesc}
            action={
              <Link href="/shop" className="btn-primary">
                {tr.cart.continueShopping}
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in pb-24 lg:pb-0">
      <div className="bg-surface-soft border-b border-surface-border">
        <div className="container-custom py-6">
          <h1 className="text-2xl font-extrabold text-text-primary">
            {tr.cart.title}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {itemCount} {tr.cart.items}
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity, effectivePrice }) => {
              const name = getProductName(product, lang)
              const isOnSale = effectivePrice < product.price

              return (
                <div key={product.id} className="card p-4 flex gap-4 animate-fade-in">
                  {/* Image */}
                  <Link href={`/product/${product.slug}`} className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-surface-soft">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl">🧴</div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {product.category && (
                          <p className="text-[11px] font-semibold text-brand-500 uppercase tracking-wider mb-0.5">
                            {lang === 'sq' ? product.category.name_sq : product.category.name_en}
                          </p>
                        )}
                        <Link href={`/product/${product.slug}`}>
                          <h3 className="font-semibold text-text-primary hover:text-brand-600 transition-colors text-sm leading-snug line-clamp-2">
                            {name}
                          </h3>
                        </Link>
                        <p className="text-xs text-text-muted mt-0.5">SKU: {product.sku}</p>
                      </div>

                      <button
                        onClick={() => {
                          removeItem(product.id)
                          toast.success(tr.common.removedFromCart)
                        }}
                        className="flex-shrink-0 p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-3">
                      <QuantitySelector
                        value={quantity}
                        min={1}
                        max={product.stock}
                        onChange={q => updateQuantity(product.id, q)}
                        size="sm"
                      />

                      <div className="text-right">
                        <p className="font-bold text-text-primary">
                          {formatPrice(effectivePrice * quantity)}
                        </p>
                        {isOnSale && (
                          <p className="text-xs text-text-muted line-through">
                            {formatPrice(product.price * quantity)}
                          </p>
                        )}
                        <p className="text-xs text-text-muted">
                          {formatPrice(effectivePrice)} / {product.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <Link href="/shop" className="btn-ghost gap-2 text-sm">
              ← {tr.cart.continueShopping}
            </Link>
          </div>

          {/* Mobile sticky checkout bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-surface-border px-4 py-3 shadow-elevated">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-text-muted">{tr.cart.total}</p>
                <p className="font-extrabold text-text-primary text-lg">{formatPrice(finalTotal)}</p>
              </div>
              <Link href="/checkout" className="btn-primary py-3 px-6 gap-2 flex-1 justify-center">
                <ShoppingCart size={17} /> {tr.cart.checkout}
              </Link>
            </div>
          </div>

          {/* Summary — desktop only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="card p-6 sticky top-20">
              <h2 className="font-bold text-text-primary mb-5">
                {lang === 'sq' ? 'Përmbledhja' : 'Summary'}
              </h2>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{tr.cart.subtotal}</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600 flex items-center gap-1">
                      <Tag size={13} />
                      {tr.cart.discount}
                    </span>
                    <span className="text-red-600 font-semibold">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{tr.cart.shipping}</span>
                  <span className={shippingCost === 0 ? 'text-emerald-600 font-semibold' : 'font-medium'}>
                    {shippingCost === 0 ? tr.cart.free : formatPrice(shippingCost)}
                  </span>
                </div>

                {total < freeShippingThreshold && (
                  <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 text-xs text-brand-700">
                    {lang === 'sq'
                      ? `Shto edhe ${formatPrice(freeShippingThreshold - total)} për transport falas!`
                      : `Add ${formatPrice(freeShippingThreshold - total)} more for free shipping!`}
                    <div className="mt-2 bg-brand-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-brand-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (total / freeShippingThreshold) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="border-t border-surface-border pt-3 flex justify-between">
                  <span className="font-bold text-text-primary">{tr.cart.total}</span>
                  <span className="font-bold text-xl text-text-primary">{formatPrice(finalTotal)}</span>
                </div>
                <p className="text-xs text-text-muted">{tr.cart.vat}</p>
              </div>

              <Link href="/checkout" className="btn-primary w-full py-3.5 justify-center text-base">
                {tr.cart.checkout}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
