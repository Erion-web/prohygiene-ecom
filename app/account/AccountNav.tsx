'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, ShoppingBag, MapPin, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/account',               label: 'Profili',    icon: User,        exact: true },
  { href: '/account/orders',        label: 'Porositë',   icon: ShoppingBag },
  { href: '/account/addresses',     label: 'Adresat',    icon: MapPin },
  { href: '/account/subscriptions', label: 'Abonimi',    icon: RefreshCw },
]

export function AccountNav() {
  const pathname = usePathname()

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <>
      {/* Mobile: horizontal scrollable tabs */}
      <nav className="md:hidden flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {navLinks.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all',
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white border border-surface-border text-text-secondary hover:border-brand-300 hover:text-brand-700'
              )}
            >
              <Icon size={14} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Desktop: vertical card nav */}
      <nav className="hidden md:block card p-2 space-y-0.5">
        {navLinks.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-text-secondary hover:bg-brand-50 hover:text-brand-700'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
