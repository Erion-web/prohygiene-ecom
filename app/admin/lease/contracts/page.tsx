import { AdminHeader } from '@/components/admin/AdminHeader'
import { createClient } from '@/lib/supabase/server'
import { LeaseContractsClient } from './LeaseContractsClient'
import type { LeaseContract } from '@/types'

export default async function LeaseContractsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lease_contracts')
    .select(`
      *,
      client:lease_clients(*),
      contract_devices(*, product:products(id, name_sq, sku)),
      contract_materials(*, material:materials(id, name_sq, unit))
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <AdminHeader title="Kontratat" subtitle="Marrëveshjet me klientët shfrytëzues" />
      <div className="admin-page">
        <LeaseContractsClient initialContracts={(data as LeaseContract[]) ?? []} />
      </div>
    </div>
  )
}
