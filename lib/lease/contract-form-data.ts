import { createClient, createServiceClient } from '@/lib/supabase/server'
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
  nextContractNumber: number
}> {
  const supabase = await createClient()
  const materialsDb = process.env.SUPABASE_SERVICE_ROLE_KEY ? await createServiceClient() : supabase
  const [clientsRes, productsRes, materials, addressesRes, numbersRes] = await Promise.all([
    supabase.from('lease_clients').select('id, company_name, city, address').order('company_name'),
    supabase
      .from('products')
      .select(LEASE_DEVICE_QUERY)
      .eq('available_for_lease', true)
      .eq('is_active', true)
      .order('name_sq'),
    listMaterialProductOptions(materialsDb),
    supabase.from('lease_client_addresses').select('*'),
    supabase.from('lease_contracts').select('contract_number').order('contract_number', { ascending: false }).limit(1),
  ])

  const addressesByClient = new Map<string, LeaseClientAddress[]>()
  for (const address of (addressesRes.data ?? []) as LeaseClientAddress[]) {
    const list = addressesByClient.get(address.client_id) ?? []
    list.push(address)
    addressesByClient.set(address.client_id, list)
  }

  return {
    clients: (clientsRes.data ?? []).map(client => ({
      ...client,
      addresses: addressesByClient.get(client.id) ?? [],
    })),
    leaseDevices: toLeaseDeviceOptions((productsRes.data ?? []) as import('@/lib/lease/device-select').LeaseDeviceRow[]),
    materials,
    nextContractNumber: (numbersRes.data?.[0]?.contract_number ?? 0) + 1,
  }
}

export async function loadContract(id: string): Promise<LeaseContract | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lease_contracts')
    .select(`
      *,
      client:lease_clients(*),
      contract_devices(*, product:products(id, name_sq, sku, price)),
      contract_materials(*, material:materials(id, name_sq, unit))
    `)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  const contract = data as LeaseContract
  if (contract.client) {
    const { data: addresses } = await supabase
      .from('lease_client_addresses')
      .select('*')
      .eq('client_id', contract.client_id)
    contract.client.addresses = addresses ?? []
  }

  return contract
}
