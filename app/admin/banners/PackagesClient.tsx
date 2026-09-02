'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Home, Building2, ChefHat, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { deleteStoredImageAction, uploadImageAction } from '@/lib/actions/images'
import { deleteHomepagePackageAction, saveHomepagePackageAction } from '@/lib/actions/packages'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import type { HomepagePackage, PackageAudience } from '@/types'

const SLOTS: { key: PackageAudience; label: string; hint: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Shtëpi', hint: 'Paketa Shtëpie', icon: Home },
  { key: 'office', label: 'Zyrë', hint: 'Paketa Zyre', icon: Building2 },
  { key: 'horeca', label: 'HORECA', hint: 'Paketa HORECA', icon: ChefHat },
]

interface Props {
  packages: HomepagePackage[]
}

export function PackagesClient({ packages }: Props) {
  const refresh = useScrollPreservingRefresh()
  const [uploading, setUploading] = useState<PackageAudience | null>(null)
  const fileRefs = useRef<Partial<Record<PackageAudience, HTMLInputElement | null>>>({})

  const byAudience = (key: PackageAudience) => packages.find(p => p.audience === key)

  const uploadImage = async (audience: PackageAudience, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vetëm imazhe')
      return
    }
    setUploading(audience)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'packages')
      const uploaded = await uploadImageAction(formData)
      if (!uploaded.ok) throw new Error(uploaded.error)

      const existing = byAudience(audience)
      const result = await saveHomepagePackageAction({ audience, image_url: uploaded.data.url })
      if (!result.ok) throw new Error(result.error)

      if (existing?.image_url) {
        await deleteStoredImageAction(existing.image_url)
      }

      toast.success('Imazhi u ngarkua')
      refresh()
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Gabim gjatë ngarkimit')
    } finally {
      setUploading(null)
    }
  }

  const handleDelete = async (pkg: HomepagePackage) => {
    if (!confirm('Hiq imazhin e kësaj pakete?')) return
    await deleteStoredImageAction(pkg.image_url)
    const result = await deleteHomepagePackageAction(pkg.id)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success('Imazhi u hoq')
      refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-text-primary">Paketat</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Zgjedhni imazhin.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {SLOTS.map(({ key, label, hint, icon: Icon }) => {
          const pkg = byAudience(key)
          const busy = uploading === key
          return (
            <div key={key} className="admin-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon size={15} className="text-brand-600" />
                <div>
                  <p className="text-sm font-bold text-text-primary">{label}</p>
                  <p className="text-[11px] text-text-muted">{hint}</p>
                </div>
              </div>

              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-surface-soft border border-surface-border">
                {pkg?.image_url ? (
                  <Image src={pkg.image_url} alt={label} fill className="object-cover" sizes="280px" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-text-muted">
                    <ImagePlus size={22} className="opacity-40" />
                    <span className="text-[11px]">Pa imazh</span>
                  </div>
                )}
                {busy && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Loader2 size={22} className="animate-spin text-brand-600" />
                  </div>
                )}
              </div>

              <input
                ref={el => { fileRefs.current[key] = el }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) uploadImage(key, file)
                  e.target.value = ''
                }}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRefs.current[key]?.click()}
                  className="btn-primary flex-1 py-2 text-xs gap-1.5"
                >
                  <Upload size={13} />
                  {pkg ? 'Ndrysho' : 'Ngarko'}
                </button>
                {pkg && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete(pkg)}
                    className="p-2 rounded-xl border border-surface-border text-text-muted hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
