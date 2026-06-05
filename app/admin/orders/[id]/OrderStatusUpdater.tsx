'use client'

import { useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import { statusLabel } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

export function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [loading, setLoading] = useState(false)
  const refresh = useScrollPreservingRefresh()

  const handleSave = async () => {
    if (status === currentStatus) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      toast.error('Ndodhi një gabim')
    } else {
      toast.success('Statusi u përditësua')
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
        {STATUSES.map(s => (
          <option key={s} value={s}>{statusLabel(s, 'sq')}</option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={loading || status === currentStatus}
        className="btn-primary w-full py-2.5 gap-2 text-sm justify-center"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Ruaj Statusin
      </button>
    </div>
  )
}
