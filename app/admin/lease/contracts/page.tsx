import { AdminHeader } from '@/components/admin/AdminHeader'
import { createClient } from '@/lib/supabase/server'
import { LeaseContractsClient } from './LeaseContractsClient'
import type { LeaseContract } from '@/types'

export default async function LeaseContractsPage() {
  const supabase = await createClient()
  const [contractsRes, clientsRes, productsRes, materialsRes] = await Promise.all([
    supabase
      .from('lease_contracts')
      .select(`
        *,
        client:lease_clients(*),
        contract_devices(*, product:products(id, name_sq, sku)),
        contract_materials(*, material:materials(id, name_sq, unit))
      `)
      .order('created_at', { ascending: false }),
    supabase.from('lease_clients').select('id, company_name').order('company_name'),
    supabase.from('products').select('id, name_sq, sku').eq('listing_type', 'lease').eq('is_active', true).order('name_sq'),
    supabase.from('materials').select('id, name_sq, unit').eq('is_active', true).order('name_sq'),
  ])

  return (
    <div>
      <AdminHeader title="Kontratat" subtitle="Kohëzgjatja, pajisjet dhe konsumi i pritur" />
      <div className="p-4">
        <LeaseContractsClient
          initialContracts={(contractsRes.data as LeaseContract[]) ?? []}
          clients={clientsRes.data ?? []}
          products={productsRes.data ?? []}
          materials={materialsRes.data ?? []}
        />
      </div>
    </div>
  )
}
