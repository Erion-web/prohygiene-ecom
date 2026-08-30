import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeOrderStatus } from './status'

export async function applyOrderStockChange(
  supabase: SupabaseClient,
  orderId: string,
  previousStatus: string,
  nextStatus: string,
): Promise<{ error: string | null }> {
  const fromCompleted = normalizeOrderStatus(previousStatus) === 'completed'
  const toCompleted = normalizeOrderStatus(nextStatus) === 'completed'
  if (fromCompleted === toCompleted) return { error: null }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  if (itemsError) return { error: itemsError.message }

  const delta = toCompleted ? -1 : 1
  const grouped = new Map<string, number>()

  for (const item of items ?? []) {
    if (!item.product_id) continue
    grouped.set(item.product_id, (grouped.get(item.product_id) ?? 0) + (item.quantity ?? 0))
  }

  for (const [productId, quantity] of grouped) {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .maybeSingle()

    if (fetchError) return { error: fetchError.message }
    if (!product) continue

    const nextStock = Math.max(0, (product.stock ?? 0) + quantity * delta)
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: nextStock })
      .eq('id', productId)

    if (updateError) return { error: updateError.message }
  }

  return { error: null }
}
