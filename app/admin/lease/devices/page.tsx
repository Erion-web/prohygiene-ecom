import Link from 'next/link'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { createClient } from '@/lib/supabase/server'
import { DeployedDevicesClient } from './DeployedDevicesClient'
import type { DeployedDevice } from '@/types'

export default async function DeployedDevicesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('deployed_devices')
    .select(`
      *,
      client:lease_clients(*),
      contract:lease_contracts(*),
      product:products(id, name_sq, sku),
      consumable_levels:device_consumable_levels(*, material:materials(*))
    `)
    .order('installed_at', { ascending: false })

  return (
    <div>
      <AdminHeader
        title="Pajisjet"
        subtitle="Pajisjet te klientët në lokacion"
        actions={
          <Link href="/admin/products?listing=lease" className="btn-secondary text-xs py-1.5 px-3">
            Katalogu
          </Link>
        }
      />
      <div className="admin-page">
        <DeployedDevicesClient initialDevices={(data as DeployedDevice[]) ?? []} />
      </div>
    </div>
  )
}
