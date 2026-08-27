import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { BannersClient } from './BannersClient'

export default async function BannersAdminPage() {
  const supabase = await createClient()
  const [{ data: banners }, { data: campaigns }] = await Promise.all([
    supabase
      .from('banners')
      .select('*, campaign:campaigns(id, slug, title_sq)')
      .order('sort_order', { ascending: true }),
    supabase
      .from('campaigns')
      .select('id, title_sq, slug, is_active, ends_at')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div>
      <AdminHeader
        title="Banerat"
        subtitle="Ngarko dhe menaxho imazhet e karuselit — lidhi me kampanjë për faqe automatike"
      />
      <div className="admin-page max-w-4xl">
        <BannersClient banners={banners ?? []} campaigns={campaigns ?? []} />
      </div>
    </div>
  )
}
