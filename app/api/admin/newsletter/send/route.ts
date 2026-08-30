import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendNewsletterCampaign } from '@/lib/email'

function isAdminRole(role: unknown): boolean {
  return typeof role === 'string' && ['admin', 'manager'].includes(role)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const jwtRole = (user.app_metadata as Record<string, unknown>)?.role
  let authorized = isAdminRole(jwtRole)
  if (!authorized) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    authorized = isAdminRole(profile?.role)
  }
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { subject, message, emails } = await req.json()
    if (!subject || !message) {
      return NextResponse.json({ error: 'Missing subject or message' }, { status: 400 })
    }
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Zgjidhni të paktën një marrës' }, { status: 400 })
    }

    const cleaned = [...new Set(
      emails
        .filter((value: unknown): value is string => typeof value === 'string')
        .map(value => value.trim().toLowerCase())
        .filter(value => value.includes('@'))
    )].slice(0, 2000)

    if (cleaned.length === 0) {
      return NextResponse.json({ error: 'Zgjidhni të paktën një marrës' }, { status: 400 })
    }

    const service = await createServiceClient()
    const { error: upsertError } = await service
      .from('newsletter_subscribers')
      .upsert(
        cleaned.map(email => ({ email, is_active: true })),
        { onConflict: 'email' }
      )

    if (upsertError) {
      console.error('[newsletter] Failed to prepare recipients:', upsertError)
      return NextResponse.json({ error: 'Failed to prepare recipients' }, { status: 500 })
    }

    const { data: subscribers, error } = await service
      .from('newsletter_subscribers')
      .select('email, unsubscribe_token')
      .in('email', cleaned)

    if (error) {
      console.error('[newsletter] Failed to load subscribers:', error)
      return NextResponse.json({ error: 'Failed to load subscribers' }, { status: 500 })
    }

    const bodyHtml = `<div>${message.replace(/\n/g, '<br/>')}</div>`
    const result = await sendNewsletterCampaign(subject, bodyHtml, subscribers ?? [])

    if (result.skipped) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 503 })
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
    console.error('[newsletter] Send error:', err)
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 })
  }
}
