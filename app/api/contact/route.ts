import { NextResponse } from 'next/server'
import { sendContactFormEmail } from '@/lib/email'
import { contactFormSchema } from '@/lib/validation/schemas'
import { apiError, handleApiError } from '@/lib/api/errors'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = contactFormSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Missing required fields', 400)
    }

    await sendContactFormEmail(parsed.data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err, '[contact] Failed to send:')
  }
}
