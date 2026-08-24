import { AdminHeader } from '@/components/admin/AdminHeader'
import { createClient } from '@/lib/supabase/server'
import { DeployedDevicesClient } from './DeployedDevicesClient'
import type { DeployedDevice } from '@/types'

export default async function DeployedDevicesPage() {
  const supabase = await createClient()
  const [devicesRes, contractsRes, clientsRes, productsRes, materialsRes] = await Promise.all([
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
    supabase.from('lease_contracts').select('id, client_id, status').eq('status', 'active'),
    supabase.from('lease_clients').select('id, company_name').order('company_name'),
    supabase.from('products').select('id, name_sq, sku').eq('listing_type', 'lease').eq('is_active', true),
    supabase.from('materials').select('id, name_sq, unit').eq('is_active', true),
  ])

  return (
    <div>
      <AdminHeader title="Pajisjet e Instaluara" subtitle="Lokacionet dhe nivelet e lëndëve" />
      <div className="p-6 pt-0">
        <DeployedDevicesClient
          initialDevices={(devicesRes.data as DeployedDevice[]) ?? []}
          contracts={contractsRes.data ?? []}
          clients={clientsRes.data ?? []}
          products={productsRes.data ?? []}
          materials={materialsRes.data ?? []}
        />
      </div>
    </div>
  )
}
