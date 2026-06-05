'use client'

import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'

interface Props {
  id: string
  name: string
  productCount: number
}

export function DeleteBrandButton({ id, name, productCount }: Props) {
  const refresh = useScrollPreservingRefresh()

  const handleDelete = async () => {
    if (productCount > 0) {
      toast.error(`Ky brend ka ${productCount} produkte. Hiqni brendin nga produktet fillimisht.`)
      return
    }
    if (!confirm(`Fshi brendin "${name}"?`)) return

    const supabase = createClient()
    const { error } = await supabase.from('brands').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Brendi u fshi')
      refresh()
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
    >
      <Trash2 size={14} />
    </button>
  )
}
