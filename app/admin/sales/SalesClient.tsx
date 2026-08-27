'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PercentCircle, Tag, X, Search, CheckSquare, Square, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  salesListSearchParams,
  sanitizeSalesSearch,
  type SalesListFilters,
  type SalesSaleFilter,
} from './query'

interface ProductRow {
  id: string
  sku: string
  name_sq: string
  price: number
  sale_price: number | null
  image_url: string | null
  is_active: boolean
  category: { name_sq: string }[] | { name_sq: string } | null
  brand: { name: string }[] | { name: string } | null
}

interface Props {
  products: ProductRow[]
  matched: number
  page: number
  pageSize: number
  stats: {
    total: number
    onSale: number
    noSale: number
  }
  filters: SalesListFilters
}

type Mode = 'percent' | 'fixed' | 'remove'

function pageNumbers(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, total, current, current - 1, current + 1])
  const sorted = Array.from(set).filter(p => p >= 1 && p <= total).sort((a, b) => a - b)
  const out: Array<number | 'gap'> = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('gap')
    out.push(sorted[i])
  }
  return out
}

function getScrollEl() {
  return typeof document !== 'undefined' ? document.getElementById('admin-main') : null
}

function categoryName(category: ProductRow['category']) {
  if (!category) return null
  return Array.isArray(category) ? category[0]?.name_sq : category.name_sq
}

function brandName(brand: ProductRow['brand']) {
  if (!brand) return null
  return Array.isArray(brand) ? brand[0]?.name : brand.name
}

