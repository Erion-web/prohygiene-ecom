'use client'

import { useMemo, useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react'
import { type LegacyColumnDef } from '@tanstack/react-table/legacy'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import { AdminTable } from '@/components/admin/AdminTable'
import type { UtilityCategory } from '@/types'

interface Props {
  initialCategories: UtilityCategory[]
}

const defaultForm = {
  name_sq: '',
  name_en: '',
  slug: '',
  sort_order: 0,
  is_active: true,
}

export function UtilityCategoriesClient({ initialCategories }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const refresh = useScrollPreservingRefresh()

  const update = (key: string, value: string | boolean | number) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value }
      if (key === 'name_sq') updated.slug = slugify(value as string)
      return updated
    })
  }

  const reset = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(defaultForm)
  }

  const startEdit = (cat: UtilityCategory) => {
    setEditingId(cat.id)
    setForm({
      name_sq: cat.name_sq,
      name_en: cat.name_en,
      slug: cat.slug,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name_sq || !form.slug) {
      toast.error('Plotësoni emrin dhe slug-un')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const payload = { ...form, description_sq: null, description_en: null }

    const { error } = editingId
      ? await supabase.from('utility_categories').update(payload).eq('id', editingId)
      : await supabase.from('utility_categories').insert(payload)

    if (error) toast.error(error.message)
    else {
      toast.success(editingId ? 'Kategoria u përditësua' : 'Kategoria u shtua')
      reset()
      refresh()
    }
    setLoading(false)
  }

  const handleDelete = async (cat: UtilityCategory) => {
    if (!confirm(`Fshi kategorinë "${cat.name_sq}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('utility_categories').delete().eq('id', cat.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Kategoria u fshi')
      refresh()
    }
  }

  const columns = useMemo<LegacyColumnDef<UtilityCategory, unknown>[]>(() => [
    {
      id: 'name',
      header: 'Emri',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-text-primary text-sm">{row.original.name_sq}</p>
          {row.original.name_en && <p className="text-xs text-text-muted">{row.original.name_en}</p>}
        </div>
      ),
    },
    {
      id: 'slug',
      header: 'Slug',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-text-muted">{row.original.slug}</span>
      ),
    },
    {
      id: 'sort',
      header: 'Renditja',
      cell: ({ row }) => (
        <span className="text-sm text-text-secondary">{row.original.sort_order}</span>
      ),
    },
    {
      id: 'status',
      header: 'Statusi',
      cell: ({ row }) => (
        <span className={`badge text-xs ${row.original.is_active ? 'badge-success' : 'badge-neutral'}`}>
          {row.original.is_active ? 'Aktiv' : 'Joaktiv'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Veprime',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <div className="flex justify-end gap-1.5">
          <button type="button" onClick={() => startEdit(row.original)} className="p-1.5 hover:bg-brand-50 rounded-lg">
            <Edit size={14} />
          </button>
          <button type="button" onClick={() => handleDelete(row.original)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ], [])

  return (
    <div className="space-y-5">
      {!showForm && (
        <button onClick={() => setShowForm(true)} className="btn-primary gap-2 text-sm">
          <Plus size={15} />
          Shto Kategori
        </button>
      )}

      {showForm && (
        <div className="admin-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-text-primary">{editingId ? 'Modifiko' : 'Kategori e Re'}</h3>
            <button type="button" onClick={reset} className="btn-ghost p-1.5"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Emri (Shqip) *</label>
              <input value={form.name_sq} onChange={e => update('name_sq', e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Name (English)</label>
              <input value={form.name_en} onChange={e => update('name_en', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Slug *</label>
              <input value={form.slug} onChange={e => update('slug', e.target.value)} className="input font-mono text-sm" required />
            </div>
            <div>
              <label className="label">Renditja</label>
              <input type="number" value={form.sort_order} onChange={e => update('sort_order', parseInt(e.target.value) || 0)} className="input" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary gap-2 text-sm py-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {editingId ? 'Ruaj' : 'Krijo'}
              </button>
              <button type="button" onClick={reset} className="btn-secondary text-sm py-2">Anulo</button>
            </div>
          </form>
        </div>
      )}

      <AdminTable
        data={initialCategories}
        columns={columns}
        getRowId={row => row.id}
        emptyMessage="Nuk ka kategori ende"
      />
    </div>
  )
}
