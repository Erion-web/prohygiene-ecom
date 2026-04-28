'use client'

import { Pause, Play, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface Props { id: string; isActive: boolean }

export function SubscriptionActions({ id, isActive }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const toggle = async () => {
    const { error } = await supabase
      .from('subscriptions')
      .update({ is_active: !isActive })
      .eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success(isActive ? 'Paketa u pauzua' : 'Paketa u aktivizua')
      router.refresh()
    }
  }

  const remove = async () => {
    if (!confirm('Fshi këtë paketë periodike?')) return
    const { error } = await supabase.from('subscriptions').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Paketa u fshi')
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggle}
        className="p-1.5 rounded-lg text-text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
        title={isActive ? 'Pauzo' : 'Aktivizo'}
      >
        {isActive ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button
        onClick={remove}
        className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Fshi"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
