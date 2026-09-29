'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { Competitor, JsonCatalogConfig } from '@/types'

interface Props {
  competitor?: Competitor
}

type DataSource = 'catalog_html' | 'json_api'

function initialDataSource(c?: Competitor): DataSource {
  return c?.products_api_url?.trim() ? 'json_api' : 'catalog_html'
}

export function CompetitorForm({ competitor }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<DataSource>(() => initialDataSource(competitor))
  const cfg = competitor?.json_catalog_config ?? {}
  const [form, setForm] = useState({
    name: competitor?.name ?? '',
    catalog_url: competitor?.catalog_url ?? '',
    products_api_url: competitor?.products_api_url ?? '',
    json_items_path: cfg.itemsPath ?? '',
    json_url_template: cfg.urlTemplate ?? '',
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
    if (dataSource === 'json_api') {
      if (!form.products_api_url.trim()) {
        toast.error('URL e API për produkte është e detyrueshme për burimin JSON')
        return
      }
      if (!form.json_url_template.trim()) {
        toast.error('Shabloni i linkut të produktit është i detyrueshëm kur API nuk jep URL')
        return
      }
    }

    setLoading(true)
    const supabase = createClient()

    const json_catalog_config: JsonCatalogConfig = {}
    if (form.json_items_path.trim()) {
      json_catalog_config.itemsPath = form.json_items_path.trim()
    }
    if (form.json_url_template.trim()) {
      json_catalog_config.urlTemplate = form.json_url_template.trim()
    }

    const payload = {
      name: form.name.trim(),
      catalog_url: form.catalog_url.trim(),
      products_api_url:
        dataSource === 'json_api' ? form.products_api_url.trim() : null,
      json_catalog_config,
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
          <p className="text-xs text-text-muted mt-1">
            Faqja publike e listimit. Për dyqane SPA, API e produkteve zbul-ohet automatikisht gjatë scraping
            kur është e mundur.
          </p>
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

      <div className="admin-card space-y-4">
        <h3 className="font-semibold text-text-primary text-sm">Burimi i produkteve</h3>
        <p className="text-xs text-text-muted">
          Faqet me HTML (WooCommerce, JSON-LD, selektorë) ose API JSON kur faqja është vetëm aplikacion
          (SPA).
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="dataSource"
              checked={dataSource === 'catalog_html'}
              onChange={() => setDataSource('catalog_html')}
            />
            Faqja e katalogut (HTML)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="dataSource"
              checked={dataSource === 'json_api'}
              onChange={() => setDataSource('json_api')}
            />
            API JSON
          </label>
        </div>

        {dataSource === 'json_api' && (
          <div className="space-y-3 pt-2 border-t border-surface-border">
            <div>
              <label className="label">URL e API për produkte *</label>
              <input
                type="url"
                className="input font-mono text-xs"
                value={form.products_api_url}
                onChange={e => update('products_api_url', e.target.value)}
                placeholder="https://api.example.com/products"
              />
              <p className="text-xs text-text-muted mt-1">
                GET që kthen JSON: listë produktesh ose objekt me listë brenda (p.sh. data.items).
              </p>
            </div>
            <div>
              <label className="label">Rruga te lista (opsionale)</label>
              <input
                className="input font-mono text-xs"
                value={form.json_items_path}
                onChange={e => update('json_items_path', e.target.value)}
                placeholder="data.items"
              />
              <p className="text-xs text-text-muted mt-1">Lëre bosh nëse përgjigja është vetë listë.</p>
            </div>
            <div>
              <label className="label">Shablon i linkut të produktit *</label>
              <input
                className="input font-mono text-xs"
                value={form.json_url_template}
                onChange={e => update('json_url_template', e.target.value)}
                placeholder="https://dyqani.com/produkti/{id}"
              />
              <p className="text-xs text-text-muted mt-1">
                Përdor fushat nga JSON, p.sh. {'{id}'}, {'{barcode}'}. Emri, çmimi dhe SKU lexohen automatikisht
                nga fushat e zakonshme (name, price, barcode, …).
              </p>
            </div>
          </div>
        )}
      </div>

      {dataSource === 'catalog_html' && (
        <div className="admin-card space-y-3">
          <h3 className="font-semibold text-text-primary text-sm">Selektorët CSS (opsionale)</h3>
          <p className="text-xs text-text-muted">
            Përdoren kur JSON-LD dhe WooCommerce nuk gjejnë produkte. Lër bosh nëse faqja ka structured data.
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
      )}

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
