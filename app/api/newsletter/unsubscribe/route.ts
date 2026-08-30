import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api/errors'

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) {
    return apiError('Missing token', 400)
  }

  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ is_active: false })
    .eq('unsubscribe_token', token)

  if (error) {
    console.error('[newsletter] Unsubscribe error:', error)
    return apiError('Failed to unsubscribe', 500)
  }

  return new NextResponse(
    `<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding:60px 20px;">
      <h2>U çregjistruat me sukses</h2>
      <p>Nuk do të merrni më email-e nga ProHygiene.</p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
