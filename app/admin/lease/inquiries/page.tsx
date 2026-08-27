import { AdminHeader } from '@/components/admin/AdminHeader'
import { createClient } from '@/lib/supabase/server'
import { LeaseInquiriesClient } from './LeaseInquiriesClient'
import type { LeaseInquiry } from '@/types'

export default async function LeaseInquiriesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lease_inquiries')
    .select('*, product:products(id, name_sq, slug)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <AdminHeader title="Kërkesat për Shfrytëzim" subtitle="Formularët nga web-i" />
      <div className="admin-page">
        <LeaseInquiriesClient initialInquiries={(data as LeaseInquiry[]) ?? []} />
      </div>
    </div>
  )
}
