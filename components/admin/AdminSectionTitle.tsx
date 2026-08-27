import { cn } from '@/lib/utils'

interface AdminSectionTitleProps {
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function AdminSectionTitle({ children, className, action }: AdminSectionTitleProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <h3 className="admin-section-title">{children}</h3>
      {action}
    </div>
  )
}
