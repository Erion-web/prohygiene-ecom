import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendLeaseInquiryEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { product_id, name, email, phone, company, message } = await req.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    let productName = 'Pajisje'
    if (product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('name_sq, name_en, sku')
        .eq('id', product_id)
        .single()
      if (product) productName = product.name_sq
    }

    const { error } = await supabase.from('lease_inquiries').insert({
      product_id: product_id || null,
      name,
      email,
      phone: phone || null,
      company: company || null,
      message: message || null,
      status: 'new',
    })

    if (error) {
      console.error('[lease/inquire] DB error:', error)
      return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 })
    }

    await sendLeaseInquiryEmail({
      name,
      email,
      phone,
      company,
      message,
      productName,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[lease/inquire] Failed:', err)
    return NextResponse.json({ error: 'Failed to send inquiry' }, { status: 500 })
  }
}
