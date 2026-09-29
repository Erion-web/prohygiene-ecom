import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { processScrapeBatch } from '@/lib/comparisons/scrape-batch'
import { apiError, handleApiError } from '@/lib/api/errors'
import { z } from 'zod'

const bodySchema = z.object({ runId: z.string().uuid() })

export async function POST(req: Request) {
  const { authorized } = await requireAdmin()
  if (!authorized) return apiError('Forbidden', 403)

  try {
    const body = bodySchema.parse(await req.json())
    const result = await processScrapeBatch(body.runId)
    return NextResponse.json(result)
  } catch (err) {
    return handleApiError(err, '[comparisons/scrape/batch]')
  }
}
