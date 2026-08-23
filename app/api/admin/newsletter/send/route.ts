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
    const { subject, message } = await req.json()
    if (!subject || !message) {
      return NextResponse.json({ error: 'Missing subject or message' }, { status: 400 })
    }

    const service = await createServiceClient()
    const { data: subscribers, error } = await service
      .from('newsletter_subscribers')
      .select('email, unsubscribe_token')
      .eq('is_active', true)

    if (error) {
      console.error('[newsletter] Failed to load subscribers:', error)
      return NextResponse.json({ error: 'Failed to load subscribers' }, { status: 500 })
    }

    const bodyHtml = `<div>${message.replace(/\n/g, '<br/>')}</div>`
    const result = await sendNewsletterCampaign(subject, bodyHtml, subscribers ?? [])

    if (result.skipped) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 503 })
    }

    return NextResponse.json({ sent: result.sent })
  } catch (err) {
    console.error('[newsletter] Send error:', err)
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 })
  }
}
