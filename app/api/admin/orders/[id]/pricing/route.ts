import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createServiceClient } from '@/lib/supabase/server'
import { VAT_RATE } from '@/lib/orders/compute-order'
import { logOrderHistory, type OrderChange } from '@/lib/orders/history'
import { apiError, handleApiError } from '@/lib/api/errors'

const money = z.number().finite().nonnegative().max(1_000_000)
const bodySchema = z.object({
  shipping_cost: money,
  items: z.array(z.object({ id: z.string().uuid(), unit_price: money })).max(100),
})

const r2 = (n: number) => Math.round(n * 100) / 100
const eur = (n: number) => `€${Number(n).toFixed(2)}`

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, authorized } = await requireAdmin()
  if (!authorized || !user) return apiError('Forbidden', 403)

  try {
    const input = bodySchema.parse(await req.json())
    const supabase = await createServiceClient()

    const { data: order } = await supabase.from('orders').select('*').eq('id', id).single()
    if (!order) return apiError('Porosia nuk u gjet', 404)
    if (order.source !== 'admin') {
      return apiError('Çmimet mund të ndryshohen vetëm për porositë e krijuara manualisht nga admini', 403)
    }

    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', id)
    const byId = new Map((items ?? []).map(i => [i.id as string, i]))
    const changes: OrderChange[] = []

    for (const edit of input.items) {
      const item = byId.get(edit.id)
      if (!item) return apiError('Artikulli nuk i përket kësaj porosie', 400)
      const oldPrice = Number(item.sale_price ?? item.unit_price)
      if (r2(oldPrice) === r2(edit.unit_price)) continue

      const subtotal = r2(edit.unit_price * item.quantity)
      const { error } = await supabase
        .from('order_items')
        .update({ unit_price: edit.unit_price, sale_price: null, subtotal })
        .eq('id', item.id)
      if (error) return apiError('Ruajtja e çmimit dështoi', 500)
      item.unit_price = edit.unit_price
      item.sale_price = null
      item.subtotal = subtotal
      changes.push({ field: `Çmimi: ${item.product_name_sq}`, from: eur(oldPrice), to: eur(edit.unit_price) })
    }

    if (r2(Number(order.shipping_cost)) !== r2(input.shipping_cost)) {
      changes.push({ field: 'Transporti', from: eur(order.shipping_cost), to: eur(input.shipping_cost) })
    }

    if (changes.length === 0) return NextResponse.json({ order, changed: false })

    const all = items ?? []
    const merchandiseTotal = r2(all.reduce((s, i) => s + Number(i.subtotal), 0))
    const subtotal = r2(all.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0))
    const total = r2(merchandiseTotal + input.shipping_cost)
    const patch = {
      subtotal,
      discount_amount: r2(subtotal - merchandiseTotal),
      shipping_cost: input.shipping_cost,
      total,
      vat_amount: r2(total * VAT_RATE),
    }
    const { data: updated, error: orderError } = await supabase.from('orders').update(patch).eq('id', id).select().single()
    if (orderError) return apiError('Ruajtja dështoi', 500)

    if (r2(Number(order.total)) !== total) {
      changes.push({ field: 'Totali', from: eur(order.total), to: eur(total) })
    }
    await logOrderHistory(supabase, {
      orderId: id,
      actorId: user.id,
      actorLabel: user.email ?? 'Admin',
      summary: 'Çmimet u ndryshuan',
      changes,
    })

    return NextResponse.json({ order: updated, changed: true })
  } catch (err) {
    return handleApiError(err, '[order pricing] Error:')
  }
}
