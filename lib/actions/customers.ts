'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createServiceClient } from '@/lib/supabase/server'
import { actionError, type ActionResult } from '@/lib/actions/types'

export async function enableLeaseClientAction(profileId: string): Promise<ActionResult<{ id: string }>> {
  const { authorized } = await requireAdmin()
  if (!authorized) return actionError('Forbidden')

  const supabase = await createServiceClient()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, city, address, business_name')
    .eq('id', profileId)
    .single()

  if (profileError || !profile) {
    return actionError('Profile not found')
  }

  const { data: existingByProfile } = await supabase
    .from('lease_clients')
    .select('id, profile_id')
    .eq('profile_id', profileId)
    .maybeSingle()

  const { data: existingByEmail } = existingByProfile
    ? { data: null }
    : await supabase
        .from('lease_clients')
        .select('id, profile_id')
        .ilike('email', profile.email)
        .maybeSingle()

  const existing = existingByProfile ?? existingByEmail

  if (existing) {
    if (!existing.profile_id) {
      const { error } = await supabase
        .from('lease_clients')
        .update({ profile_id: profileId })
        .eq('id', existing.id)
      if (error) return actionError('Failed to link lease client')
    }
    revalidatePath('/admin/customers')
    return { ok: true, data: { id: existing.id } }
  }

  const { data: created, error } = await supabase
    .from('lease_clients')
    .insert({
      profile_id: profileId,
      company_name: profile.business_name || profile.full_name || profile.email,
      contact_name: profile.full_name || profile.email,
      email: profile.email,
      phone: profile.phone,
      city: profile.city,
      address: profile.address,
      employee_count: 0,
      payment_status: 'paid',
    })
    .select('id')
    .single()

  if (error || !created) {
    console.error('[enableLeaseClient] insert failed', error)
    return actionError('Failed to create lease client')
  }

  if (profile.city || profile.address) {
    const { error: addressError } = await supabase.from('lease_client_addresses').insert({
      client_id: created.id,
      label: 'Kryesore',
      city: profile.city || 'Prishtinë',
      address: profile.address || '',
      is_primary: true,
    })
    if (addressError) {
      console.error('[enableLeaseClient] address insert failed', addressError)
      return actionError('Lease client created but address failed')
    }
  }

  revalidatePath('/admin/customers')
  return { ok: true, data: { id: created.id } }
}

export async function disableLeaseClientAction(leaseId: string): Promise<ActionResult> {
  const { authorized } = await requireAdmin()
  if (!authorized) return actionError('Forbidden')

  const supabase = await createServiceClient()
  const { count } = await supabase
    .from('lease_contracts')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', leaseId)

  if ((count ?? 0) > 0) {
    return actionError('Ky klient ka kontrata. Hiq kontrata para se ta çaktivizosh.')
  }

  const { error } = await supabase.from('lease_clients').delete().eq('id', leaseId)
  if (error) {
    console.error('[disableLeaseClient] delete failed', error)
    return actionError('Failed to remove lease client')
  }

  revalidatePath('/admin/customers')
  return { ok: true, data: undefined }
}
