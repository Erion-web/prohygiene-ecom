import { AdminHeader } from '@/components/admin/AdminHeader'
import { createClient } from '@/lib/supabase/server'
import { LeaseDashboardClient } from './LeaseDashboardClient'
import type { DeployedDevice, LeaseClient, LeaseContract, LeaseInquiry, LeaseNotification } from '@/types'

async function getDashboardData() {
  const supabase = await createClient()

  const [
    contractsRes,
    deployedRes,
    clientsRes,
    inquiriesRes,
    notificationsRes,
  ] = await Promise.all([
    supabase.from('lease_contracts').select('*, client:lease_clients(*)'),
    supabase
      .from('deployed_devices')
      .select(`
        *,
        client:lease_clients(*),
        contract:lease_contracts(*),
        product:products(name_sq),
        consumable_levels:device_consumable_levels(*, material:materials(name_sq, unit))
      `)
      .eq('status', 'active'),
    supabase.from('lease_clients').select('*'),
    supabase.from('lease_inquiries').select('*').order('created_at', { ascending: false }).limit(50),
    supabase
      .from('lease_notifications')
      .select('*, client:lease_clients(company_name)')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  return {
    contracts: (contractsRes.data as LeaseContract[]) ?? [],
    deployedDevices: (deployedRes.data as DeployedDevice[]) ?? [],
    clients: (clientsRes.data as LeaseClient[]) ?? [],
    inquiries: (inquiriesRes.data as LeaseInquiry[]) ?? [],
    notifications: (notificationsRes.data as LeaseNotification[]) ?? [],
  }
}

export default async function LeaseDashboardPage() {
  const data = await getDashboardData()

  return (
    <div>
      <AdminHeader title="Shfrytëzimi" subtitle="ROI operacional dhe njoftime" />
      <div className="p-4">
        <LeaseDashboardClient {...data} />
      </div>
    </div>
  )
}
