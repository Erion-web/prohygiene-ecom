'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface Props { id: string; orderNumber: string }

export function DeleteOrderButton({ id, orderNumber }: Props) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Fshi porosinë ${orderNumber} përgjithmonë? Ky veprim nuk mund të anulohet.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success(`Porosia ${orderNumber} u fshi`)
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
      title={`Fshi porosinë ${orderNumber}`}
    >
      <Trash2 size={15} />
    </button>
  )
}
