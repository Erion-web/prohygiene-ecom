import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface AdminKpiCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  change?: string | null
  changePositive?: boolean
  highlight?: boolean
  href?: string
}

export function AdminKpiCard({
  label,
  value,
  icon: Icon,
  change,
  changePositive,
  highlight,
  href,
}: AdminKpiCardProps) {
  const inner = (
    <div className={cn('admin-card h-full', highlight && 'admin-kpi-highlight')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="admin-kpi-value">{value}</p>
          <p className="admin-kpi-label">{label}</p>
          {change && (
            <p className={cn(
              'text-[11px] font-semibold mt-1.5',
              highlight ? 'text-brand-100' : changePositive ? 'text-emerald-600' : 'text-red-500'
            )}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            highlight ? 'bg-white/15' : 'bg-brand-50'
          )}>
            <Icon size={18} className={highlight ? 'text-white' : 'text-brand-600'} />
          </div>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-95 transition-opacity">
        {inner}
      </Link>
    )
  }

  return inner
}
