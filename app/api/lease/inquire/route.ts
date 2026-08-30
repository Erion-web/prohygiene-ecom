import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendLeaseInquiryEmail } from '@/lib/email'
import { leaseInquirySchema } from '@/lib/validation/schemas'
import { apiError, handleApiError } from '@/lib/api/errors'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = leaseInquirySchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Missing required fields', 400)
    }

    const { product_id, name, email, phone, company, message } = parsed.data
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
      return apiError('Failed to save inquiry', 500)
    }

    await sendLeaseInquiryEmail({
      name,
      email,
      phone: phone ?? undefined,
      company: company ?? undefined,
      message: message ?? undefined,
      productName,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err, '[lease/inquire] Failed:')
  }
}
