import type { SupabaseClient } from '@supabase/supabase-js'
import type { OrderItemInput } from '@/lib/validation/schemas'

export const SHIPPING_FREE_THRESHOLD = 30
export const SHIPPING_COST = 3
export const COUPON_THRESHOLD = 50
export const COUPON_DISCOUNT = 5
export const VAT_RATE = 0.18

type ProductRow = {
  id: string
  sku: string
  name_sq: string
  name_en: string
  price: number
  sale_price: number | null
  stock: number
  image_url: string | null
  listing_type: string | null
  is_active: boolean
}

export type ComputedOrderLine = {
  product_id: string
  product_name_sq: string
  product_name_en: string
  product_sku: string
  product_image_url: string | null
  unit_price: number
  sale_price: number | null
  quantity: number
  subtotal: number
  effective_price: number
}

export type ComputedOrderTotals = {
  lines: ComputedOrderLine[]
  subtotal: number
  product_discount: number
  coupon_discount: number
  shipping_cost: number
  discount_amount: number
  vat_amount: number
  total: number
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function effectivePrice(product: Pick<ProductRow, 'price' | 'sale_price'>): number {
  if (product.sale_price != null && product.sale_price < product.price) return product.sale_price
  return product.price
}

export function computeShipping(subtotalAfterDiscounts: number): number {
  return subtotalAfterDiscounts >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_COST
}

export function computeCouponDiscount(subtotalAfterDiscounts: number): number {
  return subtotalAfterDiscounts >= COUPON_THRESHOLD ? COUPON_DISCOUNT : 0
}

export async function buildOrderFromItems(
  supabase: SupabaseClient,
  items: OrderItemInput[],
): Promise<{ totals: ComputedOrderTotals | null; error: string | null }> {
  const grouped = new Map<string, number>()
  for (const item of items) {
    grouped.set(item.product_id, (grouped.get(item.product_id) ?? 0) + item.quantity)
  }

  const productIds = [...grouped.keys()]
  const { data: products, error } = await supabase
    .from('products')
    .select('id, sku, name_sq, name_en, price, sale_price, stock, image_url, listing_type, is_active')
    .in('id', productIds)

  if (error) return { totals: null, error: 'Failed to load products' }

  const byId = new Map((products ?? []).map(p => [p.id, p as ProductRow]))
  const lines: ComputedOrderLine[] = []

  for (const [productId, quantity] of grouped) {
    const product = byId.get(productId)
    if (!product) return { totals: null, error: 'Product not found' }
    if (!product.is_active) return { totals: null, error: `Product unavailable: ${product.name_sq}` }
    if ((product.listing_type ?? 'sale') !== 'sale') {
      return { totals: null, error: `Product not for sale: ${product.name_sq}` }
    }
    if (product.stock < quantity) {
      return { totals: null, error: `Insufficient stock for ${product.name_sq}` }
    }

    const unit = product.price
    const effective = effectivePrice(product)
    const lineSubtotal = roundMoney(effective * quantity)

    lines.push({
      product_id: product.id,
      product_name_sq: product.name_sq,
      product_name_en: product.name_en,
      product_sku: product.sku,
      product_image_url: product.image_url,
      unit_price: unit,
      sale_price: effective < unit ? effective : null,
      quantity,
      subtotal: lineSubtotal,
      effective_price: effective,
    })
  }

  const merchandiseSubtotal = roundMoney(lines.reduce((sum, line) => sum + line.unit_price * line.quantity, 0))
  const merchandiseTotal = roundMoney(lines.reduce((sum, line) => sum + line.subtotal, 0))
  const productDiscount = roundMoney(merchandiseSubtotal - merchandiseTotal)
  const couponDiscount = computeCouponDiscount(merchandiseTotal)
  const shippingCost = computeShipping(merchandiseTotal)
  const discountAmount = roundMoney(productDiscount + couponDiscount)
  const preVatTotal = roundMoney(merchandiseTotal + shippingCost - couponDiscount)
  const vatAmount = roundMoney(preVatTotal * VAT_RATE)
  const total = roundMoney(preVatTotal)

  return {
    totals: {
      lines,
      subtotal: merchandiseSubtotal,
      product_discount: productDiscount,
      coupon_discount: couponDiscount,
      shipping_cost: shippingCost,
      discount_amount: discountAmount,
      vat_amount: vatAmount,
      total,
    },
    error: null,
  }
}
