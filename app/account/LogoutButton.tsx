'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props { compact?: boolean }

export function LogoutButton({ compact }: Props) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (compact) {
    return (
      <button
        onClick={handleLogout}
        className="p-2 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
        title="Dil nga llogaria"
      >
        <LogOut size={16} />
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-red-500 hover:bg-red-50 transition-all w-full"
    >
      <LogOut size={16} />
      Dil nga llogaria
    </button>
  )
}
