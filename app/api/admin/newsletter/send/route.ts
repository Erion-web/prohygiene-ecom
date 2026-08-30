import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { sendNewsletterCampaign } from '@/lib/email'
import { newsletterSendSchema } from '@/lib/validation/schemas'
import { nl2brEscaped } from '@/lib/html-escape'
import { apiError, handleApiError } from '@/lib/api/errors'

export async function POST(req: Request) {
  const { user, authorized } = await requireAdmin()
  if (!authorized || !user) {
    return apiError('Forbidden', 403)
  }

  try {
    const body = await req.json()
    const parsed = newsletterSendSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    const { subject, message, emails } = parsed.data
    const cleaned = [...new Set(emails.map(value => value.toLowerCase()))]

    const service = await createServiceClient()
    const { error: upsertError } = await service
      .from('newsletter_subscribers')
      .upsert(
        cleaned.map(email => ({ email, is_active: true })),
        { onConflict: 'email' }
      )

    if (upsertError) {
      console.error('[newsletter] Failed to prepare recipients:', upsertError)
      return apiError('Failed to prepare recipients', 500)
    }

    const { data: subscribers, error } = await service
      .from('newsletter_subscribers')
      .select('email, unsubscribe_token')
      .in('email', cleaned)

    if (error) {
      console.error('[newsletter] Failed to load subscribers:', error)
      return apiError('Failed to load subscribers', 500)
    }

    const bodyHtml = `<div>${nl2brEscaped(message)}</div>`
    const result = await sendNewsletterCampaign(subject, bodyHtml, subscribers ?? [])

    if (result.skipped) {
      return apiError('RESEND_API_KEY is not configured', 503)
    }

    const sentAt = new Date().toISOString()
    const { data: campaign } = await service
      .from('newsletter_campaigns')
      .insert({
        subject,
        message,
        audience_count: result.sent,
        sent_by: user.id,
        sent_at: sentAt,
      })
      .select('id, subject, message, audience_count, sent_at')
      .maybeSingle()

    return NextResponse.json({
      sent: result.sent,
      campaign: campaign ?? {
        id: crypto.randomUUID(),
        subject,
        message,
        audience_count: result.sent,
        sent_at: sentAt,
      },
    })
  } catch (err) {
    return handleApiError(err, '[newsletter] Send error:')
  }
}
