'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bot,
  Bell,
  CreditCard,
  Globe,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const items: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/admin/settings/payments', label: 'Pagesa', icon: CreditCard },
  { href: '/admin/settings/language', label: 'Gjuha', icon: Globe },
  { href: '/admin/settings/notifications', label: 'Njoftimet', icon: Bell },
  { href: '/admin/settings/security', label: 'Siguria', icon: Shield },
  { href: '/admin/settings/ai', label: 'AI krahasimet', icon: Bot },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <aside className="w-full lg:w-[220px] flex-shrink-0">
      <div className="admin-card p-2 lg:sticky lg:top-[4.25rem]">
        <p className="px-3 pt-2 pb-3 text-[13px] font-medium text-text-muted">
          Cilësimet
        </p>
        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-[14px] font-medium whitespace-nowrap transition-colors duration-150',
                  'border border-transparent',
                  active
                    ? 'bg-surface-soft text-text-primary border-surface-border'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-soft/80'
                )}
              >
                <Icon
                  size={16}
                  className={cn('flex-shrink-0', active ? 'text-brand-600' : 'text-text-muted')}
                />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
