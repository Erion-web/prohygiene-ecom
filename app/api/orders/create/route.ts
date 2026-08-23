import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { order, items } = body

    if (!order || !items?.length) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Use service role — bypasses RLS, works for both guests and logged-in users
    const supabase = await createServiceClient()

    const { data: created, error: orderError } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single()

    if (orderError || !created) {
      console.error('Order insert error:', orderError)
      return NextResponse.json({ error: orderError?.message ?? 'Failed to create order' }, { status: 500 })
    }

    // Mock/seed products use non-UUID ids (e.g. "p-3"); product_id is a UUID FK,
    // so coerce anything that isn't a valid UUID to null. The line snapshot
    // (name, sku, price, qty) is preserved regardless.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const orderItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      product_id: typeof item.product_id === 'string' && UUID_RE.test(item.product_id) ? item.product_id : null,
      order_id: created.id,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) {
      // Roll back the order if items fail
      await supabase.from('orders').delete().eq('id', created.id)
      console.error('Order items insert error:', itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Fire-and-forget: a failed email must never fail an already-placed order.
    Promise.all([
      sendOrderConfirmationEmail(created, orderItems),
      sendOrderNotificationEmail(created, orderItems),
    ]).catch(err => console.error('[email] Order email dispatch failed:', err))

    return NextResponse.json({ order: created })
  } catch (err) {
    console.error('Order creation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
