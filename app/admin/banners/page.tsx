import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { BannersClient } from './BannersClient'

export default async function BannersAdminPage() {
  const supabase = await createClient()
  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div>
      <AdminHeader
        title="Banerat"
        subtitle="Ngarko dhe menaxho imazhet e karuselit në faqen kryesore"
      />
      <div className="p-6 max-w-4xl">
        <BannersClient banners={banners ?? []} />
      </div>
    </div>
  )
}
