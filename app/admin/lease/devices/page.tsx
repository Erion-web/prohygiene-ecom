import { AdminHeader } from '@/components/admin/AdminHeader'
import { createClient } from '@/lib/supabase/server'
import { DeployedDevicesClient } from './DeployedDevicesClient'
import { LeaseDevicesCatalog } from './LeaseDevicesCatalog'
import { LEASE_DEVICE_QUERY } from '@/lib/lease/device-select'
import type { DeployedDevice } from '@/types'

export default async function DeployedDevicesPage() {
  const supabase = await createClient()
  const [devicesRes, productsRes, materialsRes] = await Promise.all([
    supabase
      .from('deployed_devices')
      .select(`
        *,
        client:lease_clients(*),
        contract:lease_contracts(*),
        product:products(id, name_sq, sku),
        consumable_levels:device_consumable_levels(*, material:materials(*))
      `)
      .order('installed_at', { ascending: false }),
    supabase
      .from('products')
      .select(LEASE_DEVICE_QUERY)
      .eq('available_for_lease', true)
      .eq('is_active', true)
      .order('name_sq'),
    supabase.from('materials').select('id, name_sq, unit').eq('is_active', true),
  ])

  return (
    <div>
      <AdminHeader title="Pajisjet" subtitle="Katalogu dhe pajisjet te klientët" />
      <div className="p-4 space-y-4">
        <LeaseDevicesCatalog devices={productsRes.data ?? []} />
        <DeployedDevicesClient
          initialDevices={(devicesRes.data as DeployedDevice[]) ?? []}
          materials={materialsRes.data ?? []}
        />
      </div>
    </div>
  )
}
