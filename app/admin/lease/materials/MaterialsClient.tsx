'use client'

import { useMemo, useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react'
import { type LegacyColumnDef } from '@tanstack/react-table/legacy'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import { AdminTable } from '@/components/admin/AdminTable'
import type { Material, MaterialUnit, UtilityCategory } from '@/types'

interface Props {
  initialMaterials: Material[]
  categories: UtilityCategory[]
}

const defaultForm = {
  utility_category_id: '',
  name_sq: '',
  name_en: '',
  material_type: '',
  description_sq: '',
  unit: 'ml' as MaterialUnit,
  is_active: true,
}

export function MaterialsClient({ initialMaterials, categories }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const refresh = useScrollPreservingRefresh()

  const update = (key: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const reset = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(defaultForm)
  }

  const startEdit = (m: Material) => {
    setEditingId(m.id)
    setForm({
      utility_category_id: m.utility_category_id,
      name_sq: m.name_sq,
      name_en: m.name_en,
      material_type: m.material_type ?? '',
      description_sq: m.description_sq ?? '',
      unit: m.unit,
      is_active: m.is_active,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name_sq || !form.utility_category_id) {
      toast.error('Plotësoni fushat e detyrueshme')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const payload = {
      utility_category_id: form.utility_category_id,
      name_sq: form.name_sq,
      name_en: form.name_en || form.name_sq,
      material_type: form.material_type || null,
      description_sq: form.description_sq || null,
      description_en: null,
      unit: form.unit,
      is_active: form.is_active,
    }

    const { error } = editingId
      ? await supabase.from('materials').update(payload).eq('id', editingId)
      : await supabase.from('materials').insert(payload)

    if (error) toast.error(error.message)
    else {
      toast.success(editingId ? 'Materiali u përditësua' : 'Materiali u shtua')
      reset()
      refresh()
    }
    setLoading(false)
  }

  const handleDelete = async (m: Material) => {
    if (!confirm(`Fshi materialin "${m.name_sq}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('materials').delete().eq('id', m.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Materiali u fshi')
      refresh()
    }
  }

  const columns = useMemo<LegacyColumnDef<Material, unknown>[]>(() => [
    {
      id: 'name',
      header: 'Materiali',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-text-primary text-sm">{row.original.name_sq}</p>
          {row.original.name_en && <p className="text-xs text-text-muted">{row.original.name_en}</p>}
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Kategoria',
      cell: ({ row }) => (
        <span className="text-sm text-text-secondary">
          {row.original.utility_category?.name_sq ?? '—'}
        </span>
      ),
    },
    {
      id: 'type',
      header: 'Lloji',
      cell: ({ row }) => (
        <span className="text-sm text-text-secondary">{row.original.material_type ?? '—'}</span>
      ),
    },
    {
      id: 'unit',
      header: 'Njësia',
      cell: ({ row }) => (
        <span className="text-sm font-mono text-text-secondary">{row.original.unit}</span>
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
          Shto Material
        </button>
      )}

      {showForm && (
        <div className="admin-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="admin-section-title">{editingId ? 'Modifiko Materialin' : 'Material i Ri'}</h3>
            <button type="button" onClick={reset} className="btn-ghost p-1.5"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Kategoria *</label>
              <select value={form.utility_category_id} onChange={e => update('utility_category_id', e.target.value)} className="input" required>
                <option value="">Zgjedh...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name_sq}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Njësia *</label>
              <select value={form.unit} onChange={e => update('unit', e.target.value)} className="input">
                <option value="ml">ml</option>
                <option value="cope">copë</option>
              </select>
            </div>
            <div>
              <label className="label">Emri (Shqip) *</label>
              <input value={form.name_sq} onChange={e => update('name_sq', e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Name (English)</label>
              <input value={form.name_en} onChange={e => update('name_en', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Lloji</label>
              <input value={form.material_type} onChange={e => update('material_type', e.target.value)} className="input" placeholder="p.sh. Aroma 2" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Përshkrimi</label>
              <textarea value={form.description_sq} onChange={e => update('description_sq', e.target.value)} className="input resize-none h-20" />
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
        data={initialMaterials}
        columns={columns}
        getRowId={row => row.id}
        emptyMessage="Nuk ka materiale ende"
      />
    </div>
  )
}
