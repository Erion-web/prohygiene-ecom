'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatAdminDateTime } from '@/lib/comparisons/format-datetime'
import { formatPrice } from '@/lib/utils'
import type { CompetitorProduct, Product } from '@/types'

interface Props {
  products: CompetitorProduct[]
  ourProducts: Pick<Product, 'id' | 'sku' | 'name_sq'>[]
  matched: number
  page: number
  pageSize: number
  initialQuery: string
}

function pageNumbers(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: Array<number | 'gap'> = [1]
  if (current > 3) pages.push('gap')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p)
  }
  if (current < total - 2) pages.push('gap')
  pages.push(total)
  return pages
}

export function CompetitorProductsClient({
  products,
  ourProducts,
  matched,
  page,
  pageSize,
  initialQuery,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(initialQuery)
  const [savingId, setSavingId] = useState<string | null>(null)
  const filtersRef = useRef({ q: initialQuery, page })

  useEffect(() => {
    setSearch(initialQuery)
    filtersRef.current = { q: initialQuery, page }
  }, [initialQuery, page])

  const pushParams = useCallback(
    (next: { q?: string; page?: number }) => {
      const q = next.q ?? filtersRef.current.q
      const p = next.page ?? filtersRef.current.page
      filtersRef.current = { q, page: p }
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (p > 1) params.set('page', String(p))
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [pathname, router]
  )

  useEffect(() => {
    const q = search.trim()
    if (q === filtersRef.current.q) return
    const timer = window.setTimeout(() => {
      pushParams({ q, page: 1 })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [search, pushParams])

  const setMatch = async (competitorProductId: string, matchedProductId: string | null) => {
    setSavingId(competitorProductId)
    const res = await fetch('/api/admin/comparisons/match', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitorProductId, matchedProductId }),
    })
    setSavingId(null)
    if (!res.ok) {
      toast.error('Lidhja dështoi')
      return
    }
    toast.success('Lidhja u ruajt')
    router.refresh()
  }

  const totalPages = Math.max(1, Math.ceil(matched / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = matched === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, matched)

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            className="input pl-9 pr-9"
            placeholder="Kërko emrin ose SKU-në…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary"
              onClick={() => setSearch('')}
              aria-label="Pastro kërkimin"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <p className="text-sm text-text-muted tabular-nums">
          {matched === 0 ? '0 rezultate' : `${pageStart}–${pageEnd} nga ${matched}`}
        </p>
      </div>

      {matched === 0 ? (
        <div className="admin-card p-10 text-center text-text-muted text-sm">
          {initialQuery
            ? 'Asnjë produkt nuk përputhet me kërkimin.'
            : 'End nuk ka produkte. Përdor Scrape te lista e konkurrentëve.'}
        </div>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-text-muted bg-surface-soft/50">
                <th className="py-3 px-4 font-medium">Produkti i konkurrentit</th>
                <th className="py-3 pr-4 font-medium text-right">Çmimi</th>
                <th className="py-3 pr-4 font-medium">Produkti ynë</th>
                <th className="py-3 px-4 font-medium">Skrapuar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {products.map(p => (
                <tr key={p.id}>
                  <td className="py-3 px-4">
                    <p className="font-medium">{p.name}</p>
                    {p.external_sku && (
                      <p className="text-xs text-text-muted font-mono">{p.external_sku}</p>
                    )}
                    <a
                      href={p.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Link
                    </a>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums font-semibold">
                    {p.price != null ? formatPrice(p.price) : '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      className="input text-xs max-w-xs"
                      disabled={savingId === p.id}
                      value={p.matched_product_id ?? ''}
                      onChange={e => setMatch(p.id, e.target.value || null)}
                    >
                      <option value="">Pa lidhje</option>
                      {ourProducts.map(op => (
                        <option key={op.id} value={op.id}>
                          {op.sku} — {op.name_sq}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-xs text-text-muted whitespace-nowrap">
                    {formatAdminDateTime(p.scraped_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {matched > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <p className="text-sm text-text-muted tabular-nums">
            Faqja {currentPage} nga {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => pushParams({ page: currentPage - 1 })}
              className="btn-secondary p-2 disabled:opacity-40"
              aria-label="Faqja e mëparshme"
            >
              <ChevronLeft size={16} />
            </button>
            {pageNumbers(currentPage, totalPages).map((item, i) =>
              item === 'gap' ? (
                <span key={`gap-${i}`} className="px-2 text-text-muted">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => pushParams({ page: item })}
                  className={
                    item === currentPage
                      ? 'min-w-[2.25rem] h-9 rounded-md bg-brand-50 text-brand-700 text-sm font-medium border border-brand-200'
                      : 'min-w-[2.25rem] h-9 rounded-md text-sm text-text-secondary hover:bg-surface-soft border border-transparent'
                  }
                >
                  {item}
                </button>
              )
            )}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => pushParams({ page: currentPage + 1 })}
              className="btn-secondary p-2 disabled:opacity-40"
              aria-label="Faqja tjetër"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
