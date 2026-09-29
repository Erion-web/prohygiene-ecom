import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createServiceClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api/errors'

export async function GET(req: Request) {
  const { authorized } = await requireAdmin()
  if (!authorized) return apiError('Forbidden', 403)

  const runId = new URL(req.url).searchParams.get('runId')
  if (!runId) return apiError('runId mungon', 400)

  const supabase = await createServiceClient()
  const { data: run, error } = await supabase.from('scrape_runs').select('*').eq('id', runId).single()
  if (error || !run) return apiError('Scrape run nuk u gjet', 404)

  return NextResponse.json({ run })
}
