'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Upload, Trash2, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Loader2, ImagePlus, Tag, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { deleteStoredImageAction, uploadImageAction } from '@/lib/actions/images'
import { useRouter } from 'next/navigation'

interface Campaign {
  id: string
  title_sq: string
  slug: string
  is_active: boolean
  ends_at: string
}

interface Banner {
  id: string
  image_url: string
  is_active: boolean
  sort_order: number
  campaign_id: string | null
  campaign?: { id: string; slug: string; title_sq: string } | null
}

interface Props {
  banners: Banner[]
  campaigns: Campaign[]
}

export function BannersClient({ banners: initial, campaigns }: Props) {
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>(initial)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const uploadBanner = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Vetëm imazhe'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'banners')
      const uploaded = await uploadImageAction(formData)
      if (!uploaded.ok) throw new Error(uploaded.error)

      const nextOrder = banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) + 1 : 0

      const { data, error } = await supabase
        .from('banners')
        .insert({ image_url: uploaded.data.url, is_active: true, sort_order: nextOrder, campaign_id: null })
        .select('*, campaign:campaigns(id, slug, title_sq)')
        .single()

      if (error || !data) throw error
      setBanners(prev => [...prev, data])
      toast.success('Baneri u ngarkua — lidhe me një kampanjë!')
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Gabim gjatë ngarkimit')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) uploadBanner(file)
  }, [banners])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadBanner(file)
    e.target.value = ''
  }

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('banners').update({ is_active: !current }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: !current } : b))
  }

  const linkCampaign = async (bannerId: string, campaignId: string | null) => {
    const { error } = await supabase.from('banners').update({ campaign_id: campaignId || null }).eq('id', bannerId)
    if (error) { toast.error(error.message); return }
    const campaign = campaigns.find(c => c.id === campaignId) ?? null
    setBanners(prev => prev.map(b =>
      b.id === bannerId
        ? { ...b, campaign_id: campaignId, campaign: campaign ? { id: campaign.id, slug: campaign.slug, title_sq: campaign.title_sq } : null }
        : b
    ))
    toast.success(campaignId ? 'Kampanja u lidh' : 'Lidhja u hoq')
  }

  const deleteBanner = async (id: string, imageUrl: string) => {
    if (!confirm('Fshi këtë baner?')) return
    await deleteStoredImageAction(imageUrl)
    const { error } = await supabase.from('banners').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setBanners(prev => prev.filter(b => b.id !== id))
    toast.success('Baneri u fshi')
  }

  const moveOrder = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...banners].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex(b => b.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const a = sorted[idx], b = sorted[swapIdx]
    const tmp = a.sort_order; a.sort_order = b.sort_order; b.sort_order = tmp
    await Promise.all([
      supabase.from('banners').update({ sort_order: a.sort_order }).eq('id', a.id),
      supabase.from('banners').update({ sort_order: b.sort_order }).eq('id', b.id),
    ])
    setBanners(prev => prev.map(ban => {
      if (ban.id === a.id) return { ...ban, sort_order: a.sort_order }
      if (ban.id === b.id) return { ...ban, sort_order: b.sort_order }
      return ban
    }))
  }

  const sorted = [...banners].sort((a, b) => a.sort_order - b.sort_order)
  const activeCampaigns = campaigns.filter(c => c.is_active && new Date(c.ends_at) > new Date())

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        className="border-2 border-dashed border-surface-border rounded-2xl p-10 text-center hover:border-brand-400 transition-colors cursor-pointer"
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-brand-600">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm font-medium">Duke ngarkuar...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-text-muted">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center">
              <ImagePlus size={26} className="text-brand-500" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Tërhiq imazhin këtu ose kliko</p>
              <p className="text-xs mt-0.5">PNG, JPG, WebP — rekomanduar 1920×600px</p>
            </div>
            <button type="button" className="btn-primary py-2 px-5 text-sm gap-2 pointer-events-none">
              <Upload size={14} /> Ngarko Baner
            </button>
          </div>
        )}
      </div>

      {/* Info box */}
      {campaigns.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-2">
          <Tag size={16} className="flex-shrink-0 mt-0.5" />
          <span>Nuk ke kampanja ende. <Link href="/admin/campaigns" className="font-semibold underline">Krijo një kampanjë</Link> për të lidhur banerat me faqe të ofertave.</span>
        </div>
      )}

      {/* Banner list */}
      {sorted.length === 0 ? (
        <div className="admin-card p-10 text-center text-text-muted">
          <ImagePlus size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nuk ka banera ende. Ngarko imazhin e parë.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((banner, idx) => (
            <div key={banner.id} className="admin-card p-4 space-y-3">
              <div className="flex items-center gap-4">
                {/* Preview */}
                <div className="relative w-40 h-16 sm:w-48 sm:h-20 rounded-xl overflow-hidden bg-surface-soft flex-shrink-0 border border-surface-border">
                  <Image src={banner.image_url} alt="" fill className="object-cover" sizes="192px" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Baneri {idx + 1}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      banner.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-muted text-text-muted'
                    }`}>
                      {banner.is_active ? 'Aktiv' : 'Fshehur'}
                    </span>
                    {banner.campaign ? (
                      <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                        <Tag size={10} />
                        {banner.campaign.title_sq}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">Pa kampanjë</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => moveOrder(banner.id, 'up')} disabled={idx === 0} className="p-2 rounded-lg hover:bg-surface-muted disabled:opacity-30 transition-colors" title="Lëviz lart">
                    <ArrowUp size={14} />
                  </button>
                  <button onClick={() => moveOrder(banner.id, 'down')} disabled={idx === sorted.length - 1} className="p-2 rounded-lg hover:bg-surface-muted disabled:opacity-30 transition-colors" title="Lëviz poshtë">
                    <ArrowDown size={14} />
                  </button>
                  <button onClick={() => toggleActive(banner.id, banner.is_active)} className={`p-2 rounded-lg transition-colors ${banner.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-text-muted hover:bg-surface-muted'}`} title={banner.is_active ? 'Fshih' : 'Aktivizo'}>
                    {banner.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  {banner.campaign?.slug && (
                    <a href={`/campaigns/${banner.campaign.slug}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Shiko faqen">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button onClick={() => deleteBanner(banner.id, banner.image_url)} className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors" title="Fshi">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Campaign linker */}
              <div className="flex items-center gap-2 pl-1">
                <Tag size={13} className="text-text-muted flex-shrink-0" />
                <select
                  value={banner.campaign_id ?? ''}
                  onChange={e => linkCampaign(banner.id, e.target.value || null)}
                  className="flex-1 text-sm border border-surface-border rounded-xl px-3 py-1.5 bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                >
                  <option value="">— Pa kampanjë (baneri nuk është i klikueshëm) —</option>
                  {activeCampaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.title_sq}</option>
                  ))}
                  {campaigns.filter(c => !c.is_active || new Date(c.ends_at) <= new Date()).map(c => (
                    <option key={c.id} value={c.id} disabled>
                      {c.title_sq} (e skaduar)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-text-muted">
        Banerat me kampanjë të lidhur bëhen të klikueshme — klikimi shkon te faqja e ofertave me produktet e asaj kampanje.
      </p>
    </div>
  )
}
