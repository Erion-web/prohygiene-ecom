'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { Competitor } from '@/types'

interface Props {
  competitor?: Competitor
}

export function CompetitorForm({ competitor }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: competitor?.name ?? '',
    catalog_url: competitor?.catalog_url ?? '',
    is_active: competitor?.is_active ?? true,
    selector_card: competitor?.selector_card ?? '',
    selector_name: competitor?.selector_name ?? '',
    selector_price: competitor?.selector_price ?? '',
    selector_link: competitor?.selector_link ?? '',
    selector_next_page: competitor?.selector_next_page ?? '',
    scrape_interval_hours: String(competitor?.scrape_interval_hours ?? 168),
  })

  const update = (key: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.catalog_url.trim()) {
      toast.error('Emri dhe URL e katalogut janë të detyrueshme')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const payload = {
      name: form.name.trim(),
      catalog_url: form.catalog_url.trim(),
      is_active: form.is_active,
      selector_card: form.selector_card.trim() || null,
      selector_name: form.selector_name.trim() || null,
      selector_price: form.selector_price.trim() || null,
      selector_link: form.selector_link.trim() || null,
      selector_next_page: form.selector_next_page.trim() || null,
      scrape_interval_hours: parseInt(form.scrape_interval_hours, 10) || 168,
      updated_at: new Date().toISOString(),
    }

    const res = competitor
      ? await supabase.from('competitors').update(payload).eq('id', competitor.id)
      : await supabase.from('competitors').insert(payload)

    setLoading(false)
    if (res.error) {
      toast.error(res.error.message)
    } else {
      toast.success(competitor ? 'Konkurrenti u përditësua' : 'Konkurrenti u shtua')
      router.push('/admin/comparisons/competitors')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="admin-card space-y-4">
        <div>
          <label className="label">Emri i konkurrentit *</label>
          <input className="input" value={form.name} onChange={e => update('name', e.target.value)} required />
        </div>
        <div>
          <label className="label">URL e katalogut *</label>
          <input
            type="url"
            className="input font-mono text-sm"
            value={form.catalog_url}
            onChange={e => update('catalog_url', e.target.value)}
            required
            placeholder="https://..."
          />
          <p className="text-xs text-text-muted mt-1">Faqja publike e listimit të produkteve.</p>
        </div>
        <div>
          <label className="label">Intervali i scraping (orë)</label>
          <input
            type="number"
            min={24}
            className="input w-32"
            value={form.scrape_interval_hours}
            onChange={e => update('scrape_interval_hours', e.target.value)}
          />
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-text-secondary">Aktiv</span>
          <div
            role="switch"
            aria-checked={form.is_active}
            onClick={() => update('is_active', !form.is_active)}
            className={`w-10 h-5 rounded-md transition-colors relative ${form.is_active ? 'bg-brand-600' : 'bg-surface-muted'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded bg-white shadow-soft transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>

      <div className="admin-card space-y-3">
        <h3 className="font-semibold text-text-primary text-sm">Selektorët CSS (opsionale)</h3>
        <p className="text-xs text-text-muted">
          Përdoren vetëm kur JSON-LD nuk gjen produkte. Lër bosh nëse faqja ka structured data.
        </p>
        {(
          [
            ['selector_card', 'Karta e produktit'],
            ['selector_name', 'Emri'],
            ['selector_price', 'Çmimi'],
            ['selector_link', 'Linku'],
            ['selector_next_page', 'Faqja tjetër'],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="label">{label}</label>
            <input
              className="input font-mono text-xs"
              value={form[key]}
              onChange={e => update(key, e.target.value)}
              placeholder=".product-card"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Ruaj
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>
          Anulo
        </button>
      </div>
    </form>
  )
}
