import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

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

    const orderItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      order_id: created.id,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) {
      // Roll back the order if items fail
      await supabase.from('orders').delete().eq('id', created.id)
      console.error('Order items insert error:', itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    return NextResponse.json({ order: created })
  } catch (err) {
    console.error('Order creation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
