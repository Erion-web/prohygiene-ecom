'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/admin/comparisons', label: 'Tabela e çmimeve', exact: true },
  { href: '/admin/comparisons/competitors', label: 'Konkurrentët' },
  { href: '/admin/comparisons/chat', label: 'Asistenti AI' },
]

export default function ComparisonsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div>
      <div className="border-b border-surface-border bg-white px-4 md:px-6">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map(tab => {
            const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                  active
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
      {children}
    </div>
  )
}
