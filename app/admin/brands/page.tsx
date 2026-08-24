import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil, Award } from 'lucide-react'
import { DeleteBrandButton } from './DeleteBrandButton'

export default async function BrandsPage() {
  const supabase = await createClient()
  const { data: brands } = await supabase
    .from('brands')
    .select('*, products(count)')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  return (
    <div className="p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-text-primary">Brendet</h1>
          <p className="text-text-muted text-sm mt-0.5">{brands?.length ?? 0} brende gjithsej</p>
        </div>
        <Link href="/admin/brands/new" className="btn-primary gap-2">
          <Plus size={16} /> Shto Brend
        </Link>
      </div>

      {!brands || brands.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <Award size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">Nuk ka brende ende</p>
          <p className="text-text-muted text-sm mt-1">Shto brendin e parë të produkteve tuaja</p>
          <Link href="/admin/brands/new" className="btn-primary mt-4 inline-flex gap-2">
            <Plus size={14} /> Shto Brend
          </Link>
        </div>
      ) : (
        <div className="admin-card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border bg-surface-soft">
                <th className="text-left text-xs font-semibold text-text-secondary px-5 py-3">Emri</th>
                <th className="text-left text-xs font-semibold text-text-secondary px-5 py-3">Slug</th>
                <th className="text-left text-xs font-semibold text-text-secondary px-5 py-3">Produkte</th>
                <th className="text-left text-xs font-semibold text-text-secondary px-5 py-3">Statusi</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => {
                const count = (brand.products as unknown as { count: number }[])?.[0]?.count ?? 0
                return (
                  <tr key={brand.id} className="border-b border-surface-border/50 hover:bg-surface-soft">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {brand.logo_url ? (
                          <img src={brand.logo_url} alt={brand.name} className="w-8 h-8 object-contain rounded" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-brand-50 flex items-center justify-center">
                            <Award size={14} className="text-brand-500" />
                          </div>
                        )}
                        <span className="font-semibold text-text-primary text-sm">{brand.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-text-muted">{brand.slug}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-text-secondary">{count}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${brand.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-muted text-text-muted'}`}>
                        {brand.is_active ? 'Aktiv' : 'Joaktiv'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/brands/${brand.id}/edit`}
                          className="p-1.5 rounded-lg text-text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </Link>
                        <DeleteBrandButton id={brand.id} name={brand.name} productCount={count} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
