'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Edit, Package, AlertTriangle, Search, X, Star, Tag, TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { DeleteProductButton } from './DeleteProductButton'
import { formatPrice } from '@/lib/utils'
import type { Product, Category, Brand } from '@/types'

type ProductRow = Product & {
  category?: { name_sq: string } | null
  brand?: { name: string } | null
}

interface Props {
  products: ProductRow[]
  categories: Pick<Category, 'id' | 'name_sq'>[]
  brands: Pick<Brand, 'id' | 'name'>[]
}

const AUDIENCE_LABELS: Record<string, string> = {
  home: '🏠 Shtëpi',
  business: '🏢 Biznes',
  both: '👥 Të Gjithë',
}

export function ProductsClient({ products, categories, brands }: Props) {
  const [search, setSearch]           = useState('')
  const [categoryId, setCategoryId]   = useState('')
  const [brandId, setBrandId]         = useState('')
  const [audience, setAudience]       = useState('')
  const [status, setStatus]           = useState('')
  const [stock, setStock]             = useState('')
  const [onSale, setOnSale]           = useState(false)
  const [featured, setFeatured]       = useState(false)
  const [bestSeller, setBestSeller]   = useState(false)

  const hasFilters = search || categoryId || brandId || audience || status || stock || onSale || featured || bestSeller

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter(p => {
      if (q && !p.name_sq.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !(p.name_en ?? '').toLowerCase().includes(q)) return false
      if (categoryId && p.category_id !== categoryId) return false
      if (brandId && p.brand_id !== brandId) return false
      if (audience && p.audience_type !== audience) return false
      if (status === 'active' && !p.is_active) return false
      if (status === 'inactive' && p.is_active) return false
      if (stock === 'in' && p.stock <= 0) return false
      if (stock === 'out' && p.stock !== 0) return false
      if (stock === 'low' && (p.stock <= 0 || p.stock > 10)) return false
      if (onSale && !p.sale_price) return false
      if (featured && !p.is_featured) return false
      if (bestSeller && !p.is_best_seller) return false
      return true
    })
  }, [products, search, categoryId, brandId, audience, status, stock, onSale, featured, bestSeller])

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.is_active).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    onSale: products.filter(p => !!p.sale_price).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
  }), [products])

  const clearAll = () => {
    setSearch(''); setCategoryId(''); setBrandId(''); setAudience('')
    setStatus(''); setStock(''); setOnSale(false); setFeatured(false); setBestSeller(false)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Gjithsej', value: stats.total, color: 'text-text-primary' },
          { label: 'Aktive', value: stats.active, color: 'text-emerald-600' },
          { label: 'Pa Gjendje', value: stats.outOfStock, color: 'text-red-500' },
          { label: 'Gjendje e Ulët', value: stats.lowStock, color: 'text-amber-500' },
          { label: 'Me Zbritje', value: stats.onSale, color: 'text-brand-600' },
        ].map(s => (
          <div key={s.label} className="admin-card p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="admin-card p-4 space-y-3">
        {/* Row 1: search + dropdowns */}
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Kërko sipas emrit ose SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9 text-sm w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category */}
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input text-sm min-w-[140px]">
            <option value="">Të gjitha kategoritë</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name_sq}</option>)}
          </select>

          {/* Brand */}
          {brands.length > 0 && (
            <select value={brandId} onChange={e => setBrandId(e.target.value)} className="input text-sm min-w-[130px]">
              <option value="">Të gjitha brendet</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}

          {/* Audience */}
          <select value={audience} onChange={e => setAudience(e.target.value)} className="input text-sm min-w-[130px]">
            <option value="">Të gjitha audiencat</option>
            <option value="home">🏠 Shtëpi</option>
            <option value="business">🏢 Biznes</option>
            <option value="both">👥 Të Gjithë</option>
          </select>

          {/* Status */}
          <select value={status} onChange={e => setStatus(e.target.value)} className="input text-sm min-w-[120px]">
            <option value="">Të gjitha statuset</option>
            <option value="active">✅ Aktive</option>
            <option value="inactive">⛔ Joaktive</option>
          </select>

          {/* Stock */}
          <select value={stock} onChange={e => setStock(e.target.value)} className="input text-sm min-w-[140px]">
            <option value="">Të gjitha gjendje</option>
            <option value="in">✅ Në gjendje</option>
            <option value="low">⚠️ Gjendje e ulët</option>
            <option value="out">❌ Pa gjendje</option>
          </select>
        </div>

        {/* Row 2: quick chips + clear */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-muted font-medium">Shpejt:</span>

          {([
            { label: '⭐ I Zgjedhur', state: featured, set: setFeatured },
            { label: '🔥 Best Seller', state: bestSeller, set: setBestSeller },
            { label: '🏷️ Me Zbritje', state: onSale, set: setOnSale },
          ] as const).map(({ label, state, set }) => (
            <button
              key={label}
              onClick={() => set(!state)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                state
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-text-secondary border-surface-border hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-text-muted">
              {hasFilters
                ? <><span className="font-bold text-text-primary">{filtered.length}</span> / {products.length} produkte</>
                : <><span className="font-bold text-text-primary">{products.length}</span> produkte</>
              }
            </span>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X size={12} /> Pastro filtrat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr className="bg-surface-soft border-b border-surface-border">
                <th className="text-left w-12">Foto</th>
                <th className="text-left">Produkti</th>
                <th className="text-left">Kategoria</th>
                <th className="text-left">Brendi</th>
                <th className="text-left">Çmimi</th>
                <th className="text-left">Stoku</th>
                <th className="text-left">Audienca</th>
                <th className="text-left">Statusi</th>
                <th className="text-right">Veprime</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
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
                    {product.category?.name_sq ?? <span className="text-text-muted">—</span>}
                  </td>
                  <td className="text-sm text-text-secondary">
                    {product.brand?.name ?? <span className="text-text-muted">—</span>}
                  </td>
                  <td>
                    <div>
                      <p className="font-semibold text-sm">{formatPrice(product.price)}</p>
                      {product.sale_price && (
                        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                          <Tag size={10} /> {formatPrice(product.sale_price)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {product.stock === 0 ? (
                        <span className="badge badge-danger text-xs">Pa Gjendje</span>
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
                    <Badge
                      variant={product.audience_type === 'home' ? 'brand' : product.audience_type === 'business' ? 'warning' : 'neutral'}
                      size="sm"
                    >
                      {AUDIENCE_LABELS[product.audience_type]}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span className={`badge border text-xs ${product.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {product.is_active ? 'Aktiv' : 'Joaktiv'}
                      </span>
                      {product.is_featured && <span title="I Zgjedhur"><Star size={12} className="text-amber-500 flex-shrink-0" fill="currentColor" /></span>}
                      {product.is_best_seller && <span title="Best Seller"><TrendingUp size={12} className="text-brand-500 flex-shrink-0" /></span>}
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

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-text-muted">
                    <Package size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium">
                      {hasFilters ? 'Asnjë produkt nuk përputhet me filtrat' : 'Nuk ka produkte ende'}
                    </p>
                    {hasFilters && (
                      <button onClick={clearAll} className="mt-2 text-sm text-brand-600 hover:underline">
                        Pastro filtrat
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
