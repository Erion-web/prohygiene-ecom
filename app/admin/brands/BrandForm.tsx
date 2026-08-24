'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { Brand } from '@/types'

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

interface Props { brand?: Brand }

export function BrandForm({ brand }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name:        brand?.name ?? '',
    slug:        brand?.slug ?? '',
    logo_url:    brand?.logo_url ?? '',
    description: brand?.description ?? '',
    sort_order:  brand?.sort_order?.toString() ?? '0',
    is_active:   brand?.is_active ?? true,
  })

  const update = (key: string, value: string | boolean) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'name' && !brand) next.slug = slugify(value as string)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.slug) {
      toast.error('Emri dhe slug janë të detyrueshme')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const payload = {
      name:        form.name,
      slug:        form.slug,
      logo_url:    form.logo_url || null,
      description: form.description || null,
      sort_order:  parseInt(form.sort_order) || 0,
      is_active:   form.is_active,
    }

    let error
    if (brand) {
      const res = await supabase.from('brands').update(payload).eq('id', brand.id)
      error = res.error
    } else {
      const res = await supabase.from('brands').insert(payload)
      error = res.error
    }
    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(brand ? 'Brendi u përditësua' : 'Brendi u shtua')
      router.push('/admin/brands')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <div className="admin-card space-y-4">
        <h3 className="font-bold text-text-primary flex items-center gap-2">
          <Award size={16} className="text-brand-500" />
          {brand ? 'Ndrysho Brendin' : 'Shto Brend të Ri'}
        </h3>

        <div>
          <label className="label">Emri *</label>
          <input
            type="text" required
            value={form.name}
            onChange={e => update('name', e.target.value)}
            className="input" placeholder="p.sh. Ariel, Domestos..."
          />
        </div>

        <div>
          <label className="label">Slug *</label>
          <input
            type="text" required
            value={form.slug}
            onChange={e => update('slug', e.target.value)}
            className="input font-mono text-sm"
          />
        </div>

        <div>
          <label className="label">URL e Logos</label>
          <input
            type="url"
            value={form.logo_url}
            onChange={e => update('logo_url', e.target.value)}
            className="input" placeholder="https://..."
          />
          {form.logo_url && (
            <img src={form.logo_url} alt="" className="mt-2 h-10 object-contain" />
          )}
        </div>

        <div>
          <label className="label">Përshkrimi</label>
          <textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            className="input resize-none h-20"
          />
        </div>

        <div>
          <label className="label">Rendi i Shfaqjes</label>
          <input
            type="number" min="0"
            value={form.sort_order}
            onChange={e => update('sort_order', e.target.value)}
            className="input w-24"
          />
        </div>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-text-secondary">Aktiv</span>
          <div
            onClick={() => update('is_active', !form.is_active)}
            className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${form.is_active ? 'bg-brand-600' : 'bg-surface-muted'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-soft transition-transform duration-200 ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary py-3 px-8 gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {brand ? 'Ruaj Ndryshimet' : 'Krijo Brendin'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary py-3 px-6">
          Anulo
        </button>
      </div>
    </form>
  )
}
