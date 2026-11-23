import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeOrderStatus } from '@/lib/orders/status'
import { isFalconSuccess, targetOrderStatus } from '@/lib/orders/falcon-status-map'
import type { PlanItem } from './schemas'
import type { PostaRow } from './compact-posta'

/** Deterministic (no AI) plan from a pasted Falcon list. */
export async function buildPostaPlan(
  supabase: SupabaseClient,
  rows: PostaRow[],
): Promise<{ reply: string; plan: PlanItem[] }> {
  // One status per order; if the courier has several shipments, "Sukses" wins.
  const byOrder = new Map<string, string>()
  for (const r of rows) {
    const prev = byOrder.get(r.order)
    if (!prev || (isFalconSuccess(r.status) && !isFalconSuccess(prev))) byOrder.set(r.order, r.status)
  }

  const { data } = await supabase
    .from('orders')
    .select('order_number, status')
    .in('order_number', [...byOrder.keys()])
  const current = new Map((data ?? []).map(o => [o.order_number as string, normalizeOrderStatus(o.status)]))

  const plan: PlanItem[] = []
  const missing: string[] = []
  const ignored: string[] = []
  let same = 0

  for (const [order, status] of byOrder) {
    const cur = current.get(order)
    if (!cur) { missing.push(order); continue }
    const next = targetOrderStatus(status, cur)
    if (next) plan.push({ type: 'update_order', order_number: order, status: next })
    else if (cur === 'completed' || (cur === 'processing' && !isFalconSuccess(status)) ) same++
    else ignored.push(`${order} (${status})`)
  }

  const lines = [`Lexova ${byOrder.size} porosi nga posta.`]
  if (plan.length) lines.push(`${plan.length} do të ndryshojnë (Sukses = Përfunduar, E regjistruar/Në shpërndarje = Në përpunim).`)
  else lines.push('Asnjë porosi nuk ka nevojë për ndryshim.')
  if (same) lines.push(`${same} janë tashmë në statusin e duhur.`)
  if (ignored.length) lines.push(`Të pandryshuara (status i postës pa rregull): ${ignored.join(', ')}.`)
  if (missing.length) lines.push(`Nuk u gjetën te sistemi (numër tjetër ose pa numër): ${missing.join(', ')}.`)
  if (plan.some(p => p.type === 'update_order' && p.status === 'completed')) {
    lines.push('Kur një porosi bëhet Përfunduar, stoku zbritet automatikisht.')
  }
  return { reply: lines.join('\n'), plan }
}
