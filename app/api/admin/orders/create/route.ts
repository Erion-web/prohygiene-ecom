import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { adminCreateOrderSchema } from '@/lib/validation/admin-schemas'
import { buildOrderFromItems, VAT_RATE } from '@/lib/orders/compute-order'
import { saveCustomerAddressFromOrder } from '@/lib/orders/save-customer-address'
import { apiError, handleApiError } from '@/lib/api/errors'

export async function POST(req: Request) {
  const { authorized } = await requireAdmin()
  if (!authorized) return apiError('Forbidden', 403)

  try {
    const input = adminCreateOrderSchema.parse(await req.json())
    if (input.customer_type === 'business' && !input.business_name?.trim()) {
      return apiError('Emri i biznesit është i detyrueshëm', 400)
    }

    const supabase = await createServiceClient()
    const { totals, error: computeError } = await buildOrderFromItems(supabase, input.items)
    if (computeError || !totals) return apiError(computeError ?? 'Failed to compute order', 400)

    // Prices come from the DB; the admin only controls shipping (no auto coupon on manual orders).
    const total = Math.round((totals.subtotal - totals.product_discount + input.shipping_cost) * 100) / 100
    const vatAmount = Math.round(total * VAT_RATE * 100) / 100

    const { data: created, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: null,
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
        discount_amount: totals.product_discount,
        shipping_cost: input.shipping_cost,
        vat_amount: vatAmount,
        total,
        status: 'pending',
        payment_method: input.payment_method,
        payment_status: input.payment_status,
      })
      .select()
      .single()

    if (orderError || !created) {
      console.error('[admin order create] insert error:', orderError)
      return apiError('Krijimi i porosisë dështoi', 500)
    }

    const { error: itemsError } = await supabase.from('order_items').insert(
      totals.lines.map(line => ({
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
      })),
    )
    if (itemsError) {
      await supabase.from('orders').delete().eq('id', created.id)
      console.error('[admin order create] items error:', itemsError)
      return apiError('Krijimi i porosisë dështoi', 500)
    }

    saveCustomerAddressFromOrder(supabase, created).catch(err =>
      console.error('[admin order create] address persist failed:', err),
    )

    return NextResponse.json({ order: created })
  } catch (err) {
    return handleApiError(err, '[admin order create] Error:')
  }
}
