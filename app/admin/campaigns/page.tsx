import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { CampaignsClient } from './CampaignsClient'

export default async function CampaignsAdminPage() {
  const supabase = await createClient()

  const [campaignsRes, productsRes] = await Promise.all([
    supabase
      .from('campaigns')
      .select('*, campaign_products(product_id)')
      .order('created_at', { ascending: false }),
    supabase.from('products').select('id, name_sq, sku').eq('is_active', true).order('name_sq'),
  ])

  return (
    <div>
      <AdminHeader title="Kampanjat & Zbritjet" subtitle={`${campaignsRes.data?.length ?? 0} kampanja`} />
      <div className="p-4">
        <CampaignsClient
          initialCampaigns={campaignsRes.data ?? []}
          products={productsRes.data ?? []}
        />
      </div>
    </div>
  )
}
