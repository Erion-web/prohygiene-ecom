import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { formatPrice, statusColor } from '@/lib/utils'
import { Plus, Upload, Edit, Trash2, Star, Package, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { DeleteProductButton } from './DeleteProductButton'

async function getProducts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(name_sq)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function ProductsAdminPage() {
  const products = await getProducts()

  return (
    <div>
      <AdminHeader
        title="Produktet"
        subtitle={`${products.length} produkte gjithsej`}
        actions={
          <div className="flex gap-2">
            <Link href="/admin/products/import" className="btn-secondary gap-2 text-sm py-2">
              <Upload size={15} />
              <span className="hidden sm:inline">Importo</span>
            </Link>
            <Link href="/admin/products/new" className="btn-primary gap-2 text-sm py-2">
              <Plus size={15} />
              <span className="hidden sm:inline">Shto Produkt</span>
            </Link>
          </div>
        }
      />

      <div className="p-6">
        <div className="admin-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full admin-table">
              <thead>
                <tr className="bg-surface-soft border-b border-surface-border">
                  <th className="text-left w-12">Foto</th>
                  <th className="text-left">Produkti</th>
                  <th className="text-left">Kategoria</th>
                  <th className="text-left">Çmimi</th>
                  <th className="text-left">Stoku</th>
                  <th className="text-left">Audienca</th>
                  <th className="text-left">Statusi</th>
                  <th className="text-right">Veprime</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-surface-soft transition-colors">
                    <td>
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-muted flex-shrink-0">
                        {product.image_url ? (
                          <Image src={product.image_url} alt="" fill className="object-cover" sizes="40px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-lg">🧴</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-semibold text-text-primary text-sm">{product.name_sq}</p>
                        <p className="text-text-muted text-xs font-mono">{product.sku}</p>
                      </div>
                    </td>
                    <td className="text-sm text-text-secondary">
                      {product.category?.name_sq ?? '—'}
                    </td>
                    <td>
                      <div>
                        <p className="font-semibold text-sm">{formatPrice(product.price)}</p>
                        {product.sale_price && (
                          <p className="text-xs text-red-500 font-medium">{formatPrice(product.sale_price)}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {product.stock === 0 ? (
                          <span className="badge badge-danger">Pa Gjendje</span>
                        ) : product.stock <= 10 ? (
                          <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
                            <AlertTriangle size={12} /> {product.stock}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-text-primary">{product.stock}</span>
                        )}
                        <span className="text-xs text-text-muted">{product.unit}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={product.audience_type === 'home' ? 'brand' : product.audience_type === 'business' ? 'warning' : 'neutral'} size="sm">
                        {product.audience_type === 'home' ? '🏠 Shtëpi' : product.audience_type === 'business' ? '🏢 Biznes' : '👥 Të Gjithë'}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`badge border text-xs ${product.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {product.is_active ? 'Aktiv' : 'Joaktiv'}
                        </span>
                        {product.is_featured && <Star size={12} className="text-amber-500" fill="currentColor" />}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="p-1.5 text-text-muted hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all duration-200"
                          title="Modifiko"
                        >
                          <Edit size={15} />
                        </Link>
                        <DeleteProductButton productId={product.id} productName={product.name_sq} />
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-text-muted">
                      <Package size={32} className="mx-auto mb-3 opacity-40" />
                      <p>Nuk ka produkte ende</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
