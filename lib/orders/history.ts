import type { SupabaseClient } from '@supabase/supabase-js'
import { statusLabel } from '@/lib/utils'

export type OrderChange = { field: string; from: string; to: string }

export const ORDER_FIELD_LABELS: Record<string, string> = {
  customer_name: 'Emri',
  customer_email: 'Email',
  customer_phone: 'Telefoni',
  customer_type: 'Tipi',
  business_name: 'Biznesi',
  fiscal_number: 'Nr. fiskal',
  city: 'Qyteti',
  address: 'Adresa',
  notes: 'Shënime',
  payment_method: 'Metoda e pagesës',
  payment_status: 'Statusi i pagesës',
  status: 'Statusi i porosisë',
  shipping_cost: 'Transporti',
  total: 'Totali',
}

function show(field: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (field === 'payment_status' || field === 'status') return statusLabel(String(v), 'sq')
  if (field === 'payment_method') return v === 'card' ? 'Kartë' : 'Kesh'
  if (field === 'customer_type') return v === 'business' ? 'Biznes' : 'Individual'
  return String(v)
}

/** Fields whose value actually differs between before and after. */
export function diffOrder(before: Record<string, unknown>, after: Record<string, unknown>): OrderChange[] {
  const changes: OrderChange[] = []
  for (const field of Object.keys(after)) {
    const a = before[field] ?? ''
    const b = after[field] ?? ''
    if (String(a) === String(b)) continue
    changes.push({
      field: ORDER_FIELD_LABELS[field] ?? field,
      from: show(field, before[field]),
      to: show(field, after[field]),
    })
  }
  return changes
}

/** Works with a browser client (RLS: admin insert) or a service client. Never throws. */
export async function logOrderHistory(
  supabase: SupabaseClient,
  entry: { orderId: string; actorId?: string | null; actorLabel: string; summary: string; changes?: OrderChange[] },
): Promise<void> {
  try {
    const { error } = await supabase.from('order_history').insert({
      order_id: entry.orderId,
      actor_id: entry.actorId ?? null,
      actor_label: entry.actorLabel,
      summary: entry.summary,
      changes: entry.changes ?? [],
    })
    if (error) console.error('[order history] insert failed', error.message)
  } catch (e) {
    console.error('[order history] insert failed', e)
  }
}

/** Browser-side helper: who is the current admin. */
export async function currentActor(supabase: SupabaseClient): Promise<{ id: string | null; label: string }> {
  const { data } = await supabase.auth.getUser()
  return { id: data.user?.id ?? null, label: data.user?.email ?? 'Admin' }
}
