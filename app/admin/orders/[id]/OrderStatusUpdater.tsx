'use client'

import { useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import { applyOrderStockChange } from '@/lib/orders/apply-stock'
import { ORDER_STATUSES, normalizeOrderStatus } from '@/lib/orders/status'
import { statusLabel } from '@/lib/utils'
import type { OrderStatus } from '@/types'

export function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState<OrderStatus>(normalizeOrderStatus(currentStatus))
  const [loading, setLoading] = useState(false)
  const refresh = useScrollPreservingRefresh()

  const handleSave = async () => {
    const previous = normalizeOrderStatus(currentStatus)
    if (status === previous) return
    setLoading(true)
    const supabase = createClient()

    const stockResult = await applyOrderStockChange(supabase, orderId, previous, status)
    if (stockResult.error) {
      toast.error(stockResult.error)
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      await applyOrderStockChange(supabase, orderId, status, previous)
      toast.error('Ndodhi një gabim')
    } else {
      toast.success(status === 'completed' ? 'Statusi u përditësua. Stoku u zbrit.' : 'Statusi u përditësua')
      refresh()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <select
        value={status}
        onChange={e => setStatus(e.target.value as OrderStatus)}
        className="input text-sm"
      >
        {ORDER_STATUSES.map(s => (
          <option key={s} value={s}>{statusLabel(s, 'sq')}</option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={loading || status === normalizeOrderStatus(currentStatus)}
        className="btn-primary w-full py-2.5 gap-2 text-sm justify-center"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Ruaj Statusin
      </button>
    </div>
  )
}
