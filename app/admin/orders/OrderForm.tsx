'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { CITIES } from '@/lib/cities'
import type { CustomerType, Order, PaymentMethod, PaymentStatus } from '@/types'

interface Props {
  order: Order
}

export function OrderForm({ order }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    customer_type: order.customer_type,
    business_name: order.business_name ?? '',
    fiscal_number: order.fiscal_number ?? '',
    city: order.city,
    address: order.address,
    notes: order.notes ?? '',
    payment_method: order.payment_method,
    payment_status: order.payment_status,
  })

  const update = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_name.trim() || !form.customer_email.trim() || !form.customer_phone.trim() || !form.city || !form.address.trim()) {
      toast.error('Plotësoni fushat e detyrueshme')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_type: form.customer_type,
        business_name: form.customer_type === 'business' ? form.business_name.trim() || null : null,
        fiscal_number: form.customer_type === 'business' ? form.fiscal_number.trim() || null : null,
        city: form.city,
        address: form.address.trim(),
        notes: form.notes.trim() || null,
        payment_method: form.payment_method,
        payment_status: form.payment_status,
      })
      .eq('id', order.id)

    if (error) toast.error(error.message)
    else {
      toast.success('Porosia u përditësua')
      router.push(`/admin/orders/${order.id}`)
      router.refresh()
    }
    setLoading(false)
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
              {!CITIES.includes(form.city) && form.city && <option value={form.city}>{form.city}</option>}
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
          Ruaj
        </button>
      </div>
    </form>
  )
}
