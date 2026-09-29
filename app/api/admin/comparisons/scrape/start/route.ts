import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { startScrapeRun } from '@/lib/comparisons/scrape-batch'
import { apiError, handleApiError } from '@/lib/api/errors'
import { z } from 'zod'

const bodySchema = z.object({ competitorId: z.string().uuid() })

export async function POST(req: Request) {
  const { authorized } = await requireAdmin()
  if (!authorized) return apiError('Forbidden', 403)

  try {
    const body = bodySchema.parse(await req.json())
    const run = await startScrapeRun(body.competitorId)
    return NextResponse.json({ run })
  } catch (err) {
    return handleApiError(err, '[comparisons/scrape/start]')
  }
}
