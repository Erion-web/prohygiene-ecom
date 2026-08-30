'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'

interface Props {
  id: string
  orderNumber: string
  redirectTo?: string
  label?: string
}

export function DeleteOrderButton({ id, orderNumber, redirectTo, label }: Props) {
  const [loading, setLoading] = useState(false)
  const refresh = useScrollPreservingRefresh()
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Fshi porosinë ${orderNumber} përgjithmonë? Ky veprim nuk mund të anulohet.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Ndodhi një gabim')
      toast.success(`Porosia ${orderNumber} u fshi`)
      if (redirectTo) router.push(redirectTo)
      else refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ndodhi një gabim')
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className={label
        ? 'btn-ghost gap-1.5 text-sm text-red-600 hover:bg-red-50'
        : 'p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-40'}
      title={`Fshi porosinë ${orderNumber}`}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
      {label}
    </button>
  )
}
