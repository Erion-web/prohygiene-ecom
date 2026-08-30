'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createServiceClient } from '@/lib/supabase/server'
import { recordRefillSchema, type RecordRefillInput } from '@/lib/validation/admin-schemas'
import { actionError, type ActionResult } from '@/lib/actions/types'

export async function recordRefillAction(raw: RecordRefillInput): Promise<ActionResult> {
  const { authorized } = await requireAdmin()
  if (!authorized) return actionError('Forbidden')

  const parsed = recordRefillSchema.safeParse(raw)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Invalid refill data')
  }

  const input = parsed.data
  const supabase = await createServiceClient()

  const { error: refillError } = await supabase.from('refill_events').insert({
    deployed_device_id: input.deployed_device_id,
    material_id: input.material_id,
    amount: input.amount,
  })
  if (refillError) {
    console.error('[recordRefill] insert failed', refillError)
    return actionError('Failed to record refill')
  }

  const level = input.capacity && input.capacity > 0 ? input.capacity : input.amount
  const { error: levelError } = await supabase
    .from('device_consumable_levels')
    .update({
      current_level: level,
      last_refilled_at: new Date().toISOString(),
    })
    .eq('deployed_device_id', input.deployed_device_id)
    .eq('material_id', input.material_id)

  if (levelError) {
    console.error('[recordRefill] level update failed', levelError)
    return actionError('Refill recorded but level update failed')
  }

  revalidatePath('/admin/lease/contracts')
  return { ok: true, data: undefined }
}
