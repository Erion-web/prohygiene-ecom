'use client'

import Link from 'next/link'
import { ArrowRight, Package, ShoppingBag, Tag } from 'lucide-react'

const quickActions = [
  { href: '/admin/products/new', label: 'Shto Produkt', icon: Package },
  { href: '/admin/orders', label: 'Porositë', icon: ShoppingBag },
  { href: '/admin/campaigns', label: 'Kampanja', icon: Tag },
]

export function AdminQuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {quickActions.map(action => (
        <Link
          key={action.href}
          href={action.href}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-surface-border text-xs font-semibold text-text-secondary hover:text-brand-700 hover:border-brand-200 hover:bg-brand-50 transition-colors"
        >
          <action.icon size={14} />
          {action.label}
          <ArrowRight size={12} className="opacity-50" />
        </Link>
      ))}
    </div>
  )
}
