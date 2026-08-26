import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { CustomersClient } from './CustomersClient'
import type { LeaseClient, Profile } from '@/types'

export default async function CustomersAdminPage() {
  const supabase = await createClient()
  const [customersRes, leaseRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('lease_clients').select('*, addresses:lease_client_addresses(*)').order('company_name'),
  ])

  return (
    <div>
      <AdminHeader title="Klientët" subtitle={`${customersRes.data?.length ?? 0} klientë`} />
      <div className="p-4">
        <CustomersClient
          customers={(customersRes.data as Profile[]) ?? []}
          leaseClients={(leaseRes.data as LeaseClient[]) ?? []}
        />
      </div>
    </div>
  )
}
