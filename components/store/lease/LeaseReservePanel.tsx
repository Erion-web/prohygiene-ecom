'use client'

import { ArrowRight } from 'lucide-react'
import { LeaseModalIllustration } from './LeaseIllustrations'

interface LeaseReservePanelProps {
  title: string
  description: string
  priceLabel?: string
  proLabel: string
  ctaLabel: string
  onReserve: () => void
  className?: string
  compact?: boolean
}

export function LeaseReservePanel({
  title,
  description,
  priceLabel,
  proLabel,
  ctaLabel,
  onReserve,
  className = '',
  compact = false,
}: LeaseReservePanelProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-surface-soft shadow-card ${compact ? 'p-5' : 'p-6 sm:p-8'} ${className}`}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-200/30 blur-2xl" aria-hidden />
      <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-brand-100/40 blur-2xl" aria-hidden />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700 mb-2">
            {proLabel}
          </p>
          <h3 className={`font-extrabold text-text-primary tracking-tight text-balance ${compact ? 'text-lg' : 'text-xl sm:text-2xl'} mb-2`}>
            {title}
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed text-pretty">
            {description}
          </p>
          {priceLabel && (
            <p className="mt-3 text-xs font-medium text-text-muted">{priceLabel}</p>
          )}
        </div>

        {!compact && (
          <div className="hidden lg:block flex-shrink-0 opacity-90">
            <LeaseModalIllustration className="w-[120px] h-[96px]" />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onReserve}
        className="relative mt-6 btn-primary w-full sm:w-auto py-3.5 px-8 text-[15px] font-semibold shadow-brand-md hover:shadow-elevated transition-shadow"
      >
        {ctaLabel}
        <ArrowRight size={18} className="opacity-90" />
      </button>
    </div>
  )
}
