'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Save, Trash2, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { CITIES, isCity } from '@/lib/cities'
import { formatPrice } from '@/lib/utils'
import { SearchableSelect } from '@/components/ui/searchable-select'
import type { CustomerType, PaymentMethod, PaymentStatus } from '@/types'

interface OrderLine {
  productId: string
  nameSq: string
  nameEn: string
  sku: string
  imageUrl: string | null
  listPrice: number
  effectivePrice: number
  quantity: number
}

export function NewOrderForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [addingProduct, setAddingProduct] = useState('')
  const [lines, setLines] = useState<OrderLine[]>([])
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_type: 'individual' as CustomerType,
    business_name: '',
    fiscal_number: '',
    city: 'Prishtinë',
    address: '',
    notes: '',
    payment_method: 'cash_on_delivery' as PaymentMethod,
    payment_status: 'pending' as PaymentStatus,
    shipping_cost: '0',
  })

  const update = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const addProduct = async (productId: string) => {
    if (!productId) return
    if (lines.some(l => l.productId === productId)) {
      toast.error('Ky produkt është shtuar tashmë')
      setAddingProduct('')
      return
    }
    const supabase = createClient()
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name_sq, name_en, sku, price, sale_price, image_url')
      .eq('id', productId)
      .single()

    if (error || !product) {
      toast.error('Produkti nuk u gjet')
      setAddingProduct('')
      return
    }

    setLines(prev => [
      ...prev,
      {
        productId: product.id,
        nameSq: product.name_sq,
        nameEn: product.name_en,
        sku: product.sku,
        imageUrl: product.image_url,
        listPrice: product.price,
        effectivePrice: product.sale_price ?? product.price,
        quantity: 1,
      },
    ])
    setAddingProduct('')
  }

  const updateLine = (productId: string, patch: Partial<Pick<OrderLine, 'quantity' | 'effectivePrice'>>) => {
    setLines(prev => prev.map(l => (l.productId === productId ? { ...l, ...patch } : l)))
  }

  const removeLine = (productId: string) => {
    setLines(prev => prev.filter(l => l.productId !== productId))
  }

  const listSubtotal = lines.reduce((sum, l) => sum + l.listPrice * l.quantity, 0)
  const effectiveSubtotal = lines.reduce((sum, l) => sum + l.effectivePrice * l.quantity, 0)
  const discountAmount = Math.max(0, listSubtotal - effectiveSubtotal)
  const shippingCost = Number(form.shipping_cost) || 0
  const total = effectiveSubtotal + shippingCost
  const vatAmount = total * 0.18

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_name.trim() || !form.customer_email.trim() || !form.customer_phone.trim() || !form.city || !form.address.trim()) {
      toast.error('Plotësoni fushat e detyrueshme')
      return
    }
    if (lines.length === 0) {
      toast.error('Shtoni të paktën një produkt')
      return
    }

    setLoading(true)
    try {
      const orderPayload = {
        user_id: null,
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_type: form.customer_type,
        business_name: form.customer_type === 'business' ? form.business_name.trim() || null : null,
        fiscal_number: form.customer_type === 'business' ? form.fiscal_number.trim() || null : null,
        city: form.city,
        address: form.address.trim(),
        notes: form.notes.trim() || null,
        subtotal: listSubtotal,
        discount_amount: discountAmount,
        shipping_cost: shippingCost,
        vat_amount: vatAmount,
        total,
        status: 'pending',
        payment_method: form.payment_method,
        payment_status: form.payment_status,
      }

      const orderItems = lines.map(l => ({
        product_id: l.productId,
        product_name_sq: l.nameSq,
        product_name_en: l.nameEn,
        product_sku: l.sku,
        product_image_url: l.imageUrl,
        unit_price: l.listPrice,
        sale_price: l.effectivePrice < l.listPrice ? l.effectivePrice : null,
        quantity: l.quantity,
        subtotal: l.effectivePrice * l.quantity,
      }))

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderPayload, items: orderItems }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Krijimi i porosisë dështoi')

      toast.success('Porosia u krijua')
      router.push(`/admin/orders/${data.order.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Diçka shkoi keq')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="admin-card space-y-4">
        <h3 className="admin-section-title border-b border-surface-border pb-3">Klienti</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Emri *</label>
            <input value={form.customer_name} onChange={e => update('customer_name', e.target.value)} className="input" required />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" value={form.customer_email} onChange={e => update('customer_email', e.target.value)} className="input" required />
          </div>
          <div>
            <label className="label">Telefoni *</label>
            <input value={form.customer_phone} onChange={e => update('customer_phone', e.target.value)} className="input" required />
          </div>
          <div>
            <label className="label">Tipi</label>
            <select
              value={form.customer_type}
              onChange={e => update('customer_type', e.target.value as CustomerType)}
              className="input"
            >
              <option value="individual">Individual</option>
              <option value="business">Biznes</option>
            </select>
          </div>
          {form.customer_type === 'business' && (
            <>
              <div>
                <label className="label">Biznesi</label>
                <input value={form.business_name} onChange={e => update('business_name', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Nr. Fiskal</label>
                <input value={form.fiscal_number} onChange={e => update('fiscal_number', e.target.value)} className="input" />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="admin-card space-y-4">
        <h3 className="admin-section-title border-b border-surface-border pb-3">Dërgimi</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Qyteti *</label>
            <select value={form.city} onChange={e => update('city', e.target.value)} className="input" required>
              {!isCity(form.city) && form.city && <option value={form.city}>{form.city}</option>}
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Adresa *</label>
            <input value={form.address} onChange={e => update('address', e.target.value)} className="input" required />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Shënime</label>
            <textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="input min-h-24" />
          </div>
        </div>
      </div>

      <div className="admin-card space-y-4">
        <h3 className="admin-section-title border-b border-surface-border pb-3">Artikujt</h3>

        <SearchableSelect
          value={addingProduct}
          onChange={addProduct}
          options={[]}
          searchType="products"
          placeholder="Shto produkt..."
          searchPlaceholder="Kërko produkt ose SKU..."
        />

        {lines.length > 0 && (
          <div className="space-y-2">
            {lines.map(line => (
              <div key={line.productId} className="flex items-center gap-3 p-3 bg-surface-soft rounded-xl">
                <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-surface-border">
                  {line.imageUrl ? (
                    <Image src={line.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package size={16} className="text-text-muted" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm truncate">{line.nameSq}</p>
                  <p className="text-xs text-text-muted font-mono">{line.sku}</p>
                </div>
                <div className="w-20">
                  <label className="text-[10px] text-text-muted block mb-0.5">Sasia</label>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={e => updateLine(line.productId, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                    className="input py-1.5 text-sm"
                  />
                </div>
                <div className="w-24">
                  <label className="text-[10px] text-text-muted block mb-0.5">Çmimi</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.effectivePrice}
                    onChange={e => updateLine(line.productId, { effectivePrice: Math.max(0, Number(e.target.value) || 0) })}
                    className="input py-1.5 text-sm"
                  />
                </div>
                <div className="w-20 text-right text-sm font-bold text-text-primary flex-shrink-0">
                  {formatPrice(line.effectivePrice * line.quantity)}
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(line.productId)}
                  className="p-2 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-surface-border pt-4 space-y-2">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Nëntotali</span>
            <span>{formatPrice(listSubtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Zbritja</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-text-secondary gap-3">
            <span>Transporti</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.shipping_cost}
              onChange={e => update('shipping_cost', e.target.value)}
              className="input py-1.5 text-sm w-28 text-right"
            />
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-surface-border">
            <span>TOTAL</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="admin-card space-y-4">
        <h3 className="admin-section-title border-b border-surface-border pb-3">Pagesa</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Metoda</label>
            <select
              value={form.payment_method}
              onChange={e => update('payment_method', e.target.value as PaymentMethod)}
              className="input"
            >
              <option value="cash_on_delivery">Kesh</option>
              <option value="card">Kartë</option>
            </select>
          </div>
          <div>
            <label className="label">Statusi i pagesës</label>
            <select
              value={form.payment_status}
              onChange={e => update('payment_status', e.target.value as PaymentStatus)}
              className="input"
            >
              <option value="pending">Në pritje</option>
              <option value="approved">Aprovuar</option>
              <option value="declined">Refuzuar</option>
              <option value="cancelled">Anuluar</option>
              <option value="needs_clarification">Kërkon sqarim</option>
            </select>
          </div>
        </div>
      </div>

      <div className="admin-card sticky bottom-4 z-10 flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary gap-2 text-sm">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Krijo Porosinë
        </button>
      </div>
    </form>
  )
}
