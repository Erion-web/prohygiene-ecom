'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Loader2, Save, ImagePlus, Star, Home, Building2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { PRODUCT_UNITS, syncProductMaterial, normalizeMaterialUnit } from '@/lib/lease/sync-material'
import type { Product, AudienceType, Material, DeviceMaterial } from '@/types'

interface Category { id: string; name_sq: string; name_en: string }
interface BrandOption { id: string; name: string }

interface DeviceMaterialRow {
  material_id: string
  capacity: string
}

interface ProductFormProps {
  categories: Category[]
  brands: BrandOption[]
  materials?: Material[]
  initialDeviceMaterials?: DeviceMaterial[]
  product?: Product
  defaultForLease?: boolean
  returnTo?: string
}

const MAX_IMAGES = 5

export function ProductForm({ categories, brands, materials = [], initialDeviceMaterials = [], product, defaultForLease, returnTo }: ProductFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  // All images in one flat array; index 0 = cover (image_url), rest = gallery_urls
  const [images, setImages] = useState<string[]>(() => {
    const cover = product?.image_url ?? ''
    const gallery = product?.gallery_urls ?? []
    return [cover, ...gallery].filter(Boolean)
  })
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null)

  const [form, setForm] = useState({
    sku: product?.sku ?? '',
    name_sq: product?.name_sq ?? '',
    name_en: product?.name_en ?? '',
    slug: product?.slug ?? '',
    description_sq: product?.description_sq ?? '',
    description_en: product?.description_en ?? '',
    category_id: product?.category_id ?? '',
    audience_type: product?.audience_type ?? 'both' as AudienceType,
    for_sale: product ? (product.listing_type ?? 'sale') === 'sale' : true,
    for_lease: product
      ? Boolean(product.available_for_lease) || product.listing_type === 'lease'
      : Boolean(defaultForLease),
    price: product?.price?.toString() ?? '',
    sale_price: product?.sale_price?.toString() ?? '',
    stock: product?.stock?.toString() ?? '0',
    unit: product?.unit && ['cope', 'pako', 'ml'].includes(product.unit) ? product.unit : 'cope',
    vat_rate: product?.vat_rate?.toString() ?? '18',
    brand_id: product?.brand_id ?? '',
    is_featured: product?.is_featured ?? false,
    is_best_seller: product?.is_best_seller ?? false,
    is_active: product?.is_active ?? true,
    is_material: product?.is_material ?? false,
  })

  const [deviceMaterialRows, setDeviceMaterialRows] = useState<DeviceMaterialRow[]>(() =>
    initialDeviceMaterials.length > 0
      ? initialDeviceMaterials.map(dm => ({
          material_id: dm.material_id,
          capacity: dm.capacity.toString(),
        }))
      : [{ material_id: '', capacity: '' }]
  )

  const update = (key: string, value: string | boolean) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value }
      if (key === 'name_sq' && !product) {
        updated.slug = slugify(value as string)
      }
      return updated
    })
  }

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('product-images')
      .upload(filename, file, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filename)
    return publicUrl
  }, [supabase])

  const onDrop = useCallback(async (files: File[]) => {
    const slots = MAX_IMAGES - images.length
    const toUpload = files.slice(0, slots)
    if (toUpload.length === 0) {
      toast.error(`Maksimumi ${MAX_IMAGES} imazhe`)
      return
    }
    setUploadingSlot(-1)
    try {
      const urls = await Promise.all(toUpload.map(uploadFile))
      setImages(prev => [...prev, ...urls])
      toast.success(`${urls.length} imazh u ngarkua`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      toast.error(`Gabim: ${msg}`, { duration: 10000 })
    } finally {
      setUploadingSlot(null)
    }
  }, [images.length, uploadFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: MAX_IMAGES,
    disabled: images.length >= MAX_IMAGES,
  })

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  const setCover = (idx: number) => {
    setImages(prev => {
      const next = [...prev]
      const [picked] = next.splice(idx, 1)
      next.unshift(picked)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.sku || !form.name_sq || !form.price) {
      toast.error('Plotësoni fushat e detyrueshme')
      return
    }
    if (!form.for_sale && !form.for_lease && !form.is_material) {
      toast.error('Zgjidhni Shitje, Shfrytëzim, Lëndë e parë, ose një kombinim')
      return
    }
    if (form.is_material && !form.category_id) {
      toast.error('Zgjidhni kategorinë për lëndën e parë')
      return
    }
    setLoading(true)

    const [coverImage, ...galleryImages] = images

    const payload = {
      sku: form.sku,
      name_sq: form.name_sq,
      name_en: form.name_en,
      slug: form.slug,
      description_sq: form.description_sq || null,
      description_en: form.description_en || null,
      category_id: form.category_id || null,
      audience_type: form.audience_type,
      listing_type: form.for_sale ? 'sale' : 'lease',
      available_for_lease: form.for_lease,
      price: parseFloat(form.price),
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      stock: parseInt(form.stock),
      unit: normalizeMaterialUnit(form.unit),
      vat_rate: parseFloat(form.vat_rate),
      image_url: coverImage ?? null,
      gallery_urls: galleryImages,
      brand_id: form.brand_id || null,
      is_featured: form.is_featured,
      is_best_seller: form.is_best_seller,
      is_active: form.is_active,
      is_material: form.is_material,
    }

    let error
    let productId = product?.id
    let syncError: string | null = null

    if (product) {
      const res = await supabase.from('products').update(payload).eq('id', product.id)
      error = res.error
    } else {
      const res = await supabase.from('products').insert(payload).select('id').single()
      error = res.error
      productId = res.data?.id
    }

    if (!error && form.for_lease && productId) {
      await supabase.from('device_materials').delete().eq('product_id', productId)
      const validRows = deviceMaterialRows.filter(r => r.material_id && r.capacity)
      if (validRows.length > 0) {
        const { error: dmError } = await supabase.from('device_materials').insert(
          validRows.map(r => ({
            product_id: productId,
            material_id: r.material_id,
            capacity: parseFloat(r.capacity),
          }))
        )
        if (dmError) error = dmError
      }
    } else if (!error && productId && !form.for_lease) {
      await supabase.from('device_materials').delete().eq('product_id', productId)
    }

    if (!error && productId) {
      const materialSync = await syncProductMaterial(supabase, productId, {
        is_material: form.is_material,
        name_sq: form.name_sq,
        name_en: form.name_en,
        category_id: form.category_id || null,
        unit: form.unit,
        is_active: form.is_active,
      })
      if (materialSync.error) syncError = materialSync.error
    }

    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else if (syncError) {
      toast.error(syncError)
    } else {
      toast.success(product ? 'Produkti u përditësua' : 'Produkti u shtua')
      router.push(returnTo ?? '/admin/products')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {product && (
        <div className="admin-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-lg">
              {form.sku}
            </span>
            <span className={`badge text-xs ${form.is_active ? 'badge-success' : 'badge-neutral'}`}>
              {form.is_active ? 'Aktiv' : 'Joaktiv'}
            </span>
            {form.is_featured && <span className="badge text-xs badge-warning">I zgjedhur</span>}
            {form.is_best_seller && <span className="badge text-xs bg-violet-50 text-violet-700">Bestseller</span>}
            {form.for_sale && <span className="badge text-xs badge-neutral">Shitje</span>}
            {form.for_lease && <span className="badge text-xs bg-cyan-50 text-cyan-700">Shfrytëzim</span>}
            {form.is_material && <span className="badge text-xs bg-emerald-50 text-emerald-700">Lëndë e parë</span>}
          </div>
          <p className="text-xs text-text-muted font-mono truncate max-w-full">
            {form.slug}
          </p>
        </div>
      )}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-5">
        <div className="space-y-5 min-w-0">
          <div className="admin-card space-y-5">
            <div className="flex items-center justify-between gap-3 border-b border-surface-border pb-4">
              <h3 className="admin-section-title">Informacioni Bazë</h3>
            </div>

            <div>
              <label className="label">Lloji i listimit</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => update('for_sale', !form.for_sale)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all ${
                    form.for_sale ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-border text-text-secondary'
                  }`}
                >
                  Shitje (Dyqani)
                </button>
                <button
                  type="button"
                  onClick={() => update('for_lease', !form.for_lease)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all ${
                    form.for_lease ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-border text-text-secondary'
                  }`}
                >
                  Shfrytëzim
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">SKU *</label>
                <input type="text" value={form.sku} onChange={e => update('sku', e.target.value)} className="input" placeholder="PRO-001" required />
              </div>
              <div>
                <label className="label">Njësia *</label>
                <select value={form.unit} onChange={e => update('unit', e.target.value)} className="input" required>
                  {PRODUCT_UNITS.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Emri (Shqip) *</label>
              <input type="text" value={form.name_sq} onChange={e => update('name_sq', e.target.value)} className="input" required />
            </div>

            <div>
              <label className="label">Name (English)</label>
              <input type="text" value={form.name_en} onChange={e => update('name_en', e.target.value)} className="input" />
            </div>

            <div>
              <label className="label">Slug</label>
              <input type="text" value={form.slug} onChange={e => update('slug', e.target.value)} className="input font-mono text-sm" />
            </div>

            <div>
              <label className="label">Përshkrimi (Shqip)</label>
              <textarea value={form.description_sq} onChange={e => update('description_sq', e.target.value)} className="input resize-none h-24" />
            </div>

            <div>
              <label className="label">Description (English)</label>
              <textarea value={form.description_en} onChange={e => update('description_en', e.target.value)} className="input resize-none h-24" />
            </div>
          </div>

          {form.for_lease && (
            <div className="admin-card space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-surface-border pb-4">
                <h3 className="admin-section-title">Lëndët e Pajisjes</h3>
                <button
                  type="button"
                  onClick={() => setDeviceMaterialRows(prev => [...prev, { material_id: '', capacity: '' }])}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  + Shto lëndë
                </button>
              </div>
              {deviceMaterialRows.map((row, idx) => (
                <div key={idx} className="grid sm:grid-cols-[1fr_140px_auto] gap-3 items-end">
                  <div>
                    <label className="label">Materiali</label>
                    <SearchableSelect
                      value={row.material_id}
                      onChange={id => {
                        const next = [...deviceMaterialRows]
                        next[idx] = { ...next[idx], material_id: id }
                        setDeviceMaterialRows(next)
                      }}
                      options={materials.map(m => ({ value: m.id, label: `${m.name_sq} (${m.unit})` }))}
                      searchType="materials"
                      placeholder="Zgjedh..."
                      searchPlaceholder="Kërko materialin..."
                    />
                  </div>
                  <div>
                    <label className="label">Kapaciteti</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.capacity}
                      onChange={e => {
                        const next = [...deviceMaterialRows]
                        next[idx] = { ...next[idx], capacity: e.target.value }
                        setDeviceMaterialRows(next)
                      }}
                      className="input"
                      placeholder="ml / copë"
                    />
                  </div>
                  {deviceMaterialRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDeviceMaterialRows(prev => prev.filter((_, i) => i !== idx))}
                      className="btn-ghost p-2 text-red-500 mb-0.5"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="admin-card space-y-4">
            <div className="border-b border-surface-border pb-4">
              <h3 className="admin-section-title">Çmimet & Stoku</h3>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label className="label">Çmimi (€) *</label>
                <input type="number" step="0.01" min="0" value={form.price} onChange={e => update('price', e.target.value)} className="input" required />
              </div>
              <div>
                <label className="label">Çmimi i Zbritur (€)</label>
                <input type="number" step="0.01" min="0" value={form.sale_price} onChange={e => update('sale_price', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">TVSH (%)</label>
                <input type="number" step="0.01" min="0" value={form.vat_rate} onChange={e => update('vat_rate', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Stoku</label>
                <input type="number" min="0" value={form.stock} onChange={e => update('stock', e.target.value)} className="input" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 xl:sticky xl:top-[4.5rem] xl:self-start">
          <div className="admin-card space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <h3 className="admin-section-title">Imazhet</h3>
              <span className="text-xs text-text-muted">{images.length} / {MAX_IMAGES}</span>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5">
                {images.map((url, idx) => (
                  <div key={url + idx} className="relative group aspect-square rounded-xl overflow-hidden bg-surface-soft border border-surface-border">
                    <Image src={url} alt="" fill className="object-cover" sizes="120px" />

                    {idx === 0 && (
                      <div className="absolute top-1 left-1 bg-brand-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Star size={8} fill="currentColor" /> Cover
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => setCover(idx)}
                          title="Bëje cover"
                          className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-brand-600 hover:bg-brand-50"
                        >
                          <Star size={11} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-red-500 hover:bg-red-50"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {images.length < MAX_IMAGES && (
              <div
                {...getRootProps()}
                className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 py-6 ${
                  isDragActive ? 'border-brand-400 bg-brand-50' : 'border-surface-border hover:border-brand-300 hover:bg-surface-soft'
                }`}
              >
                <input {...getInputProps()} />
                {uploadingSlot !== null ? (
                  <Loader2 size={22} className="animate-spin text-brand-500" />
                ) : (
                  <>
                    <ImagePlus size={22} className="text-text-muted mb-1.5" />
                    <p className="text-xs text-text-muted text-center px-2">
                      {isDragActive
                        ? 'Lëshoni këtu'
                        : images.length === 0
                          ? 'Kliko ose tërhiq imazhin'
                          : `Shto deri në ${MAX_IMAGES - images.length} imazhe`
                      }
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">PNG, JPG, WebP</p>
                  </>
                )}
              </div>
            )}

            <p className="text-[10px] text-text-muted">
              Rri mbi imazh për ta fshirë ose vendosur si cover. Imazhi i parë është kryesori.
            </p>
          </div>

          <div className="admin-card space-y-4">
            <div className="border-b border-surface-border pb-4">
              <h3 className="admin-section-title">Kategoria & Audienca</h3>
            </div>

            <div>
              <label className="label">Kategoria</label>
              <SearchableSelect
                value={form.category_id}
                onChange={id => update('category_id', id)}
                options={categories.map(cat => ({ value: cat.id, label: cat.name_sq }))}
                searchType="categories"
                placeholder="Pa kategori"
                searchPlaceholder="Kërko kategorinë..."
                allowClear
              />
            </div>

            <div>
              <label className="label">Brendi</label>
              <SearchableSelect
                value={form.brand_id}
                onChange={id => update('brand_id', id)}
                options={brands.map(b => ({ value: b.id, label: b.name }))}
                searchType="brands"
                placeholder="Pa brend"
                searchPlaceholder="Kërko brendin..."
                allowClear
              />
            </div>

            <div>
              <label className="label">Audienca</label>
              <div className="flex gap-2">
                {([
                  { key: 'home',     label: 'Shtëpi',    Icon: Home      },
                  { key: 'business', label: 'Biznes',    Icon: Building2 },
                  { key: 'both',     label: 'Të gjithë', Icon: Users     },
                ] as { key: AudienceType; label: string; Icon: React.ElementType }[]).map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => update('audience_type', key)}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                      form.audience_type === key ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-border text-text-secondary hover:border-brand-200'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-card space-y-3">
            <div className="border-b border-surface-border pb-4 mb-1">
              <h3 className="admin-section-title">Opsionet</h3>
            </div>
            {[
              { key: 'is_active', label: 'Aktiv' },
              { key: 'is_featured', label: 'I Zgjedhur' },
              { key: 'is_best_seller', label: 'Bestseller' },
              { key: 'is_material', label: 'Lëndë e parë' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-text-secondary">{label}</span>
                <div
                  onClick={() => update(key, !form[key as keyof typeof form])}
                  className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${form[key as keyof typeof form] ? 'bg-brand-600' : 'bg-surface-muted'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-soft transition-transform duration-200 ${form[key as keyof typeof form] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card sticky bottom-4 z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-brand-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-text-muted hidden sm:block">
          {product ? 'Ruani ndryshimet për ta publikuar në dyqan' : 'Plotësoni fushat e detyrueshme për të krijuar produktin'}
        </p>
        <div className="flex gap-3 sm:ml-auto">
          <button type="button" onClick={() => router.back()} className="btn-secondary py-2.5 px-5 flex-1 sm:flex-none">
            Anulo
          </button>
          <button type="submit" disabled={loading} className="btn-primary py-2.5 px-6 gap-2 flex-1 sm:flex-none">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {product ? 'Ruaj Ndryshimet' : 'Krijo Produktin'}
          </button>
        </div>
      </div>
    </form>
  )
}
