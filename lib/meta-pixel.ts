import type { Product } from '@/types'
import { getEffectivePrice } from '@/lib/utils'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

// Must match the `id` column of the Meta catalog feed (app/api/feeds/meta).
const contentId = (p: Pick<Product, 'sku' | 'id'>) => p.sku || p.id

function track(event: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('track', event, params)
}

export function trackViewContent(product: Product) {
  track('ViewContent', {
    content_type: 'product',
    content_ids: [contentId(product)],
    content_name: product.name_sq,
    value: getEffectivePrice(product),
    currency: 'EUR',
  })
}

export function trackAddToCart(product: Product, quantity: number) {
  track('AddToCart', {
    content_type: 'product',
    content_ids: [contentId(product)],
    contents: [{ id: contentId(product), quantity }],
    value: getEffectivePrice(product) * quantity,
    currency: 'EUR',
  })
}

export function trackPurchase(
  items: { product: Product; quantity: number; effectivePrice: number }[],
  value: number,
) {
  track('Purchase', {
    content_type: 'product',
    content_ids: items.map(i => contentId(i.product)),
    contents: items.map(i => ({ id: contentId(i.product), quantity: i.quantity })),
    value,
    currency: 'EUR',
  })
}
