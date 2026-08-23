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
  return null
}

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  const pathname = usePathname()
  const backHref = getBackHref(pathname)

  return (
    <header className="bg-white border-b border-surface-border px-4 md:px-6 py-3 md:py-4 flex items-center gap-3">
      {/* Back button on mobile sub-pages */}
      {backHref && (
        <Link
          href={backHref}
          className="md:hidden flex-shrink-0 p-1.5 -ml-1 text-text-muted hover:text-text-primary rounded-lg transition-colors"
        >
          <ChevronLeft size={22} />
        </Link>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-base md:text-lg text-text-primary leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-text-muted text-xs mt-0.5 hidden sm:block">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface-soft transition-colors"
        >
          <ExternalLink size={14} />
          <span className="hidden lg:inline">Dyqani</span>
        </Link>
      </div>
    </header>
  )
}
