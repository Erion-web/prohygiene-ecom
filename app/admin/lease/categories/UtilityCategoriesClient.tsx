'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
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

  return (
    <div className="max-w-3xl space-y-5">
      {!showForm && (
        <button onClick={() => setShowForm(true)} className="btn-primary gap-2 text-sm">
          <Plus size={15} />
          Shto Kategori
        </button>
      )}

      {showForm && (
        <div className="admin-card p-6">
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

      <div className="admin-card overflow-hidden p-0">
        <table className="w-full admin-table">
          <thead>
            <tr className="bg-surface-soft border-b border-surface-border">
              <th className="text-left">Emri</th>
              <th className="text-left">Slug</th>
              <th className="text-left">Renditja</th>
              <th className="text-left">Statusi</th>
              <th className="text-right">Veprime</th>
            </tr>
          </thead>
          <tbody>
            {initialCategories.map(cat => (
              <tr key={cat.id} className="hover:bg-surface-soft">
                <td>
                  <p className="font-medium text-sm">{cat.name_sq}</p>
                  {cat.name_en && <p className="text-xs text-text-muted">{cat.name_en}</p>}
                </td>
                <td><span className="font-mono text-xs text-text-muted">{cat.slug}</span></td>
                <td className="text-sm">{cat.sort_order}</td>
                <td>
                  <span className={`badge text-xs ${cat.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {cat.is_active ? 'Aktiv' : 'Joaktiv'}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-1.5">
                    <button type="button" onClick={() => startEdit(cat)} className="p-1.5 hover:bg-brand-50 rounded-lg"><Edit size={14} /></button>
                    <button type="button" onClick={() => handleDelete(cat)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
