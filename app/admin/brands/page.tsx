import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import Link from 'next/link'
import { Plus, Award } from 'lucide-react'
import { BrandsTable } from './BrandsTable'

export default async function BrandsPage() {
  const supabase = await createClient()
  const { data: brands } = await supabase
    .from('brands')
    .select('*, products(count)')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  const rows = (brands ?? []).map(brand => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logo_url: brand.logo_url,
    is_active: brand.is_active,
    productCount: (brand.products as unknown as { count: number }[])?.[0]?.count ?? 0,
  }))

  return (
    <div>
      <AdminHeader
        title="Brendet"
        subtitle={`${rows.length} brende gjithsej`}
        actions={
          <Link href="/admin/brands/new" className="btn-primary gap-2 text-sm py-2">
            <Plus size={16} /> Shto Brend
          </Link>
        }
      />

      <div className="admin-page">
        {!rows.length ? (
          <div className="admin-card p-12 text-center">
            <Award size={40} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary font-medium">Nuk ka brende ende</p>
            <p className="text-text-muted text-sm mt-1">Shto brendin e parë të produkteve tuaja</p>
            <Link href="/admin/brands/new" className="btn-primary mt-4 inline-flex gap-2">
              <Plus size={14} /> Shto Brend
            </Link>
          </div>
        ) : (
          <BrandsTable brands={rows} />
        )}
      </div>
    </div>
  )
}
