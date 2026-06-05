'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Edit, Package, AlertTriangle, Search, X, Star, Tag, TrendingUp, ChevronDown } from 'lucide-react'
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

function getScrollEl() {
  return typeof document !== 'undefined' ? document.getElementById('admin-main') : null
}

export function ProductsClient({ products, categories, brands }: Props) {
  // Restore scroll when returning from edit page
  useEffect(() => {
    const saved = sessionStorage.getItem('admin-products-scroll')
    if (!saved) return
    sessionStorage.removeItem('admin-products-scroll')
    const y = parseInt(saved, 10)
    const restore = () => {
      const el = getScrollEl()
      if (el) el.scrollTop = y
      else window.scrollTo(0, y)
    }
    setTimeout(restore, 50)
    setTimeout(restore, 200)
  }, [])

  const [search, setSearch]         = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId]       = useState('')
  const [audience, setAudience]     = useState('')
  const [status, setStatus]         = useState('')
  const [stock, setStock]           = useState('')
  const [onSale, setOnSale]         = useState(false)
  const [featured, setFeatured]     = useState(false)
  const [bestSeller, setBestSeller] = useState(false)

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
    total:      products.length,
    active:     products.filter(p => p.is_active).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    lowStock:   products.filter(p => p.stock > 0 && p.stock <= 10).length,
    onSale:     products.filter(p => !!p.sale_price).length,
  }), [products])

  const clearAll = () => {
    setSearch(''); setCategoryId(''); setBrandId(''); setAudience('')
    setStatus(''); setStock(''); setOnSale(false); setFeatured(false); setBestSeller(false)
  }

  const saveScroll = () => {
    const el = getScrollEl()
    sessionStorage.setItem('admin-products-scroll', String(el ? el.scrollTop : window.scrollY))
  }

  return (
    <div className="p-4 space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-2">
        {([
          { label: 'Gjithsej',       value: stats.total,      color: 'text-gray-900',    active: !hasFilters,         onClick: clearAll },
          { label: 'Aktive',         value: stats.active,     color: 'text-emerald-600', active: status === 'active', onClick: () => setStatus(s => s === 'active' ? '' : 'active') },
          { label: 'Pa Gjendje',     value: stats.outOfStock, color: 'text-red-500',     active: stock === 'out',     onClick: () => setStock(s => s === 'out' ? '' : 'out') },
          { label: 'Gjendje e Ulët', value: stats.lowStock,   color: 'text-amber-500',   active: stock === 'low',     onClick: () => setStock(s => s === 'low' ? '' : 'low') },
          { label: 'Me Zbritje',     value: stats.onSale,     color: 'text-brand-600',   active: onSale,              onClick: () => setOnSale(v => !v) },
        ] as const).map(s => (
          <button
            key={s.label}
            onClick={s.onClick}
            className={`bg-white border rounded-xl px-3 py-2.5 text-center transition-all hover:shadow-sm ${
              s.active ? 'border-brand-400 ring-1 ring-brand-300 bg-brand-50/30' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <p className={`text-xl font-black tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-none">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-2.5">
        {/* Row 1 */}
        <div className="flex gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Emri ose SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400 bg-gray-50/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Dropdowns */}
          <div className="relative">
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className={`appearance-none pl-2.5 pr-6 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-400 cursor-pointer ${categoryId ? 'border-brand-400 bg-brand-50 text-brand-700 font-semibold' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
              <option value="">Kategoria</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name_sq}</option>)}
            </select>
            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {brands.length > 0 && (
            <div className="relative">
              <select value={brandId} onChange={e => setBrandId(e.target.value)}
                className={`appearance-none pl-2.5 pr-6 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-400 cursor-pointer ${brandId ? 'border-brand-400 bg-brand-50 text-brand-700 font-semibold' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                <option value="">Brendi</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}

          <div className="relative">
            <select value={audience} onChange={e => setAudience(e.target.value)}
              className={`appearance-none pl-2.5 pr-6 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-400 cursor-pointer ${audience ? 'border-brand-400 bg-brand-50 text-brand-700 font-semibold' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
              <option value="">Audienca</option>
              <option value="home">🏠 Shtëpi</option>
              <option value="business">🏢 Biznes</option>
              <option value="both">👥 Të Gjithë</option>
            </select>
            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select value={status} onChange={e => setStatus(e.target.value)}
              className={`appearance-none pl-2.5 pr-6 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-400 cursor-pointer ${status ? 'border-brand-400 bg-brand-50 text-brand-700 font-semibold' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
              <option value="">Statusi</option>
              <option value="active">✅ Aktiv</option>
              <option value="inactive">⛔ Joaktiv</option>
            </select>
            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select value={stock} onChange={e => setStock(e.target.value)}
              className={`appearance-none pl-2.5 pr-6 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-400 cursor-pointer ${stock ? 'border-brand-400 bg-brand-50 text-brand-700 font-semibold' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
              <option value="">Stoku</option>
              <option value="in">✅ Në gjendje</option>
              <option value="low">⚠️ I ulët</option>
              <option value="out">❌ Pa gjendje</option>
            </select>
            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Row 2: quick chips + count */}
        <div className="flex items-center gap-1.5">
          {([
            { label: '⭐ I Zgjedhur', state: featured,    set: setFeatured },
            { label: '🔥 Best Seller', state: bestSeller, set: setBestSeller },
            { label: '🏷️ Zbritje',    state: onSale,      set: setOnSale },
          ] as const).map(({ label, state, set }) => (
            <button
              key={label}
              onClick={() => set(!state)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                state ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {hasFilters
                ? <><span className="font-bold text-gray-700">{filtered.length}</span> / {products.length}</>
                : <span className="font-bold text-gray-700">{products.length}</span>
              } produkte
            </span>
            {hasFilters && (
              <button onClick={clearAll} className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                <X size={11} /> Pastro
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5 w-10">Foto</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5">Produkti</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5">Kategoria</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5">Brendi</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5">Çmimi</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5">Stoku</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5">Audienca</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5">Statusi</th>
                <th className="px-3 py-2.5 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-gray-50/60 transition-colors group">
                  <td className="px-3 py-2">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.image_url ? (
                        <Image src={product.image_url} alt="" fill className="object-cover" sizes="32px" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-sm">🧴</div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-900 text-sm leading-snug">{product.name_sq}</p>
                    <p className="text-gray-400 text-[11px] font-mono">{product.sku}</p>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {product.category?.name_sq ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {product.brand?.name ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-sm text-gray-900">{formatPrice(product.price)}</p>
                    {product.sale_price && (
                      <p className="text-[11px] text-red-500 font-medium flex items-center gap-0.5">
                        <Tag size={9} /> {formatPrice(product.sale_price)}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {product.stock === 0 ? (
                        <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">0</span>
                      ) : product.stock <= 10 ? (
                        <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-600">
                          <AlertTriangle size={10} /> {product.stock}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-gray-700">{product.stock}</span>
                      )}
                      <span className="text-[11px] text-gray-400">{product.unit}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={product.audience_type === 'home' ? 'brand' : product.audience_type === 'business' ? 'warning' : 'neutral'}
                      size="sm"
                    >
                      {AUDIENCE_LABELS[product.audience_type]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                        {product.is_active ? 'Aktiv' : 'Joaktiv'}
                      </span>
                      {product.is_featured && <span title="I Zgjedhur"><Star size={10} className="text-amber-400" fill="currentColor" /></span>}
                      {product.is_best_seller && <span title="Best Seller"><TrendingUp size={10} className="text-brand-400" /></span>}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        onClick={saveScroll}
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                        title="Modifiko"
                      >
                        <Edit size={14} />
                      </Link>
                      <DeleteProductButton productId={product.id} productName={product.name_sq} />
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <Package size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">
                      {hasFilters ? 'Asnjë produkt nuk përputhet' : 'Nuk ka produkte ende'}
                    </p>
                    {hasFilters && (
                      <button onClick={clearAll} className="mt-1.5 text-xs text-brand-600 hover:underline">
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
