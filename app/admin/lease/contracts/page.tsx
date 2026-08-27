import { AdminHeader } from '@/components/admin/AdminHeader'
import { createClient } from '@/lib/supabase/server'
import { LeaseContractsClient } from './LeaseContractsClient'
import { LEASE_DEVICE_QUERY, toLeaseDeviceOptions } from '@/lib/lease/device-select'
import { listMaterialProductOptions } from '@/lib/lease/sync-material'
import type { LeaseContract } from '@/types'

export default async function LeaseContractsPage() {
  const supabase = await createClient()
  const [contractsRes, clientsRes, productsRes, materialsRes] = await Promise.all([
    supabase
      .from('lease_contracts')
      .select(`
        *,
        client:lease_clients(*),
        contract_devices(*, product:products(id, name_sq, sku)),
        contract_materials(*, material:materials(id, name_sq, unit))
      `)
      .order('created_at', { ascending: false }),
    supabase.from('lease_clients').select('id, company_name, city, address, addresses:lease_client_addresses(*)').order('company_name'),
    supabase
      .from('products')
      .select(LEASE_DEVICE_QUERY)
      .eq('available_for_lease', true)
      .eq('is_active', true)
      .order('name_sq'),
    listMaterialProductOptions(supabase),
  ])

  return (
    <div>
      <AdminHeader title="Kontratat" subtitle="Marrëveshjet me klientët shfrytëzues" />
      <div className="admin-page">
        <LeaseContractsClient
          initialContracts={(contractsRes.data as LeaseContract[]) ?? []}
          clients={clientsRes.data ?? []}
          leaseDevices={toLeaseDeviceOptions((productsRes.data ?? []) as import('@/lib/lease/device-select').LeaseDeviceRow[])}
          materials={materialsRes.data ?? []}
        />
      </div>
    </div>
  )
}
