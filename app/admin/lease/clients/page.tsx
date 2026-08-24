import { AdminHeader } from '@/components/admin/AdminHeader'
import { createClient } from '@/lib/supabase/server'
import { LeaseClientsClient } from './LeaseClientsClient'
import type { LeaseClient } from '@/types'

export default async function LeaseClientsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lease_clients')
    .select('*')
    .order('company_name')

  return (
    <div>
      <AdminHeader title="Klientët e Shfrytëzimit" subtitle="Kompanitë me kontrata pajisjesh" />
      <div className="p-6 pt-0">
        <LeaseClientsClient initialClients={(data as LeaseClient[]) ?? []} />
      </div>
    </div>
  )
}
