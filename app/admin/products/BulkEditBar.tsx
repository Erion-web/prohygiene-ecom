'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Brand, Category } from '@/types'

const NO_CHANGE = '__no_change__'

interface Props {
  selectedIds: string[]
  categories: Pick<Category, 'id' | 'name_sq'>[]
  brands: Pick<Brand, 'id' | 'name'>[]
  onDone: () => void
}

export function BulkEditBar({ selectedIds, categories, brands, onDone }: Props) {
  const router = useRouter()
  const [categoryId, setCategoryId] = useState(NO_CHANGE)
  const [brandId, setBrandId] = useState(NO_CHANGE)
  const [audience, setAudience] = useState(NO_CHANGE)
  const [saving, setSaving] = useState(false)

  const hasChange = categoryId !== NO_CHANGE || brandId !== NO_CHANGE || audience !== NO_CHANGE

  const apply = async () => {
    if (!hasChange) {
      toast.error('Zgjidhni të paktën një fushë për ndryshim')
      return
    }
    setSaving(true)
    try {
      const patch: Record<string, string | null> = {}
      if (categoryId !== NO_CHANGE) patch.category_id = categoryId || null
      if (brandId !== NO_CHANGE) patch.brand_id = brandId || null
      if (audience !== NO_CHANGE) patch.audience_type = audience

      const res = await fetch('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedIds, patch }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Dështoi')

      toast.success(`${data.updated} produkte u përditësuan`)
      setCategoryId(NO_CHANGE)
      setBrandId(NO_CHANGE)
      setAudience(NO_CHANGE)
      onDone()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dështoi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-card flex flex-wrap items-center gap-2.5 px-3 py-2.5 border-brand-300 bg-brand-50/40">
      <span className="text-xs font-bold text-brand-700 whitespace-nowrap">
        {selectedIds.length} të zgjedhura
      </span>

      <select
        value={categoryId}
        onChange={e => setCategoryId(e.target.value)}
        className="input py-1.5 text-xs w-auto max-w-[160px]"
      >
        <option value={NO_CHANGE}>Kategoria: mos ndrysho</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name_sq}</option>
        ))}
      </select>

      <select
        value={brandId}
        onChange={e => setBrandId(e.target.value)}
        className="input py-1.5 text-xs w-auto max-w-[160px]"
      >
        <option value={NO_CHANGE}>Brendi: mos ndrysho</option>
        <option value="">— asnjë —</option>
        {brands.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      <select
        value={audience}
        onChange={e => setAudience(e.target.value)}
        className="input py-1.5 text-xs w-auto max-w-[160px]"
      >
        <option value={NO_CHANGE}>Audienca: mos ndrysho</option>
        <option value="home">Shtëpi</option>
        <option value="business">Biznes</option>
        <option value="both">Të Gjithë</option>
      </select>

      <div className="flex items-center gap-1.5 ml-auto">
        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <X size={13} /> Anulo
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={saving || !hasChange}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Apliko
        </button>
      </div>
    </div>
  )
}
