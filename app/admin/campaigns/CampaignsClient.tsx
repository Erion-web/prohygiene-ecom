'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Tag, Clock, Loader2, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { saveCampaignAction, deleteCampaignAction } from '@/lib/actions/campaigns'
import { slugify, formatPrice } from '@/lib/utils'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import { Badge } from '@/components/ui/Badge'
import type { Campaign, DiscountType, AudienceType } from '@/types'

interface Product { id: string; name_sq: string; sku: string }
interface CampaignWithProducts extends Campaign {
  campaign_products: { product_id: string }[]
}

const defaultForm = {
  title_sq: '',
  title_en: '',
  description_sq: '',
  description_en: '',
  slug: '',
  discount_type: 'percentage' as DiscountType,
  discount_value: '',
  audience_type: 'both' as AudienceType,
  starts_at: '',
  ends_at: '',
  is_active: true,
  show_on_homepage: true,
}

export function CampaignsClient({ initialCampaigns, products }: { initialCampaigns: CampaignWithProducts[]; products: Product[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const refresh = useScrollPreservingRefresh()

  const update = (key: string, value: unknown) => {
    setForm(prev => {
      const u = { ...prev, [key]: value }
      if (key === 'title_sq') u.slug = slugify(value as string)
      return u
    })
  }

  const reset = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(defaultForm)
    setSelectedProducts([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title_sq || !form.starts_at || !form.ends_at || !form.discount_value) {
      toast.error('Plotësoni fushat e detyrueshme')
      return
    }
    setLoading(true)

    const result = await saveCampaignAction({
      id: editingId ?? undefined,
      title_sq: form.title_sq,
      title_en: form.title_en,
      description_sq: form.description_sq || null,
      description_en: form.description_en || null,
      slug: form.slug,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      audience_type: form.audience_type,
      starts_at: form.starts_at,
      ends_at: form.ends_at,
      is_active: form.is_active,
      show_on_homepage: form.show_on_homepage,
      product_ids: selectedProducts,
    })

    setLoading(false)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success(editingId ? 'Kampanja u përditësua' : 'Kampanja u krijua')
      reset()
      refresh()
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Fshi kampanjën "${title}"?`)) return
    const result = await deleteCampaignAction(id)
    if (!result.ok) toast.error(result.error)
    else { toast.success('Kampanja u fshi'); refresh() }
  }

  const isActive = (c: Campaign) => c.is_active && new Date(c.starts_at) <= new Date() && new Date(c.ends_at) >= new Date()

  return (
    <div className="max-w-4xl space-y-5">
      {!showForm && (
        <button onClick={() => setShowForm(true)} className="btn-primary gap-2 text-sm">
          <Plus size={15} />
          Kampanjë e Re
        </button>
      )}

      {showForm && (
        <div className="admin-card animate-slide-down">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-text-primary">{editingId ? 'Modifiko Kampanjën' : 'Kampanjë e Re'}</h3>
            <button onClick={reset}><X size={16} className="text-text-muted" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Titulli (Shqip) *</label>
                <input type="text" value={form.title_sq} onChange={e => update('title_sq', e.target.value)} className="input" required />
              </div>
              <div>
                <label className="label">Title (English)</label>
                <input type="text" value={form.title_en} onChange={e => update('title_en', e.target.value)} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Slug</label>
                <input type="text" value={form.slug} onChange={e => update('slug', e.target.value)} className="input font-mono text-sm" />
              </div>
              <div>
                <label className="label">Tipi i Zbritjes</label>
                <select value={form.discount_type} onChange={e => update('discount_type', e.target.value)} className="input">
                  <option value="percentage">Përqindje (%)</option>
                  <option value="fixed">Shumë Fikse (€)</option>
                </select>
              </div>
              <div>
                <label className="label">Vlera e Zbritjes *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                    {form.discount_type === 'percentage' ? '%' : '€'}
                  </span>
                  <input type="number" min="0" step="0.01" value={form.discount_value} onChange={e => update('discount_value', e.target.value)} className="input pl-8" required />
                </div>
              </div>
              <div>
                <label className="label">Fillon më *</label>
                <input type="datetime-local" value={form.starts_at} onChange={e => update('starts_at', e.target.value)} className="input" required />
              </div>
              <div>
                <label className="label">Mbaron më *</label>
                <input type="datetime-local" value={form.ends_at} onChange={e => update('ends_at', e.target.value)} className="input" required />
              </div>
              <div>
                <label className="label">Audienca</label>
                <select value={form.audience_type} onChange={e => update('audience_type', e.target.value)} className="input">
                  <option value="both">Të Gjithë</option>
                  <option value="home">Shtëpi</option>
                  <option value="business">Biznes</option>
                </select>
              </div>
            </div>

            {/* Products selection */}
            <div>
              <label className="label">Produktet në Kampanjë</label>
              <div className="max-h-40 overflow-y-auto border border-surface-border rounded-xl p-2 space-y-1">
                {products.map(p => (
                  <label key={p.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-soft cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(p.id)}
                      onChange={e => setSelectedProducts(prev =>
                        e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id)
                      )}
                      className="w-4 h-4 rounded text-brand-600"
                    />
                    <span className="text-sm text-text-primary">{p.name_sq}</span>
                    <span className="text-xs text-text-muted font-mono ml-auto">{p.sku}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-1">{selectedProducts.length} produkte të zgjedhura</p>
            </div>

            <div className="flex gap-4">
              {[{ k: 'is_active', l: 'Aktive' }, { k: 'show_on_homepage', l: 'Shfaq në Faqe Kryesore' }].map(({ k, l }) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => update(k, !form[k as keyof typeof form])} className={`w-10 h-5 rounded-full relative transition-colors ${form[k as keyof typeof form] ? 'bg-brand-600' : 'bg-surface-muted'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-soft transition-transform ${form[k as keyof typeof form] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-text-secondary">{l}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary gap-2 text-sm py-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {editingId ? 'Ruaj' : 'Krijo Kampanjën'}
              </button>
              <button type="button" onClick={reset} className="btn-secondary text-sm py-2">Anulo</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {initialCampaigns.map(campaign => (
          <div key={campaign.id} className="admin-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Tag size={22} className="text-brand-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-text-primary">{campaign.title_sq}</h3>
                    {isActive(campaign) ? (
                      <Badge variant="success" size="sm">Aktive</Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">Joaktive</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-sm text-text-secondary">
                      {campaign.discount_type === 'percentage'
                        ? `Zbritje ${campaign.discount_value}%`
                        : `Zbritje €${campaign.discount_value}`}
                    </p>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full">
                      {campaign.campaign_products.length} produkte
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(campaign.starts_at).toLocaleDateString('sq-AL')}
                    </span>
                    <span>→</span>
                    <span>{new Date(campaign.ends_at).toLocaleDateString('sq-AL')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setEditingId(campaign.id)
                    setForm({ ...defaultForm, title_sq: campaign.title_sq, title_en: campaign.title_en, description_sq: campaign.description_sq ?? '', description_en: campaign.description_en ?? '', slug: campaign.slug, discount_type: campaign.discount_type, discount_value: campaign.discount_value.toString(), audience_type: campaign.audience_type, starts_at: campaign.starts_at, ends_at: campaign.ends_at, is_active: campaign.is_active, show_on_homepage: campaign.show_on_homepage })
                    setSelectedProducts(campaign.campaign_products.map(cp => cp.product_id))
                    setShowForm(true)
                  }}
                  className="p-1.5 text-text-muted hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                >
                  <Edit size={15} />
                </button>
                <button
                  onClick={() => handleDelete(campaign.id, campaign.title_sq)}
                  className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {initialCampaigns.length === 0 && (
          <div className="admin-card p-12 text-center">
            <Tag size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">Nuk ka kampanja ende</p>
          </div>
        )}
      </div>
    </div>
  )
}
