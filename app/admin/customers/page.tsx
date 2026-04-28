import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { CustomersClient } from './CustomersClient'

export default async function CustomersAdminPage() {
  const supabase = await createClient()
  const { data: customers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <AdminHeader title="Klientët" subtitle={`${customers?.length ?? 0} klientë`} />
      <div className="p-6">
        <CustomersClient customers={customers ?? []} />
      </div>
    </div>
  )
}
