'use client'

import { useState, useMemo } from 'react'
import { PercentCircle, Tag, X, Search, CheckSquare, Square, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface ProductRow {
  id: string
  sku: string
  name_sq: string
  price: number
  sale_price: number | null
  image_url: string | null
  is_active: boolean
  category: { name_sq: string }[] | null
  brand: { name: string }[] | null
}

interface Props { products: ProductRow[] }

type Mode = 'percent' | 'fixed' | 'remove'

export function SalesClient({ products }: Props) {
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [search, setSearch]       = useState('')
  const [mode, setMode]           = useState<Mode>('percent')
  const [discountVal, setDiscount] = useState('')
  const [loading, setLoading]     = useState(false)
  const [filter, setFilter]       = useState<'all' | 'on_sale' | 'no_sale'>('all')

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name_sq.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      const matchFilter =
        filter === 'all' ? true :
        filter === 'on_sale' ? p.sale_price !== null :
        p.sale_price === null
      return matchSearch && matchFilter
    })
  }, [products, search, filter])

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(p => p.id)))
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
      // Need to update each product individually since percent discount depends on its price
      const toUpdate = products.filter(p => ids.includes(p.id))
      for (const p of toUpdate) {
        const salePrice = mode === 'percent'
          ? Math.round(p.price * (1 - val / 100) * 100) / 100
          : Math.round((p.price - val) * 100) / 100

        if (salePrice <= 0) continue
        const res = await supabase.from('products').update({ sale_price: salePrice }).eq('id', p.id)
        if (res.error) { error = res.error; break }
      }
    }

    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      const action = mode === 'remove' ? 'u hoq zbritja' : 'u vendos çmimi i zbritur'
      toast.success(`${ids.length} produkte ${action}`)
      setSelected(new Set())
      // Refresh page data
      window.location.reload()
    }
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length
  const onSaleCount = products.filter(p => p.sale_price !== null).length

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Gjithsej produkte', value: products.length, color: 'text-text-primary' },
          { label: 'Me zbritje', value: onSaleCount, color: 'text-emerald-600' },
          { label: 'Pa zbritje', value: products.length - onSaleCount, color: 'text-text-secondary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="admin-card p-4">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Action panel */}
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
              onClick={applyToSelected}
              disabled={loading}
              className="btn-primary py-1.5 px-4 text-sm gap-1.5 ml-auto"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
              {mode === 'remove' ? 'Hiq Zbritjet' : 'Apliko'}
            </button>

            <button
              onClick={() => setSelected(new Set())}
              className="p-1.5 text-text-muted hover:text-text-primary"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
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
          ] as { key: typeof filter; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                filter === key ? 'bg-white shadow-soft text-text-primary' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border bg-surface-soft">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-text-muted hover:text-brand-600">
                    {allSelected ? <CheckSquare size={16} className="text-brand-600" /> : <Square size={16} />}
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-muted text-sm">
                    <AlertCircle size={24} className="mx-auto mb-2 opacity-40" />
                    Nuk u gjet asnjë produkt
                  </td>
                </tr>
              )}
              {filtered.map(p => {
                const isSelected = selected.has(p.id)
                const saving = p.sale_price !== null ? ((p.price - p.sale_price) / p.price * 100).toFixed(0) : null

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
                        {p.category?.[0]?.name_sq && <span>{p.category[0].name_sq}</span>}
                        {p.brand?.[0]?.name && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-brand-50 text-brand-700 rounded-full font-medium">
                            {p.brand[0].name}
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
    </div>
  )
}
