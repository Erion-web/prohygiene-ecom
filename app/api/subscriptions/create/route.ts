import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { user_id, items, frequency, next_order_date } = await req.json()

    if (!user_id || !items?.length || !frequency || !next_order_date) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Service role — bypasses RLS so this works right after a guest's inline
    // signUp too, before their email is confirmed / session is established.
    const supabase = await createServiceClient()

    const { data: sub, error } = await supabase
      .from('subscriptions')
      .insert({ user_id, name: 'Porosi Periodike', frequency, next_order_date })
      .select()
      .single()

    if (error || !sub) {
      console.error('Subscription insert error:', error)
      return NextResponse.json({ error: error?.message ?? 'Failed to create subscription' }, { status: 500 })
    }

    const { error: itemsError } = await supabase.from('subscription_items').insert(
      items.map((item: { productId: string; quantity: number }) => ({
        subscription_id: sub.id,
        product_id: item.productId,
        quantity: item.quantity,
      }))
    )

    if (itemsError) {
      await supabase.from('subscriptions').delete().eq('id', sub.id)
      console.error('Subscription items insert error:', itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    return NextResponse.json({ subscription: sub })
  } catch (err) {
    console.error('Subscription creation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
