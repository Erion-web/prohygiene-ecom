'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin/lease', label: 'Dashboard' },
  { href: '/admin/lease/inquiries', label: 'Kërkesat' },
  { href: '/admin/lease/clients', label: 'Klientët' },
  { href: '/admin/lease/contracts', label: 'Kontratat' },
  { href: '/admin/lease/devices', label: 'Pajisjet' },
  { href: '/admin/lease/categories', label: 'Kategoritë' },
  { href: '/admin/lease/materials', label: 'Lëndët' },
]

export function LeaseSubNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
      {links.map(({ href, label }) => {
        const active = href === '/admin/lease'
          ? pathname === href
          : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              active
                ? 'bg-brand-600 text-white'
                : 'bg-surface-soft text-text-secondary hover:text-brand-600'
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
