import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { computeAttention, type AttentionOrder } from '@/lib/orders/attention'
import { apiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { supabase, authorized } = await requireAdmin()
  if (!authorized) return apiError('Forbidden', 403)

  const since = new Date(Date.now() - 90 * 86400_000).toISOString()
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, total, created_at, updated_at, status, payment_method, payment_status, falcon_order_id, falcon_status_name')
    .gte('created_at', since)
    .or('status.neq.completed,payment_status.in.(pending,needs_clarification)')
    .order('created_at', { ascending: true })
    .limit(500)

  if (error) return apiError('Failed to load orders', 500)

  const groups = computeAttention((data ?? []) as AttentionOrder[])
  const total = new Set(groups.flatMap(g => g.orders.map(o => o.id))).size
  return NextResponse.json({ groups, total: groups.reduce((s, g) => s + g.count, 0), distinctShown: total })
}
