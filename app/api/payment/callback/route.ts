import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyCallbackSignature } from '@/lib/payment/kartelat'

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
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const secretKey = process.env.KARTELAT_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'Not configured' }, { status: 500 })
    }

    const valid = verifyCallbackSignature(
      merchantAccount,
      orderReference,
      amount,
      currency,
      secretKey,
      merchantSignature
    )

    if (!valid) {
      console.error('Kartelat callback: invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // transactionStatus: "Approved" | "Declined" | "NEEDS-CLARIFICATION"
    const status = transactionStatus?.toLowerCase()
    let paymentStatus: string
    let orderStatus: string | undefined

    if (status === 'approved') {
      paymentStatus = 'approved'
      orderStatus   = 'confirmed'
    } else if (status === 'declined') {
      paymentStatus = 'declined'
      orderStatus   = 'cancelled'
    } else {
      paymentStatus = 'needs_clarification'
      orderStatus   = undefined
    }

    const supabase = await createServiceClient()

    await supabase
      .from('payments')
      .update({ status: paymentStatus, callback_data: data })
      .eq('provider_order_id', orderReference)

    const orderUpdate: Record<string, string> = { payment_status: paymentStatus }
    if (orderStatus) orderUpdate.status = orderStatus

    await supabase
      .from('orders')
      .update(orderUpdate)
      .eq('id', orderReference)

    return NextResponse.json({ result: 'OK' })
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
