import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyCallbackSignature } from '@/lib/payment/kartelat'
import { apiError, handleApiError } from '@/lib/api/errors'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const {
      merchantAccount,
      orderReference,
      amount,
      currency,
      transactionStatus,
      merchantSignature,
    } = data

    if (!merchantAccount || !orderReference || !merchantSignature) {
      return apiError('Missing fields', 400)
    }

    const secretKey = process.env.KARTELAT_SECRET_KEY
    if (!secretKey) {
      return apiError('Not configured', 500)
    }

    const valid = verifyCallbackSignature(
      merchantAccount,
      orderReference,
      String(amount ?? ''),
      currency,
      secretKey,
      merchantSignature
    )

    if (!valid) {
      console.error('Kartelat callback: invalid signature')
      return apiError('Invalid signature', 403)
    }

    const status = transactionStatus?.toLowerCase()
    let paymentStatus: string
    let orderStatus: string | undefined

    if (status === 'approved') {
      paymentStatus = 'approved'
      orderStatus = 'processing'
    } else if (status === 'declined') {
      paymentStatus = 'declined'
      orderStatus = 'pending'
    } else {
      paymentStatus = 'needs_clarification'
      orderStatus = undefined
    }

    const supabase = await createServiceClient()

    const { data: payment, error: paymentFetchError } = await supabase
      .from('payments')
      .select('id, amount, status')
      .eq('provider_order_id', orderReference)
      .maybeSingle()

    if (paymentFetchError || !payment) {
      console.error('Kartelat callback: payment not found', paymentFetchError)
      return apiError('Payment not found', 404)
    }

    const callbackAmount = parseFloat(String(amount))
    const storedAmount = Number(payment.amount)
    if (!Number.isFinite(callbackAmount) || Math.abs(callbackAmount - storedAmount) > 0.01) {
      console.error('Kartelat callback: amount mismatch', { callbackAmount, storedAmount })
      return apiError('Amount mismatch', 400)
    }

    if (payment.status === paymentStatus) {
      return NextResponse.json({ result: 'OK' })
    }

    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({ status: paymentStatus, callback_data: data })
      .eq('id', payment.id)

    if (paymentUpdateError) {
      console.error('Kartelat callback: payment update failed', paymentUpdateError)
      return apiError('Failed to update payment', 500)
    }

    const orderUpdate: Record<string, string> = { payment_status: paymentStatus }
    if (orderStatus) orderUpdate.status = orderStatus

    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update(orderUpdate)
      .eq('id', orderReference)

    if (orderUpdateError) {
      console.error('Kartelat callback: order update failed', orderUpdateError)
      return apiError('Failed to update order', 500)
    }

    return NextResponse.json({ result: 'OK' })
  } catch (error) {
    return handleApiError(error, 'Callback error:')
  }
}
