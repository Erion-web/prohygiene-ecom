'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/utils'

interface Item {
  id: string
  product_name_sq: string
  quantity: number
  unit_price: number
  sale_price: number | null
}

export function OrderPricingForm({
  orderId,
  items,
  shippingCost,
}: {
  orderId: string
  items: Item[]
  shippingCost: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(items.map(i => [i.id, String(i.sale_price ?? i.unit_price)])),
  )
  const [shipping, setShipping] = useState(String(shippingCost))

  const num = (v: string) => (v.trim() === '' ? NaN : Number(v))
  const total =
    items.reduce((s, i) => s + (num(prices[i.id]) || 0) * i.quantity, 0) + (num(shipping) || 0)

  const save = async () => {
    const parsed = items.map(i => ({ id: i.id, unit_price: num(prices[i.id]) }))
    const ship = num(shipping)
    if (parsed.some(p => !Number.isFinite(p.unit_price) || p.unit_price < 0) || !Number.isFinite(ship) || ship < 0) {
      toast.error('Vendosni çmime të vlefshme (0 ose më shumë)')
      return
    }
    setLoading(true)
    const res = await fetch(`/api/admin/orders/${orderId}/pricing`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipping_cost: ship, items: parsed }),
    })
    const json = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      toast.error(json.error ?? 'Gabim')
      return
    }
    toast.success(json.changed ? 'Çmimet u ruajtën' : 'Asnjë ndryshim')
    router.push(`/admin/orders/${orderId}`)
    router.refresh()
  }

  return (
    <div className="admin-card space-y-4">
      <h3 className="admin-section-title border-b border-surface-border pb-3">Çmimet</h3>
      <p className="text-xs text-text-muted">
        Çmimi për copë (me TVSH). Ndryshimet regjistrohen te Historia.
      </p>
      <div className="space-y-2">
        {items.map(i => (
          <div key={i.id} className="flex items-center gap-3 text-sm">
            <span className="flex-1 min-w-0 truncate">
              {i.product_name_sq} <span className="text-text-muted">× {i.quantity}</span>
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={prices[i.id]}
              onChange={e => setPrices(p => ({ ...p, [i.id]: e.target.value }))}
              className="input py-1.5 text-sm w-28 text-right"
            />
          </div>
        ))}
        <div className="flex items-center gap-3 text-sm pt-2 border-t border-surface-border">
          <span className="flex-1">Transporti</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={shipping}
            onChange={e => setShipping(e.target.value)}
            className="input py-1.5 text-sm w-28 text-right"
          />
        </div>
        <div className="flex justify-between font-bold pt-2 border-t border-surface-border">
          <span>TOTAL</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={loading} className="btn-primary gap-2 text-sm">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Ruaj çmimet
        </button>
      </div>
    </div>
  )
}
