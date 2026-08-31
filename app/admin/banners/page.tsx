import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { BannersClient } from './BannersClient'
import { PackagesClient } from './PackagesClient'
import type { HomepagePackage } from '@/types'

export default async function BannersAdminPage() {
  const supabase = await createClient()
  const [{ data: banners }, { data: campaigns }, packagesRes] = await Promise.all([
    supabase
      .from('banners')
      .select('*, campaign:campaigns(id, slug, title_sq)')
      .order('sort_order', { ascending: true }),
    supabase
      .from('campaigns')
      .select('id, title_sq, slug, is_active, ends_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('homepage_packages')
      .select('id, audience, image_url, is_active, created_at'),
  ])

  return (
    <div>
      <AdminHeader
        title="Banerat"
        subtitle="Karuseli i faqes kryesore dhe imazhet e paketave"
      />
      <div className="admin-page max-w-4xl space-y-10">
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">Karuseli</h2>
            <p className="text-xs text-text-muted mt-0.5">Ngarko imazhet e karuselit dhe lidhi me një kampanjë.</p>
          </div>
          <BannersClient banners={banners ?? []} campaigns={campaigns ?? []} />
        </div>
        <div className="h-px bg-surface-border" />
        <PackagesClient packages={((packagesRes.error ? [] : packagesRes.data) ?? []) as HomepagePackage[]} />
      </div>
    </div>
  )
}
