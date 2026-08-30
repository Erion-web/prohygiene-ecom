'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, ChevronLeft } from 'lucide-react'

interface AdminHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

const BACK_MAP: Record<string, string> = {
  '/admin/products/new':    '/admin/products',
  '/admin/brands/new':      '/admin/brands',
  '/admin/lease/contracts/new': '/admin/lease/contracts',
  '/admin/campaigns':       '/admin',
  '/admin/categories':      '/admin',
  '/admin/brands':          '/admin',
  '/admin/banners':         '/admin',
  '/admin/sales':           '/admin',
  '/admin/subscriptions':   '/admin',
  '/admin/newsletter':      '/admin',
  '/admin/settings':        '/admin',
}

function getBackHref(pathname: string): string | null {
  if (BACK_MAP[pathname]) return BACK_MAP[pathname]
  if (/\/admin\/products\/[^/]+\/edit/.test(pathname)) return '/admin/products'
  if (/\/admin\/brands\/[^/]+\/edit/.test(pathname)) return '/admin/brands'
  if (/\/admin\/orders\/[^/]+/.test(pathname)) return '/admin/orders'
  if (/\/admin\/lease\/contracts\/[^/]+\/edit/.test(pathname)) return '/admin/lease/contracts'
  return null
}

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  const pathname = usePathname()
  const backHref = getBackHref(pathname)

  return (
    <header className="sticky top-0 z-20 bg-surface-soft/95 backdrop-blur-sm border-b border-surface-border px-4 md:px-6 py-3 flex items-center gap-3">
      {backHref && (
        <Link
          href={backHref}
          className="flex-shrink-0 p-1.5 -ml-1 text-text-muted hover:text-text-primary rounded-lg transition-colors"
          aria-label="Kthehu"
        >
          <ChevronLeft size={20} />
        </Link>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-lg text-text-primary leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-text-muted text-xs mt-0.5 hidden sm:block">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-primary px-3 py-2 rounded-full border border-surface-border bg-white hover:bg-surface-soft transition-colors"
        >
          <ExternalLink size={14} />
          <span className="hidden lg:inline">Dyqani</span>
        </Link>
      </div>
    </header>
  )
}
