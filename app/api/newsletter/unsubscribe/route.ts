import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  await supabase
    .from('newsletter_subscribers')
    .update({ is_active: false })
    .eq('unsubscribe_token', token)

  return new NextResponse(
    `<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding:60px 20px;">
      <h2>U çregjistruat me sukses</h2>
      <p>Nuk do të merrni më email-e nga ProHygiene.</p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
