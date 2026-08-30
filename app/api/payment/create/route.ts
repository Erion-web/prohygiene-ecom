import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createKartelatPayment } from '@/lib/payment/kartelat'
import { createPaymentSchema } from '@/lib/validation/schemas'
import { apiError, handleApiError } from '@/lib/api/errors'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    const { order_id, order_number, email, lang, customer_name } = parsed.data

    const supabase = await createServiceClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total, payment_status, customer_name, customer_email')
      .eq('id', order_id)
      .maybeSingle()

    if (orderError || !order) {
      return apiError('Order not found', 404)
    }

    if (order.payment_status !== 'pending') {
      return apiError('Order payment is not pending', 400)
    }

    const amount = Number(order.total)
    if (!Number.isFinite(amount) || amount <= 0) {
      return apiError('Invalid order total', 400)
    }

    const merchantId = process.env.KARTELAT_MERCHANT_ID
    const secretKey = process.env.KARTELAT_SECRET_KEY
    const apiUrl = process.env.KARTELAT_API_URL ?? 'https://kartelat-stage.paysera-ks.com/api'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    if (!merchantId || !secretKey) {
      return apiError('Payment gateway not configured', 500)
    }

    const payerName = customer_name ?? order.customer_name ?? ''
    const nameParts = payerName.split(' ')
    const firstName = nameParts[0] ?? ''
    const lastName = nameParts.slice(1).join(' ') || firstName

    const payUrl = await createKartelatPayment(
      {
        merchant_id: merchantId,
        order_id,
        amount,
        currency_iso: 'EUR',
        description: `ProHygiene porosi #${order_number}`,
        approve_url: `${appUrl}/order-success?order=${order_number}`,
        decline_url: `${appUrl}/order-failed?order=${order_number}`,
        cancel_url: `${appUrl}/checkout`,
        callback_url: `${appUrl}/api/payment/callback`,
        email: email ?? order.customer_email ?? '',
        client_first_name: firstName,
        client_last_name: lastName,
        language: lang === 'sq' ? 'en' : 'en',
      },
      secretKey,
      apiUrl
    )

    const { error: paymentError } = await supabase.from('payments').insert({
      order_id,
      payment_provider: 'kartelat',
      provider_order_id: order_id,
      amount,
      currency: 'EUR',
      status: 'pending',
    })

    if (paymentError) {
      console.error('Payment insert error:', paymentError)
      return apiError('Failed to create payment', 500)
    }

    return NextResponse.json({ redirect_url: payUrl })
  } catch (error) {
    return handleApiError(error, 'Payment create error:')
  }
}
