import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createKartelatPayment } from '@/lib/payment/kartelat'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order_id, order_number, amount, email, lang, customer_name } = body

    if (!order_id || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const merchantId = process.env.KARTELAT_MERCHANT_ID
    const secretKey  = process.env.KARTELAT_SECRET_KEY
    const apiUrl     = process.env.KARTELAT_API_URL ?? 'https://kartelat-stage.paysera-ks.com/api'
    const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    if (!merchantId || !secretKey) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 })
    }

    const nameParts = (customer_name ?? '').split(' ')
    const firstName = nameParts[0] ?? ''
    const lastName  = nameParts.slice(1).join(' ') || firstName

    const payUrl = await createKartelatPayment(
      {
        merchant_id:  merchantId,
        order_id:     order_id,
        amount:       amount,
        currency_iso: 'EUR',
        description:  `ProHygiene porosi #${order_number}`,
        approve_url:  `${appUrl}/order-success?order=${order_number}`,
        decline_url:  `${appUrl}/order-failed?order=${order_number}`,
        cancel_url:   `${appUrl}/checkout`,
        callback_url: `${appUrl}/api/payment/callback`,
        email:        email ?? '',
        client_first_name: firstName,
        client_last_name:  lastName,
        language:     lang === 'sq' ? 'en' : 'en',
      },
      secretKey,
      apiUrl
    )

    const supabase = await createServiceClient()
    await supabase.from('payments').insert({
      order_id,
      payment_provider: 'kartelat',
      provider_order_id: order_id,
      amount,
      currency: 'EUR',
      status: 'pending',
    })

    return NextResponse.json({ redirect_url: payUrl })
  } catch (error) {
    console.error('Payment create error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