export function SalesClient({ products, matched, page, pageSize, stats, filters }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState(filters.q)
  const [mode, setMode] = useState<Mode>('percent')
  const [discountVal, setDiscount] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectingAll, setSelectingAll] = useState(false)
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  useEffect(() => {
    setSearch(filters.q)
  }, [filters.q])

  useEffect(() => {
    setSelected(new Set())
  }, [filters.q, filters.sale, page])

  const pushFilters = (next: SalesListFilters) => {
    const qs = salesListSearchParams(next)
    startTransition(() => {
      router.push(qs ? `/admin/sales?${qs}` : '/admin/sales', { scroll: false })
    })
  }

  const setFilter = (patch: Partial<SalesListFilters>) => {
    pushFilters({ ...filters, ...patch, page: 1 })
  }

  useEffect(() => {
    const q = search.trim()
    if (q === filtersRef.current.q) return
    const t = window.setTimeout(() => {
      pushFilters({ ...filtersRef.current, q, page: 1 })
    }, 350)
    return () => window.clearTimeout(t)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(matched / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = matched === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, matched)

  const goToPage = (n: number) => {
    const next = Math.min(Math.max(1, n), totalPages)
    pushFilters({ ...filters, page: next })
    getScrollEl()?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const fetchAllMatchingIds = async () => {
    const supabase = createClient()
    const q = sanitizeSalesSearch(filters.q)
    let query = supabase.from('products').select('id').eq('is_active', true)
    if (q) query = query.or(`name_sq.ilike.%${q}%,sku.ilike.%${q}%`)
    if (filters.sale === 'on_sale') query = query.not('sale_price', 'is', null)
    if (filters.sale === 'no_sale') query = query.is('sale_price', null)
    const { data, error } = await query
    if (error) throw error
    return data?.map(row => row.id) ?? []
  }

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = async () => {
    if (selected.size === matched && matched > 0) {
      setSelected(new Set())
      return
    }
    setSelectingAll(true)
    try {
      const ids = await fetchAllMatchingIds()
      setSelected(new Set(ids))
    } catch {
      toast.error('Nuk u ngarkuan produktet')
    } finally {
      setSelectingAll(false)
    }
  }

  const applyToSelected = async () => {
    if (selected.size === 0) { toast.error('Zgjidhni të paktën një produkt'); return }
    if (mode !== 'remove' && !discountVal) { toast.error('Shkruani vlerën e zbritjes'); return }

    const val = parseFloat(discountVal)
    if (mode !== 'remove' && (isNaN(val) || val <= 0)) {
      toast.error('Vlera e zbritjes duhet të jetë pozitive')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const ids = Array.from(selected)

    let error = null
    if (mode === 'remove') {
      const res = await supabase.from('products').update({ sale_price: null }).in('id', ids)
      error = res.error
    } else {
      const { data: toUpdate, error: fetchError } = await supabase
        .from('products')
        .select('id, price')
        .in('id', ids)

      if (fetchError) {
        error = fetchError
      } else {
        for (const p of toUpdate ?? []) {
          const salePrice = mode === 'percent'
            ? Math.round(p.price * (1 - val / 100) * 100) / 100
            : Math.round((p.price - val) * 100) / 100

          if (salePrice <= 0) continue
          const res = await supabase.from('products').update({ sale_price: salePrice }).eq('id', p.id)
          if (res.error) { error = res.error; break }
        }
      }
    }

    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      const action = mode === 'remove' ? 'u hoq zbritja' : 'u vendos çmimi i zbritur'
      toast.success(`${ids.length} produkte ${action}`)
      setSelected(new Set())
      router.refresh()
    }
  }

  const allSelected = matched > 0 && selected.size === matched
  const pageAllSelected = products.length > 0 && products.every(p => selected.has(p.id))

  return (
    <div className={cn('space-y-5', isPending && 'opacity-60 pointer-events-none')}>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Gjithsej produkte', value: stats.total, color: 'text-text-primary' },
          { label: 'Me zbritje', value: stats.onSale, color: 'text-emerald-600' },
          { label: 'Pa zbritje', value: stats.noSale, color: 'text-text-secondary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="admin-card">
            <p className={`admin-kpi-value ${color}`}>{value}</p>
            <p className="admin-kpi-label">{label}</p>
          </div>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="admin-card p-4 border border-brand-200 bg-brand-50">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-brand-700">
              {selected.size} produkte zgjedhur
            </span>

            <div className="flex gap-1 bg-white rounded-xl p-1 border border-brand-200">
              {([
                { key: 'percent', label: '% Zbritje' },
                { key: 'fixed',   label: '€ Zbritje' },
                { key: 'remove',  label: 'Hiq Zbritjen' },
              ] as { key: Mode; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    mode === key ? 'bg-brand-600 text-white' : 'text-text-secondary hover:bg-surface-muted'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode !== 'remove' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step={mode === 'percent' ? '1' : '0.01'}
                  max={mode === 'percent' ? '99' : undefined}
                  value={discountVal}
                  onChange={e => setDiscount(e.target.value)}
                  className="input w-24 py-1.5 text-sm"
                  placeholder={mode === 'percent' ? '20' : '5.00'}
                />
                <span className="text-sm text-text-secondary">{mode === 'percent' ? '%' : '€'}</span>
              </div>
            )}

            {mode === 'percent' && discountVal && (
              <span className="text-xs text-text-muted">
                p.sh. 10€ → {(10 * (1 - parseFloat(discountVal) / 100)).toFixed(2)}€
              </span>
            )}

            <button
              type="button"
              onClick={applyToSelected}
              disabled={loading}
              className="btn-primary py-1.5 px-4 text-sm gap-1.5 ml-auto"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
              {mode === 'remove' ? 'Hiq Zbritjet' : 'Apliko'}
            </button>

            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="p-1.5 text-text-muted hover:text-text-primary"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 py-2 text-sm"
            placeholder="Kërko produkt ose SKU..."
          />
        </div>
        <div className="flex gap-1 bg-surface-muted p-1 rounded-xl">
          {([
            { key: 'all',     label: 'Të gjitha' },
            { key: 'on_sale', label: 'Me zbritje' },
            { key: 'no_sale', label: 'Pa zbritje' },
          ] as { key: SalesSaleFilter; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter({ sale: key })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                filters.sale === key ? 'bg-white shadow-soft text-text-primary' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border bg-surface-soft">
                <th className="px-4 py-3 w-10">
                  <button
                    type="button"
                    onClick={toggleAll}
                    disabled={selectingAll || matched === 0}
                    className="text-text-muted hover:text-brand-600 disabled:opacity-40"
                  >
                    {selectingAll ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : allSelected || pageAllSelected ? (
                      <CheckSquare size={16} className="text-brand-600" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3">Produkti</th>
                <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3">Kategoria / Brendi</th>
                <th className="text-right text-xs font-semibold text-text-secondary px-4 py-3">Çmimi</th>
                <th className="text-right text-xs font-semibold text-text-secondary px-4 py-3">Zbritja</th>
                <th className="text-right text-xs font-semibold text-text-secondary px-4 py-3">Kursim</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-muted text-sm">
                    <AlertCircle size={24} className="mx-auto mb-2 opacity-40" />
                    Nuk u gjet asnjë produkt
                  </td>
                </tr>
              )}
              {products.map(p => {
                const isSelected = selected.has(p.id)
                const saving = p.sale_price !== null ? ((p.price - p.sale_price) / p.price * 100).toFixed(0) : null
                const cat = categoryName(p.category)
                const br = brandName(p.brand)

                return (
                  <tr
                    key={p.id}
                    onClick={() => toggleOne(p.id)}
                    className={cn(
                      'border-b border-surface-border/50 cursor-pointer transition-colors',
                      isSelected ? 'bg-brand-50' : 'hover:bg-surface-soft'
                    )}
                  >
                    <td className="px-4 py-3">
                      {isSelected
                        ? <CheckSquare size={16} className="text-brand-600" />
                        : <Square size={16} className="text-text-muted" />
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-9 h-9 rounded-lg object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center">
                            <PercentCircle size={14} className="text-text-muted" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-text-primary leading-tight">{p.name_sq}</p>
                          <p className="text-xs text-text-muted font-mono">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-text-secondary">
                        {cat && <span>{cat}</span>}
                        {br && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-brand-50 text-brand-700 rounded-full font-medium">
                            {br}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                      {p.price.toFixed(2)}€
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.sale_price !== null ? (
                        <span className="text-sm font-bold text-emerald-600">{p.sale_price.toFixed(2)}€</span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {saving !== null ? (
                        <span className="text-xs font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                          -{saving}%
                        </span>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {matched > pageSize && (
        <div className="admin-card flex items-center justify-between gap-3 py-2.5 px-4">
          <p className="text-xs text-text-muted tabular-nums">
            {pageStart}–{pageEnd} nga {matched}
          </p>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="p-1.5 rounded-lg text-text-muted hover:bg-surface-soft disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Faqja e mëparshme"
            >
              <ChevronLeft size={15} />
            </button>
            {pageNumbers(currentPage, totalPages).map((item, i) =>
              item === 'gap' ? (
                <span key={`gap-${i}`} className="px-1.5 text-xs text-text-muted">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToPage(item)}
                  className={cn(
                    'min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-semibold tabular-nums',
                    item === currentPage
                      ? 'bg-brand-600 text-white'
                      : 'text-text-secondary hover:bg-surface-soft',
                  )}
                >
                  {item}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
              className="p-1.5 rounded-lg text-text-muted hover:bg-surface-soft disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Faqja tjetër"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
