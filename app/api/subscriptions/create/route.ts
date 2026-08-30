import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { createSubscriptionSchema } from '@/lib/validation/schemas'
import { apiError, handleApiError } from '@/lib/api/errors'

export async function POST(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const body = await req.json()
    const parsed = createSubscriptionSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    const { items, frequency, next_order_date } = parsed.data
    const supabase = await createServiceClient()

    const productIds = items.map(item => item.productId)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, is_active, listing_type')
      .in('id', productIds)

    if (productsError) {
      console.error('Subscription products load error:', productsError)
      return apiError('Failed to validate products', 500)
    }

    const byId = new Map((products ?? []).map(p => [p.id, p]))
    for (const item of items) {
      const product = byId.get(item.productId)
      if (!product?.is_active || (product.listing_type ?? 'sale') !== 'sale') {
        return apiError('Invalid product in subscription', 400)
      }
    }

    const { data: sub, error } = await supabase
      .from('subscriptions')
      .insert({ user_id: user.id, name: 'Porosi Periodike', frequency, next_order_date })
      .select()
      .single()

    if (error || !sub) {
      console.error('Subscription insert error:', error)
      return apiError('Failed to create subscription', 500)
    }

    const { error: itemsError } = await supabase.from('subscription_items').insert(
      items.map(item => ({
        subscription_id: sub.id,
        product_id: item.productId,
        quantity: item.quantity,
      }))
    )

    if (itemsError) {
      await supabase.from('subscriptions').delete().eq('id', sub.id)
      console.error('Subscription items insert error:', itemsError)
      return apiError('Failed to create subscription', 500)
    }

    return NextResponse.json({ subscription: sub })
  } catch (err) {
    return handleApiError(err, 'Subscription creation error:')
  }
}
