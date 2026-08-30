import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { newsletterSubscribeSchema } from '@/lib/validation/schemas'
import { apiError, handleApiError } from '@/lib/api/errors'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = newsletterSubscribeSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Invalid email', 400)
    }

    const supabase = await createServiceClient()
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert({ email: parsed.data.email.toLowerCase(), is_active: true }, { onConflict: 'email' })

    if (error) {
      console.error('[newsletter] Subscribe error:', error)
      return apiError('Failed to subscribe', 500)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err, '[newsletter] Subscribe error:')
  }
}
