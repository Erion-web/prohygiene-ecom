import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createFalconOrder, findFalconCityId } from '@/lib/falcon'
import { apiError, handleApiError } from '@/lib/api/errors'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, authorized } = await requireAdmin()
  if (!authorized) {
    return apiError('Forbidden', 403)
  }

  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single()
  if (!order) {
    return apiError('Order not found', 404)
  }
  if (order.falcon_order_id) {
    return apiError('Kjo porosi është dërguar tashmë në Falcon Posta', 400)
  }

  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id)

  try {
    const cityId = await findFalconCityId(order.city)
    if (!cityId) {
      return apiError(`Qyteti "${order.city}" nuk u gjet te Falcon Posta`, 400)
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

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        falcon_order_id: falconOrder.id,
        falcon_status_id: falconOrder.status.id,
        falcon_status_name: falconOrder.status.name,
        falcon_updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('[falcon send] Order update failed:', updateError)
      return apiError('Failed to save Falcon order reference', 500)
    }

    return NextResponse.json({ falconOrder })
  } catch (err) {
    return handleApiError(err, '[falcon send] Error:')
  }
}
