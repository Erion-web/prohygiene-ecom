'use client'

import { useMemo, useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react'
import { type LegacyColumnDef } from '@tanstack/react-table/legacy'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import { AdminTable } from '@/components/admin/AdminTable'
import type { Category, AudienceType } from '@/types'

interface CategoriesClientProps {
  initialCategories: Category[]
}

interface CategoryFormData {
  name_sq: string
  name_en: string
  slug: string
  audience_type: AudienceType
  sort_order: number
  is_active: boolean
}

const defaultForm: CategoryFormData = {
  name_sq: '',
  name_en: '',
  slug: '',
  audience_type: 'both',
  sort_order: 0,
  is_active: true,
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryFormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const refresh = useScrollPreservingRefresh()

  const update = (key: string, value: string | boolean | number) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value }
      if (key === 'name_sq') updated.slug = slugify(value as string)
      return updated
    })
  }

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setForm({
      name_sq: cat.name_sq,
      name_en: cat.name_en,
      slug: cat.slug,
      audience_type: cat.audience_type,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    })
    setShowForm(true)
  }

  const reset = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(defaultForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name_sq || !form.slug) {
      toast.error('Plotësoni emrin dhe slug-un')
      return
    }
    setLoading(true)
    const supabase = createClient()

    let error
    if (editingId) {
      const res = await supabase.from('categories').update(form).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('categories').insert(form)
      error = res.error
    }

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(editingId ? 'Kategoria u përditësua' : 'Kategoria u shtua')
      reset()
      refresh()
    }
    setLoading(false)
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Fshi kategorinë "${cat.name_sq}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('categories').delete().eq('id', cat.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Kategoria u fshi')
      refresh()
    }
  }

  const columns = useMemo<LegacyColumnDef<Category, unknown>[]>(() => [
    {
      id: 'name',
      header: 'Emri',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-text-primary">{row.original.name_sq}</p>
          {row.original.name_en && <p className="text-text-muted text-xs">{row.original.name_en}</p>}
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
      id: 'audience',
      header: 'Audienca',
      cell: ({ row }) => (
        <span className="text-text-secondary capitalize">{row.original.audience_type}</span>
      ),
    },
    {
      id: 'sort',
      header: 'Renditja',
      cell: ({ row }) => (
        <span className="text-text-secondary">{row.original.sort_order}</span>
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
        <div className="flex items-center gap-1.5 justify-end">
          <button
            type="button"
            onClick={() => startEdit(row.original)}
            className="p-1.5 text-text-muted hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
          >
            <Edit size={14} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.original)}
            className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ], [])

  return (
    <div className="space-y-5">
      {/* Add button */}
      {!showForm && (
        <button onClick={() => setShowForm(true)} className="btn-primary gap-2 text-sm">
          <Plus size={15} />
          Shto Kategori
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="admin-card animate-slide-down">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-text-primary">{editingId ? 'Modifiko Kategorinë' : 'Kategori e Re'}</h3>
            <button onClick={reset} className="btn-ghost p-1.5"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Emri (Shqip) *</label>
              <input type="text" value={form.name_sq} onChange={e => update('name_sq', e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Name (English)</label>
              <input type="text" value={form.name_en} onChange={e => update('name_en', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Slug *</label>
              <input type="text" value={form.slug} onChange={e => update('slug', e.target.value)} className="input font-mono text-sm" required />
            </div>
            <div>
              <label className="label">Audienca</label>
              <select value={form.audience_type} onChange={e => update('audience_type', e.target.value)} className="input">
                <option value="both">Të Gjithë</option>
                <option value="home">Shtëpi</option>
                <option value="business">Biznes</option>
              </select>
            </div>
            <div>
              <label className="label">Renditja</label>
              <input type="number" value={form.sort_order} onChange={e => update('sort_order', parseInt(e.target.value))} className="input" />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <div
                  onClick={() => update('is_active', !form.is_active)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form.is_active ? 'bg-brand-600' : 'bg-surface-muted'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-soft transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-text-secondary">Aktiv</span>
              </label>
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
        data={categories}
        columns={columns}
        getRowId={row => row.id}
        emptyMessage="Nuk ka kategori ende"
      />
    </div>
  )
}
