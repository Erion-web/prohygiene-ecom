import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createServiceClient } from '@/lib/supabase/server'
import { executePlan } from '@/lib/assistant/execute'
import { planSchema } from '@/lib/assistant/schemas'
import { apiError, handleApiError } from '@/lib/api/errors'

export async function POST(req: Request) {
  const { authorized } = await requireAdmin()
  if (!authorized) return apiError('Forbidden', 403)

  try {
    const { plan } = z.object({ plan: planSchema }).parse(await req.json())
    const supabase = await createServiceClient()
    const results = await executePlan(supabase, plan)
    revalidatePath('/admin/products')
    revalidatePath('/shop')
    return NextResponse.json({ results })
  } catch (err) {
    return handleApiError(err, '[assistant/execute]')
  }
}
