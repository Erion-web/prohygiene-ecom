'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, LayoutGrid, List, ChevronDown, Loader2 } from 'lucide-react'
import { ProductCard } from '@/components/store/ProductCard'
import { FilterSidebar } from '@/components/store/FilterSidebar'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import {
  parseShopListParams,
  shopFiltersKey,
  shopListSearchParams,
  type ShopListFilters,
} from '@/lib/shop/query'
import type { Product, Category, ProductFilters } from '@/types'

interface ShopClientProps {
  categories: Category[]
  initialProducts: Product[]
  total: number
  filters: ShopListFilters
  pageSize: number
}

export function ShopClient({
  categories,
  initialProducts,
  total: initialTotal,
  pageSize,
}: ShopClientProps) {
  const { lang } = useLanguageStore()
  const tr = t(lang)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [products, setProducts] = useState(initialProducts)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialTotal)
  const [loadingMore, setLoadingMore] = useState(false)

  const urlFilters = useMemo(
    () => parseShopListParams(Object.fromEntries(searchParams.entries())),
    [searchParams],
  )

  const filtersKey = shopFiltersKey(urlFilters)

  useEffect(() => {
    setProducts(initialProducts)
    setPage(1)
    setTotal(initialTotal)
  }, [initialProducts, initialTotal, filtersKey])

  const filters: ProductFilters = useMemo(() => ({
    category: urlFilters.category,
    audience_type: urlFilters.audience_type,
    search: urlFilters.search,
    on_sale: urlFilters.on_sale,
    in_stock: urlFilters.in_stock,
    featured: urlFilters.featured,
    min_price: urlFilters.min_price,
    max_price: urlFilters.max_price,
    sort: urlFilters.sort,
    page: urlFilters.page,
  }), [urlFilters])

  const sortOptions: { value: NonNullable<ProductFilters['sort']>; label: string }[] = [
    { value: 'newest', label: tr.shop.sortNewest },
    { value: 'price_asc', label: tr.shop.sortPriceAsc },
    { value: 'price_desc', label: tr.shop.sortPriceDesc },
    { value: 'best_sellers', label: tr.shop.sortBestSellers },
  ]

  const hasMore = products.length < total

  const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
    const next: ShopListFilters = {
      category: newFilters.category,
      audience_type: newFilters.audience_type as ShopListFilters['audience_type'],
      search: newFilters.search,
      on_sale: Boolean(newFilters.on_sale),
      in_stock: Boolean(newFilters.in_stock),
      featured: Boolean(newFilters.featured),
      min_price: newFilters.min_price,
      max_price: newFilters.max_price,
      sort: (newFilters.sort ?? 'newest') as ShopListFilters['sort'],
      page: 1,
    }
    const qs = shopListSearchParams(next)
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname])

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    const qs = shopListSearchParams({ ...urlFilters, page: nextPage })
    try {
      const res = await fetch(`/api/store/products?${qs}&pageSize=${pageSize}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json() as { products: Product[]; total: number }
      setProducts(prev => [...prev, ...data.products])
      setPage(nextPage)
      setTotal(data.total)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="animate-fade-in">
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
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20">
              <FilterSidebar
                categories={categories}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden btn-secondary gap-2 py-2 px-3 text-sm"
              >
                <SlidersHorizontal size={16} />
                {tr.shop.filters}
              </button>

              <p className="text-sm text-text-muted flex-1">
                <span className="font-semibold text-text-primary">{total}</span>{' '}
                {tr.shop.products}
              </p>

              <div className="relative">
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-text-muted hidden sm:inline">{tr.shop.sort}:</span>
                  <div className="relative">
                    <select
                      value={filters.sort ?? 'newest'}
                      onChange={e => handleFiltersChange({
                        ...filters,
                        sort: e.target.value as ProductFilters['sort'],
                      })}
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

            {sidebarOpen && (
              <div className="lg:hidden mb-6 animate-slide-down">
                <FilterSidebar
                  categories={categories}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />
              </div>
            )}

            {products.length === 0 ? (
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
                  'grid gap-2',
                  view === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                )}>
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="btn-secondary px-8 py-3 gap-2"
                    >
                      {loadingMore && <Loader2 size={16} className="animate-spin" />}
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
