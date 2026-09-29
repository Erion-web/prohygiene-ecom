import { NextResponse } from 'next/server'
import { runDueCompetitorScrape, processScrapeBatch } from '@/lib/comparisons/scrape-batch'
import { createServiceClient } from '@/lib/supabase/server'

function isAuthorizedCron(req: Request): boolean {
  if (req.headers.get('x-vercel-cron') === '1') return true
  if (process.env.NODE_ENV === 'development') return true
  return false
}

/** Continue one in-progress run, or start the next due competitor (one batch). */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createServiceClient()
    const { data: activeRun } = await supabase
      .from('scrape_runs')
      .select('id')
      .eq('status', 'running')
      .order('started_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (activeRun?.id) {
      const result = await processScrapeBatch(activeRun.id)
      return NextResponse.json({ mode: 'continue', ...result })
    }

    const started = await runDueCompetitorScrape()
    return NextResponse.json({ mode: 'due', ...started })
  } catch (err) {
    console.error('[cron/competitor-scrape]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Cron failed' },
      { status: 500 }
    )
  }
}
