'use client'

import { useState } from 'react'
import { Truck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'

export function FalconSendButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const refresh = useScrollPreservingRefresh()

  const handleSend = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/falcon-send`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Gabim')
      toast.success('Porosia u dërgua te Falcon Posta!')
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gabim')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSend}
      disabled={loading}
      className="btn-primary w-full py-2.5 gap-2 text-sm justify-center"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Truck size={15} />}
      Dërgo në Falcon Posta
    </button>
  )
}
