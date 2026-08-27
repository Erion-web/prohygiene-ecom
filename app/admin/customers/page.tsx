import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { CustomersClient } from './CustomersClient'
import type { LeaseClient, Profile } from '@/types'

export default async function CustomersAdminPage() {
  const supabase = await createClient()
  const [customersRes, leaseRes, ordersRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('lease_clients').select('*, addresses:lease_client_addresses(*)').order('company_name'),
    supabase.from('orders').select('id, order_number, total, status, created_at, customer_email').order('created_at', { ascending: false }).limit(500),
  ])

  return (
    <div>
      <AdminHeader title="Klientët" subtitle={`${customersRes.data?.length ?? 0} klientë`} />
      <div className="admin-page">
        <CustomersClient
          customers={(customersRes.data as Profile[]) ?? []}
          leaseClients={(leaseRes.data as LeaseClient[]) ?? []}
          orders={(ordersRes.data ?? []).map(o => ({
            id: o.id,
            order_number: o.order_number,
            total: o.total,
            status: o.status,
            created_at: o.created_at,
            customer_email: o.customer_email,
          }))}
        />
      </div>
    </div>
  )
}
