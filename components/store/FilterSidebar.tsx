'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, X, SlidersHorizontal } from 'lucide-react'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Category, ProductFilters, AudienceType } from '@/types'

interface FilterSidebarProps {
  categories: Category[]
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
  maxPrice?: number
}

function FilterSection({ title, children, defaultOpen = true }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-surface-border pb-5 mb-5 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-sm font-semibold text-text-primary">{title}</span>
        {open ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>
      {open && <div className="animate-fade-in">{children}</div>}
    </div>
  )
}

export function FilterSidebar({ categories, filters, onFiltersChange, maxPrice = 100 }: FilterSidebarProps) {
  const { lang } = useLanguageStore()
  const tr = t(lang)

  const update = (key: keyof ProductFilters, value: unknown) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 })
  }

  const hasActiveFilters = !!(
    filters.category || filters.audience_type || filters.on_sale ||
    filters.in_stock || filters.min_price || filters.max_price
  )

  const audienceOptions: { value: AudienceType | ''; label: string }[] = [
    { value: '', label: tr.shop.allAudiences },
    { value: 'home', label: tr.shop.homeOnly },
    { value: 'business', label: tr.shop.businessOnly },
  ]

  return (
    <div className="bg-white rounded-2xl border border-surface-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-text-secondary" />
          <h2 className="font-bold text-sm text-text-primary">{tr.shop.filters}</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => onFiltersChange({ page: 1 })}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            <X size={12} />
            {tr.shop.clearFilters}
          </button>
        )}
      </div>

      {/* Category */}
      <FilterSection title={tr.shop.category}>
        <div className="space-y-1.5">
          <button
            onClick={() => update('category', undefined)}
            className={cn(
              'w-full text-left text-sm px-3 py-2 rounded-xl transition-colors duration-150',
              !filters.category
                ? 'text-brand-700 bg-brand-50 font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
            )}
          >
            {tr.shop.allCategories}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => update('category', cat.slug)}
              className={cn(
                'w-full text-left text-sm px-3 py-2 rounded-xl transition-colors duration-150',
                filters.category === cat.slug
                  ? 'text-brand-700 bg-brand-50 font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
              )}
            >
              {lang === 'sq' ? cat.name_sq : cat.name_en}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Audience */}
      <FilterSection title={tr.shop.audienceType}>
        <div className="space-y-1.5">
          {audienceOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => update('audience_type', opt.value || undefined)}
              className={cn(
                'w-full text-left text-sm px-3 py-2 rounded-xl transition-colors duration-150',
                (filters.audience_type === opt.value || (!filters.audience_type && !opt.value))
                  ? 'text-brand-700 bg-brand-50 font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title={tr.shop.priceRange}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-text-muted mb-1 block">{lang === 'sq' ? 'Min' : 'Min'}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">€</span>
                <input
                  type="number"
                  min={0}
                  max={maxPrice}
                  value={filters.min_price ?? ''}
                  onChange={e => update('min_price', e.target.value ? Number(e.target.value) : undefined)}
                  className="input pl-7 py-2 text-sm"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-text-muted mb-1 block">{lang === 'sq' ? 'Max' : 'Max'}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">€</span>
                <input
                  type="number"
                  min={0}
                  max={maxPrice}
                  value={filters.max_price ?? ''}
                  onChange={e => update('max_price', e.target.value ? Number(e.target.value) : undefined)}
                  className="input pl-7 py-2 text-sm"
                  placeholder={String(maxPrice)}
                />
              </div>
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Toggles */}
      <FilterSection title={lang === 'sq' ? 'Opsione' : 'Options'} defaultOpen>
        <div className="space-y-3">
          {[
            { key: 'on_sale' as const, label: tr.shop.onSale },
            { key: 'in_stock' as const, label: tr.shop.inStock },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer group">
              <div className={cn(
                'w-10 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0',
                filters[key] ? 'bg-brand-600' : 'bg-surface-muted'
              )}>
                <div className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-soft transition-transform duration-200',
                  filters[key] ? 'translate-x-5' : 'translate-x-0.5'
                )} />
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={!!filters[key]}
                  onChange={e => update(key, e.target.checked || undefined)}
                />
              </div>
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{label}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  )
}
