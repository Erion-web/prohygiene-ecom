'use client'

import Link from 'next/link'
import { Bell, ExternalLink } from 'lucide-react'

interface AdminHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  return (
    <header className="bg-white border-b border-surface-border px-6 py-4 flex items-center justify-between gap-4">
      <div>
        <h1 className="font-bold text-lg text-text-primary">{title}</h1>
        {subtitle && <p className="text-text-muted text-sm mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <Link
          href="/"
          target="_blank"
          className="btn-ghost gap-1.5 text-sm py-2 px-3"
        >
          <ExternalLink size={14} />
          <span className="hidden sm:inline">Shiko dyqanin</span>
        </Link>
        <button className="btn-ghost p-2 relative">
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
