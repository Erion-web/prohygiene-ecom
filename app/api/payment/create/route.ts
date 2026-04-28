import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { buildPayseraPaymentUrl } from '@/lib/payment/paysera'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order_id, order_number, amount, email, lang } = body

    if (!order_id || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const projectId = process.env.PAYSERA_PROJECT_ID
    const signPassword = process.env.PAYSERA_SIGN_PASSWORD

    if (!projectId || !signPassword) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Amount in cents
    const amountCents = Math.round(amount * 100).toString()

    const paymentUrl = buildPayseraPaymentUrl(
      {
        projectid: projectId,
        orderid: order_id,
        accepturl: `${appUrl}/order-success?order=${order_number}`,
        cancelurl: `${appUrl}/order-failed?order=${order_number}`,
        callbackurl: `${appUrl}/api/payment/callback`,
        payment: '',
        version: '1.6',
        amount: amountCents,
        currency: 'EUR',
        country: 'XK',
        paytext: `ProHygiene porosi #${order_number}`,
        p_email: email ?? '',
        lang: lang === 'sq' ? 'ALB' : 'ENG',
        test: process.env.NODE_ENV === 'production' ? '' : '1',
      },
      signPassword
    )

    // Record payment initiation
    const supabase = await createServiceClient()
    await supabase.from('payments').insert({
      order_id,
      payment_provider: 'paysera',
      provider_order_id: order_id,
      amount,
      currency: 'EUR',
      status: 'pending',
    })

    return NextResponse.json({ redirect_url: paymentUrl })
  } catch (error) {
    console.error('Payment create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
