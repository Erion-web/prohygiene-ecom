import { createClient } from '@/lib/supabase/server'
import { LEASE_DEVICE_QUERY, toLeaseDeviceOptions, type LeaseDeviceOption } from '@/lib/lease/device-select'
import { listMaterialProductOptions, type MaterialProductOption } from '@/lib/lease/sync-material'
import type { LeaseClientAddress, LeaseContract } from '@/types'

export interface ContractFormClient {
  id: string
  company_name: string
  city?: string | null
  address?: string | null
  addresses?: LeaseClientAddress[]
}

export async function loadContractFormOptions(): Promise<{
  clients: ContractFormClient[]
  leaseDevices: LeaseDeviceOption[]
  materials: MaterialProductOption[]
}> {
  const supabase = await createClient()
  const [clientsRes, productsRes, materials] = await Promise.all([
    supabase.from('lease_clients').select('id, company_name, city, address, addresses:lease_client_addresses(*)').order('company_name'),
    supabase
      .from('products')
      .select(LEASE_DEVICE_QUERY)
      .eq('available_for_lease', true)
      .eq('is_active', true)
      .order('name_sq'),
    listMaterialProductOptions(supabase),
  ])

  return {
    clients: clientsRes.data ?? [],
    leaseDevices: toLeaseDeviceOptions((productsRes.data ?? []) as import('@/lib/lease/device-select').LeaseDeviceRow[]),
    materials,
  }
}

export async function loadContract(id: string): Promise<LeaseContract | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lease_contracts')
    .select(`
      *,
      client:lease_clients(*),
      contract_devices(*, product:products(id, name_sq, sku)),
      contract_materials(*, material:materials(id, name_sq, unit))
    `)
    .eq('id', id)
    .maybeSingle()

  return (data as LeaseContract | null) ?? null
}
