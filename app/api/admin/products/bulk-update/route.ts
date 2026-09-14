import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { bulkUpdateProductsSchema } from '@/lib/validation/admin-schemas'
import { apiError, handleApiError } from '@/lib/api/errors'

export async function POST(req: Request) {
  const { supabase, authorized } = await requireAdmin()
  if (!authorized) {
    return apiError('Forbidden', 403)
  }

  try {
    const body = await req.json()
    const { productIds, patch } = bulkUpdateProductsSchema.parse(body)

    const updatePayload: Record<string, unknown> = {}
    if (patch.category_id !== undefined) updatePayload.category_id = patch.category_id
    if (patch.brand_id !== undefined) updatePayload.brand_id = patch.brand_id
    if (patch.audience_type !== undefined) updatePayload.audience_type = patch.audience_type

    const { error } = await supabase
      .from('products')
      .update(updatePayload)
      .in('id', productIds)

    if (error) {
      console.error('[bulk-update products] Error:', error)
      return apiError('Përditësimi dështoi', 500)
    }

    return NextResponse.json({ updated: productIds.length })
  } catch (err) {
    return handleApiError(err, '[bulk-update products] Error:')
  }
}
