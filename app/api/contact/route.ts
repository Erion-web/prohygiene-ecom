import { NextResponse } from 'next/server'
import { sendContactFormEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { name, email, phone, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await sendContactFormEmail({ name, email, phone, subject, message })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] Failed to send:', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
