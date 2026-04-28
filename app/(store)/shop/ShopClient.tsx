'use client'

import { useState, useMemo, useCallback } from 'react'
import { SlidersHorizontal, LayoutGrid, List, ChevronDown } from 'lucide-react'
import { ProductCard } from '@/components/store/ProductCard'
import { FilterSidebar } from '@/components/store/FilterSidebar'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { getEffectivePrice, getProductName } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Product, Category, ProductFilters, AudienceType } from '@/types'

interface ShopClientProps {
  categories: Category[]
  initialProducts: Product[]
  searchParams: Record<string, string | string[] | undefined>
}

const PER_PAGE = 24

function getParam(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const val = params[key]
  return Array.isArray(val) ? val[0] : val
}

export function ShopClient({ categories, initialProducts, searchParams }: ShopClientProps) {
  const { lang } = useLanguageStore()
  const tr = t(lang)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)

  const [filters, setFilters] = useState<ProductFilters>({
    category: getParam(searchParams, 'category'),
    audience_type: getParam(searchParams, 'audience_type') as AudienceType | undefined,
    search: getParam(searchParams, 'search'),
    on_sale: getParam(searchParams, 'on_sale') === 'true',
    in_stock: getParam(searchParams, 'in_stock') === 'true',
    featured: getParam(searchParams, 'featured') === 'true',
    sort: (getParam(searchParams, 'sort') as ProductFilters['sort']) ?? 'newest',
    page: 1,
  })

  const sortOptions: { value: NonNullable<ProductFilters['sort']>; label: string }[] = [
    { value: 'newest', label: tr.shop.sortNewest },
    { value: 'price_asc', label: tr.shop.sortPriceAsc },
    { value: 'price_desc', label: tr.shop.sortPriceDesc },
    { value: 'best_sellers', label: tr.shop.sortBestSellers },
  ]

  const filteredProducts = useMemo(() => {
    let products = [...initialProducts]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      products = products.filter(p =>
        p.name_sq.toLowerCase().includes(q) ||
        p.name_en.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      )
    }

    if (filters.category) {
      products = products.filter(p => p.category?.slug === filters.category)
    }

    if (filters.audience_type) {
      products = products.filter(p =>
        p.audience_type === filters.audience_type || p.audience_type === 'both'
      )
    }

    if (filters.on_sale) {
      products = products.filter(p => p.sale_price != null || p.effective_price != null)
    }

    if (filters.in_stock) {
      products = products.filter(p => p.stock > 0)
    }

    if (filters.min_price) {
      products = products.filter(p => getEffectivePrice(p) >= filters.min_price!)
    }

    if (filters.max_price) {
      products = products.filter(p => getEffectivePrice(p) <= filters.max_price!)
    }

    if (filters.featured) {
      products = products.filter(p => p.is_featured)
    }

    // Sort
    switch (filters.sort) {
      case 'price_asc':
        products.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b))
        break
      case 'price_desc':
        products.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a))
        break
      case 'best_sellers':
        products.sort((a, b) => (b.is_best_seller ? 1 : 0) - (a.is_best_seller ? 1 : 0))
        break
      default:
        products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return products
  }, [initialProducts, filters])

  const paginatedProducts = filteredProducts.slice(0, page * PER_PAGE)
  const hasMore = paginatedProducts.length < filteredProducts.length

  const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="bg-surface-soft border-b border-surface-border">
        <div className="container-custom py-4 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary mb-1">{tr.shop.title}</h1>
          <p className="text-text-secondary text-sm">{tr.shop.subtitle}</p>
          {filters.search && (
            <p className="text-sm text-brand-600 font-medium mt-2">
              {tr.shop.searchResults}: &ldquo;{filters.search}&rdquo;
            </p>
          )}
        </div>
      </div>

      <div className="container-custom py-4 sm:py-6">
        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20">
              <FilterSidebar
                categories={categories}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-6">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden btn-secondary gap-2 py-2 px-3 text-sm"
              >
                <SlidersHorizontal size={16} />
                {tr.shop.filters}
              </button>

              {/* Count */}
              <p className="text-sm text-text-muted flex-1">
                <span className="font-semibold text-text-primary">{filteredProducts.length}</span>{' '}
                {tr.shop.products}
              </p>

              {/* Sort */}
              <div className="relative">
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-text-muted hidden sm:inline">{tr.shop.sort}:</span>
                  <div className="relative">
                    <select
                      value={filters.sort ?? 'newest'}
                      onChange={e => handleFiltersChange({ ...filters, sort: e.target.value as ProductFilters['sort'] })}
                      className="appearance-none bg-white border border-surface-border rounded-xl pl-3 pr-8 py-2 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 cursor-pointer"
                    >
                      {sortOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* View toggle */}
              <div className="hidden sm:flex items-center gap-1 bg-surface-muted rounded-lg p-1">
                <button
                  onClick={() => setView('grid')}
                  className={cn('p-1.5 rounded-md transition-all duration-150', view === 'grid' ? 'bg-white shadow-soft text-brand-600' : 'text-text-muted hover:text-text-secondary')}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={cn('p-1.5 rounded-md transition-all duration-150', view === 'list' ? 'bg-white shadow-soft text-brand-600' : 'text-text-muted hover:text-text-secondary')}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
              <div className="lg:hidden mb-6 animate-slide-down">
                <FilterSidebar
                  categories={categories}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />
              </div>
            )}

            {/* Grid */}
            {filteredProducts.length === 0 ? (
              <EmptyState
                title={tr.shop.noProducts}
                description={tr.shop.noProductsDesc}
                action={
                  <button
                    onClick={() => handleFiltersChange({ page: 1 })}
                    className="btn-secondary"
                  >
                    {tr.shop.clearFilters}
                  </button>
                }
              />
            ) : (
              <>
                <div className={cn(
                  'grid gap-4 md:gap-6',
                  view === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                )}>
                  {paginatedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-10 flex justify-center">
                    <button
                      onClick={() => setPage(p => p + 1)}
                      className="btn-secondary px-8 py-3"
                    >
                      {tr.shop.loadMore}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
