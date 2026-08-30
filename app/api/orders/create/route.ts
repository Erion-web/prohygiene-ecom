import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from '@/lib/email'
import { saveCustomerAddressFromOrder } from '@/lib/orders/save-customer-address'
import { buildOrderFromItems } from '@/lib/orders/compute-order'
import { createOrderSchema } from '@/lib/validation/schemas'
import { apiError, handleApiError } from '@/lib/api/errors'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    const input = parsed.data
    if (input.customer_type === 'business' && !input.business_name?.trim()) {
      return apiError('Business name is required', 400)
    }

    const user = await getAuthUser()
    const supabase = await createServiceClient()

    const { totals, error: computeError } = await buildOrderFromItems(supabase, input.items)
    if (computeError || !totals) {
      return apiError(computeError ?? 'Failed to compute order', 400)
    }

    const { data: created, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id ?? null,
        customer_name: input.customer_name,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone,
        customer_type: input.customer_type,
        business_name: input.customer_type === 'business' ? input.business_name?.trim() || null : null,
        fiscal_number: input.customer_type === 'business' ? input.fiscal_number?.trim() || null : null,
        city: input.city,
        address: input.address,
        notes: input.notes?.trim() || null,
        subtotal: totals.subtotal,
        discount_amount: totals.discount_amount,
        shipping_cost: totals.shipping_cost,
        vat_amount: totals.vat_amount,
        total: totals.total,
        status: 'pending',
        payment_method: input.payment_method,
        payment_status: 'pending',
      })
      .select()
      .single()

    if (orderError || !created) {
      console.error('Order insert error:', orderError)
      return apiError('Failed to create order', 500)
    }

    const orderItems = totals.lines.map(line => ({
      order_id: created.id,
      product_id: line.product_id,
      product_name_sq: line.product_name_sq,
      product_name_en: line.product_name_en,
      product_sku: line.product_sku,
      product_image_url: line.product_image_url,
      unit_price: line.unit_price,
      sale_price: line.sale_price,
      quantity: line.quantity,
      subtotal: line.subtotal,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) {
      await supabase.from('orders').delete().eq('id', created.id)
      console.error('Order items insert error:', itemsError)
      return apiError('Failed to create order', 500)
    }

    saveCustomerAddressFromOrder(supabase, created).catch(err =>
      console.error('[order] Address persist failed:', err)
    )

    Promise.all([
      sendOrderConfirmationEmail(created, orderItems),
      sendOrderNotificationEmail(created, orderItems),
    ]).catch(err => console.error('[email] Order email dispatch failed:', err))

    return NextResponse.json({ order: created })
  } catch (err) {
    return handleApiError(err, 'Order creation error:')
  }
}
