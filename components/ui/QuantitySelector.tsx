'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantitySelectorProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function QuantitySelector({
  value,
  min = 1,
  max = 999,
  onChange,
  size = 'md',
  className,
}: QuantitySelectorProps) {
  const sizeClasses = {
    sm: { btn: 'w-7 h-7', input: 'w-8 text-xs', icon: 14 },
    md: { btn: 'w-9 h-9', input: 'w-10 text-sm', icon: 16 },
    lg: { btn: 'w-11 h-11', input: 'w-12 text-base', icon: 18 },
  }
  const s = sizeClasses[size]

  return (
    <div className={cn('inline-flex items-center gap-1 bg-surface-muted rounded-xl p-1', className)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn(
          s.btn,
          'flex items-center justify-center rounded-lg bg-white shadow-soft text-text-secondary hover:text-brand-600 hover:shadow-brand-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-text-secondary disabled:hover:shadow-soft'
        )}
      >
        <Minus size={s.icon} />
      </button>
      <span className={cn(s.input, 'text-center font-semibold text-text-primary')}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn(
          s.btn,
          'flex items-center justify-center rounded-lg bg-white shadow-soft text-text-secondary hover:text-brand-600 hover:shadow-brand-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        <Plus size={s.icon} />
      </button>
    </div>
  )
}
