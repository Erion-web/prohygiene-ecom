import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { CustomersClient } from './CustomersClient'
import type { LeaseClient, Profile } from '@/types'

export default async function CustomersAdminPage() {
  const supabase = await createClient()
  const [customersRes, leaseRes, ordersRes, addressesRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('lease_clients').select('*, addresses:lease_client_addresses(*)').order('company_name'),
    supabase.from('orders').select('id, order_number, total, status, created_at, customer_email, customer_name, customer_phone, customer_type, city, address').order('created_at', { ascending: false }).limit(500),
    supabase.from('user_addresses').select('user_id, label, city, address, is_primary').order('is_primary', { ascending: false }),
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
            customer_name: o.customer_name,
            customer_phone: o.customer_phone,
            customer_type: o.customer_type,
            city: o.city,
            address: o.address,
          }))}
          userAddresses={(addressesRes.data ?? []).map(a => ({
            user_id: a.user_id,
            label: a.label,
            city: a.city,
            address: a.address,
            is_primary: a.is_primary,
          }))}
        />
      </div>
    </div>
  )
}
