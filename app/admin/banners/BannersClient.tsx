'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Upload, Trash2, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Loader2, ImagePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Banner {
  id: string
  image_url: string
  is_active: boolean
  sort_order: number
}

interface Props { banners: Banner[] }

export function BannersClient({ banners: initial }: Props) {
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>(initial)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const uploadBanner = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Vetëm imazhe'); return }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('banner-images').upload(path, file, { upsert: false })
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('banner-images').getPublicUrl(path)

      const nextOrder = banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) + 1 : 0
      const { data, error } = await supabase
        .from('banners')
        .insert({ image_url: publicUrl, is_active: true, sort_order: nextOrder })
        .select()
        .single()

      if (error || !data) throw error
      setBanners(prev => [...prev, data])
      toast.success('Baneri u ngarkua')
    } catch (err: any) {
      toast.error(err?.message ?? 'Gabim gjatë ngarkimit')
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

  const deleteBanner = async (id: string, imageUrl: string) => {
    if (!confirm('Fshi këtë baner?')) return
    const path = imageUrl.split('/banner-images/')[1]
    if (path) await supabase.storage.from('banner-images').remove([path])
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

    const a = sorted[idx]
    const b = sorted[swapIdx]
    const tempOrder = a.sort_order
    a.sort_order = b.sort_order
    b.sort_order = tempOrder

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

      {/* Banner list */}
      {sorted.length === 0 ? (
        <div className="admin-card p-10 text-center text-text-muted">
          <ImagePlus size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nuk ka banera ende. Ngarko imazhin e parë.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((banner, idx) => (
            <div key={banner.id} className="admin-card p-4 flex items-center gap-4">
              {/* Preview */}
              <div className="relative w-48 h-20 rounded-xl overflow-hidden bg-surface-soft flex-shrink-0 border border-surface-border">
                <Image src={banner.image_url} alt="" fill className="object-cover" sizes="192px" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  Baneri {idx + 1}
                </p>
                <span className={`inline-flex mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  banner.is_active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-surface-muted text-text-muted'
                }`}>
                  {banner.is_active ? 'Aktiv' : 'Fshehur'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Reorder */}
                <button
                  onClick={() => moveOrder(banner.id, 'up')}
                  disabled={idx === 0}
                  className="p-2 rounded-lg hover:bg-surface-muted disabled:opacity-30 transition-colors"
                  title="Lëviz lart"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => moveOrder(banner.id, 'down')}
                  disabled={idx === sorted.length - 1}
                  className="p-2 rounded-lg hover:bg-surface-muted disabled:opacity-30 transition-colors"
                  title="Lëviz poshtë"
                >
                  <ArrowDown size={14} />
                </button>

                {/* Toggle */}
                <button
                  onClick={() => toggleActive(banner.id, banner.is_active)}
                  className={`p-2 rounded-lg transition-colors ${
                    banner.is_active
                      ? 'text-emerald-600 hover:bg-emerald-50'
                      : 'text-text-muted hover:bg-surface-muted'
                  }`}
                  title={banner.is_active ? 'Fshih' : 'Aktivizo'}
                >
                  {banner.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteBanner(banner.id, banner.image_url)}
                  className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Fshi"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-text-muted">
        Banerat shfaqen në karusel sipas rendit. Vetëm banerat aktivë shfaqen në faqen kryesore.
      </p>
    </div>
  )
}
