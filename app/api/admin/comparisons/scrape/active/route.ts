import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createServiceClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api/errors'

export async function GET() {
  const { authorized } = await requireAdmin()
  if (!authorized) return apiError('Forbidden', 403)

  const supabase = await createServiceClient()
  const { data: runs, error } = await supabase
    .from('scrape_runs')
    .select('*')
    .in('status', ['pending', 'running'])
    .order('started_at', { ascending: false })

  if (error) return apiError(error.message, 500)
  return NextResponse.json({ runs: runs ?? [] })
}
