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
    const change = quantity * delta
    const { data: ok, error: rpcError } = await supabase.rpc('adjust_product_stock', {
      p_product_id: productId,
      p_delta: change,
    })

    if (rpcError) return { error: rpcError.message }
    if (!ok) return { error: 'Insufficient stock' }
  }

  return { error: null }
}
