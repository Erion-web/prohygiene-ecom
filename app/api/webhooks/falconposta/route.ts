import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyFalconSignature } from '@/lib/falcon'

interface FalconStatus {
  id: number
  name: string
}

interface FalconOrderStatusChanged {
  event_type: 'ORDER_STATUS_CHANGED'
  order_id: string
  custom_order_id: string
  old_status: FalconStatus
  new_status: FalconStatus
}

interface FalconLiquidationEvent {
  event_type: 'LIQUIDATION_CREATED' | 'LIQUIDATION_STATUS_CHANGED'
  liquidation_id: number
  new_status?: FalconStatus
  total_sales: string
  total_neto_amount: string
  orders: { order_id: string; custom_order_id: string }[]
}

type FalconWebhookPayload = FalconOrderStatusChanged | FalconLiquidationEvent

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('signature')

  if (!verifyFalconSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: FalconWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  try {
    switch (payload.event_type) {
      case 'ORDER_STATUS_CHANGED': {
        const { error } = await supabase
          .from('orders')
          .update({
            falcon_order_id: payload.order_id,
            falcon_status_id: payload.new_status.id,
            falcon_status_name: payload.new_status.name,
            falcon_updated_at: new Date().toISOString(),
          })
          .eq('order_number', payload.custom_order_id)

        if (error) console.error('[falcon webhook] Order update failed:', error)
        break
      }

      case 'LIQUIDATION_CREATED':
      case 'LIQUIDATION_STATUS_CHANGED': {
        const { error } = await supabase.from('falcon_liquidations').upsert(
          {
            falcon_liquidation_id: payload.liquidation_id,
            status_id: payload.new_status?.id ?? null,
            status_name: payload.new_status?.name ?? null,
            total_sales: payload.total_sales ? Number(payload.total_sales) : null,
            total_neto_amount: payload.total_neto_amount ? Number(payload.total_neto_amount) : null,
            orders: payload.orders ?? [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'falcon_liquidation_id' }
        )

        if (error) console.error('[falcon webhook] Liquidation upsert failed:', error)
        break
      }

      default:
        console.warn('[falcon webhook] Unknown event_type:', (payload as { event_type?: string }).event_type)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[falcon webhook] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
