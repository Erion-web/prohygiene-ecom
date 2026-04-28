import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPayseraCallback, parsePayseraCallback } from '@/lib/payment/paysera'

export async function POST(request: Request) {
  try {
    const body = await request.formData()
    const data = body.get('data') as string | null
    const ss1 = body.get('ss1') as string | null

    if (!data || !ss1) {
      return new NextResponse('Missing data or signature', { status: 400 })
    }

    const signPassword = process.env.PAYSERA_SIGN_PASSWORD
    if (!signPassword) {
      return new NextResponse('Payment gateway not configured', { status: 500 })
    }

    // Verify signature
    const isValid = verifyPayseraCallback(data, ss1, signPassword)
    if (!isValid) {
      console.error('Paysera callback: Invalid signature')
      return new NextResponse('Invalid signature', { status: 403 })
    }

    const params = parsePayseraCallback(data)
    const orderId = params['orderid']
    const status = params['status'] // 1 = approved, 2 = additional payment, 3 = payment failed

    const supabase = await createServiceClient()

    let paymentStatus: string
    let orderPaymentStatus: string

    switch (status) {
      case '1':
        paymentStatus = 'approved'
        orderPaymentStatus = 'approved'
        break
      case '2':
        paymentStatus = 'needs_clarification'
        orderPaymentStatus = 'needs_clarification'
        break
      case '3':
        paymentStatus = 'declined'
        orderPaymentStatus = 'declined'
        break
      default:
        paymentStatus = 'pending'
        orderPaymentStatus = 'pending'
    }

    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        provider_payment_id: params['payment_id'] ?? null,
        callback_data: params,
      })
      .eq('provider_order_id', orderId)

    // Update order payment status
    await supabase
      .from('orders')
      .update({
        payment_status: orderPaymentStatus,
        status: paymentStatus === 'approved' ? 'confirmed' : undefined,
      })
      .eq('id', orderId)

    // Paysera expects "OK" response
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Payment callback error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// Also handle GET (some payment providers use GET for callbacks)
export async function GET(request: Request) {
  const url = new URL(request.url)
  const data = url.searchParams.get('data')
  const ss1 = url.searchParams.get('ss1')

  if (!data || !ss1) {
    return new NextResponse('Missing data or signature', { status: 400 })
  }

  const signPassword = process.env.PAYSERA_SIGN_PASSWORD
  if (!signPassword) return new NextResponse('Not configured', { status: 500 })

  const isValid = verifyPayseraCallback(data, ss1, signPassword)
  if (!isValid) return new NextResponse('Invalid signature', { status: 403 })

  const params = parsePayseraCallback(data)
  const orderId = params['orderid']

  const supabase = await createServiceClient()
  const paymentStatus = params['status'] === '1' ? 'approved' : 'declined'

  await supabase.from('orders').update({ payment_status: paymentStatus }).eq('id', orderId)

  return new NextResponse('OK', { status: 200 })
}
