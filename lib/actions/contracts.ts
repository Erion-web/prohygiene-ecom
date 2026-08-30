'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createServiceClient } from '@/lib/supabase/server'
import { seedDeployedDevices } from '@/lib/lease/seed-deployed-devices'
import { saveContractSchema, type SaveContractInput } from '@/lib/validation/admin-schemas'
import { actionError, type ActionResult } from '@/lib/actions/types'

export async function saveContractAction(raw: SaveContractInput): Promise<ActionResult<{ id: string }>> {
  const { authorized } = await requireAdmin()
  if (!authorized) return actionError('Forbidden')

  const parsed = saveContractSchema.safeParse(raw)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Invalid contract data')
  }

  const input = parsed.data
  const supabase = await createServiceClient()

  const payload = {
    ...(input.id && input.contract_number != null ? { contract_number: input.contract_number } : {}),
    client_id: input.client_id,
    duration_months: input.duration_months,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
    device_count: input.device_count,
    employee_count: input.employee_count,
    monthly_fee: input.monthly_fee,
    reminder_period: input.reminder_period,
    surplus_days: input.surplus_days,
    expected_consumption: input.expected_consumption,
    consumption_unit: input.consumption_unit,
    consumption_period: input.consumption_period,
    status: input.status,
    notes: input.notes?.trim() || null,
  }

  let contractId = input.id
  if (contractId) {
    const { error } = await supabase.from('lease_contracts').update(payload).eq('id', contractId)
    if (error) {
      console.error('[saveContract] update failed', error)
      return actionError('Failed to save contract')
    }
  } else {
    const { data, error } = await supabase.from('lease_contracts').insert(payload).select('id').single()
    if (error || !data) {
      console.error('[saveContract] insert failed', error)
      return actionError('Failed to save contract')
    }
    contractId = data.id
  }

  if (!contractId) return actionError('Failed to save contract')

  const { error: deleteDevicesError } = await supabase.from('contract_devices').delete().eq('contract_id', contractId)
  if (deleteDevicesError) {
    console.error('[saveContract] contract_devices delete failed', deleteDevicesError)
    return actionError('Failed to save contract devices')
  }

  const { error: deleteMaterialsError } = await supabase.from('contract_materials').delete().eq('contract_id', contractId)
  if (deleteMaterialsError) {
    console.error('[saveContract] contract_materials delete failed', deleteMaterialsError)
    return actionError('Failed to save contract materials')
  }

  if (input.devices.length > 0) {
    const { error: devicesError } = await supabase.from('contract_devices').insert(
      input.devices.map(row => ({
        contract_id: contractId,
        product_id: row.product_id,
        quantity: row.quantity,
      }))
    )
    if (devicesError) {
      console.error('[saveContract] contract_devices insert failed', devicesError)
      return actionError('Failed to save contract devices')
    }

    const seedErr = await seedDeployedDevices(supabase, {
      contractId,
      clientId: input.client_id,
      startsAt: input.starts_at,
      devices: input.devices.map(row => ({
        product_id: row.product_id,
        quantity: String(row.quantity),
        location: row.location,
        city: row.city,
        address: row.address,
      })),
    })
    if (seedErr) {
      console.error('[saveContract] seed deployed devices failed', seedErr)
      return actionError(typeof seedErr === 'string' ? seedErr : 'Failed to deploy devices')
    }
  }

  if (input.materials.length > 0) {
    const { error: materialsError } = await supabase.from('contract_materials').insert(
      input.materials.map(row => ({
        contract_id: contractId,
        material_id: row.material_id,
        quantity: row.quantity,
      }))
    )
    if (materialsError) {
      console.error('[saveContract] contract_materials insert failed', materialsError)
      return actionError('Failed to save contract materials')
    }
  }

  revalidatePath('/admin/lease/contracts')
  revalidatePath(`/admin/lease/contracts/${contractId}/edit`)
  return { ok: true, data: { id: contractId } }
}
