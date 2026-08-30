import type { SupabaseClient } from '@supabase/supabase-js'

function samePlace(a: { city?: string | null; address?: string | null }, city: string, address: string) {
  return (a.city ?? '').trim().toLowerCase() === city.toLowerCase()
    && (a.address ?? '').trim().toLowerCase() === address.toLowerCase()
}

export async function saveCustomerAddressFromOrder(
  supabase: SupabaseClient,
  order: {
    user_id?: string | null
    customer_email?: string | null
    customer_name?: string | null
    customer_phone?: string | null
    city?: string | null
    address?: string | null
  }
) {
  const city = (order.city ?? '').trim()
  const address = (order.address ?? '').trim()
  if (!city || !address) return

  const profileId = order.user_id ?? null
  if (!profileId) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('city, address')
    .eq('id', profileId)
    .maybeSingle()

  await supabase.from('profiles').update({
    city: (profile?.city ?? '').trim() || city,
    address: (profile?.address ?? '').trim() || address,
  }).eq('id', profileId)

  const { data: existing } = await supabase
    .from('user_addresses')
    .select('id, city, address')
    .eq('user_id', profileId)

  if (!(existing ?? []).some(row => samePlace(row, city, address))) {
    await supabase.from('user_addresses').insert({
      user_id: profileId,
      label: (existing ?? []).length === 0 ? 'Kryesore' : `Adresa ${(existing?.length ?? 0) + 1}`,
      full_name: (order.customer_name ?? '').trim() || 'Klient',
      phone: order.customer_phone?.trim() || null,
      city,
      address,
      is_primary: (existing ?? []).length === 0,
    })
  }

  const { data: lease } = await supabase
    .from('lease_clients')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (!lease) return

  await supabase.from('lease_clients').update({ city, address }).eq('id', lease.id)

  const { data: leaseAddresses } = await supabase
    .from('lease_client_addresses')
    .select('id, city, address')
    .eq('client_id', lease.id)

  if (!(leaseAddresses ?? []).some(row => samePlace(row, city, address))) {
    await supabase.from('lease_client_addresses').insert({
      client_id: lease.id,
      label: (leaseAddresses ?? []).length === 0 ? 'Kryesore' : `Adresa ${(leaseAddresses?.length ?? 0) + 1}`,
      city,
      address,
      is_primary: (leaseAddresses ?? []).length === 0,
    })
  }
}
