import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createFalconOrder, findFalconCityId } from '@/lib/falcon'

function isAdminRole(role: unknown): boolean {
  return typeof role === 'string' && ['admin', 'manager'].includes(role)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const jwtRole = (user.app_metadata as Record<string, unknown>)?.role
  let authorized = isAdminRole(jwtRole)
  if (!authorized) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    authorized = isAdminRole(profile?.role)
  }
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: order } = await supabase.from('orders').select('*').eq('id', params.id).single()
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.falcon_order_id) {
    return NextResponse.json({ error: 'Kjo porosi është dërguar tashmë në Falcon Posta' }, { status: 400 })
  }

  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id)

  try {
    const cityId = await findFalconCityId(order.city)
    if (!cityId) {
      return NextResponse.json({ error: `Qyteti "${order.city}" nuk u gjet te Falcon Posta` }, { status: 400 })
    }

    const itemList = items ?? []
    const productName = itemList.length === 1
      ? itemList[0].product_name_sq
      : `${order.order_number} — ${itemList.length} artikuj`
    const productDescription = itemList
      .map((i: { quantity: number; product_name_sq: string }) => `${i.quantity}x ${i.product_name_sq}`)
      .join(', ')
      .slice(0, 500)

    const falconOrder = await createFalconOrder({
      customOrderId: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerAddress: `${order.address}, ${order.city}`,
      cityId,
      productName,
      productDescription,
      productPrice: order.total,
      additionalInfo: order.notes ?? undefined,
    })

    await supabase
      .from('orders')
      .update({
        falcon_order_id: falconOrder.id,
        falcon_status_id: falconOrder.status.id,
        falcon_status_name: falconOrder.status.name,
        falcon_updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    return NextResponse.json({ falconOrder })
  } catch (err) {
    console.error('[falcon send] Error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Dërgimi dështoi' }, { status: 500 })
  }
}
