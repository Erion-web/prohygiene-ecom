import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/require-admin'
import { apiError, handleApiError } from '@/lib/api/errors'

const bodySchema = z.object({
  competitorProductId: z.string().uuid(),
  matchedProductId: z.string().uuid().nullable(),
})

export async function PATCH(req: Request) {
  const { supabase, authorized } = await requireAdmin()
  if (!authorized) return apiError('Forbidden', 403)

  try {
    const { competitorProductId, matchedProductId } = bodySchema.parse(await req.json())
    const { error } = await supabase
      .from('competitor_products')
      .update({
        matched_product_id: matchedProductId,
        match_confidence: matchedProductId ? 1 : null,
      })
      .eq('id', competitorProductId)

    if (error) return apiError(error.message, 500)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err, '[comparisons/match]')
  }
}
