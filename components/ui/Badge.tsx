import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'sale'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'neutral', size = 'md', children, className }: BadgeProps) {
  const variantClasses = {
    brand: 'bg-brand-100 text-brand-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    neutral: 'bg-slate-100 text-slate-600',
    sale: 'bg-red-500 text-white',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 font-semibold rounded-full',
      variantClasses[variant],
      sizeClasses[size],
      className
    )}>
      {children}
    </span>
  )
}
