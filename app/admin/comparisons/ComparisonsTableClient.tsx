'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { formatAdminDateTime } from '@/lib/comparisons/format-datetime'
import type { ComparisonTableRow } from '@/lib/comparisons/query-table'
import { formatPrice } from '@/lib/utils'

function formatComparisonPrice(n: number | null) {
  if (n == null) return '—'
  return formatPrice(n)
}

interface Props {
  rows: ComparisonTableRow[]
  total: number
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

export function ComparisonsTableClient({
  rows,
  total,
  page,
  pageSize,
  initialQuery,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(initialQuery)
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, total)

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            className="input pl-9 pr-9"
            placeholder="Kërko produkt, SKU ose konkurrent…"
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
          {total === 0 ? '0 rezultate' : `${pageStart}–${pageEnd} nga ${total}`}
        </p>
      </div>

      {total === 0 ? (
        <div className="admin-card p-10 text-center text-text-muted text-sm">
          {initialQuery
            ? 'Asnjë produkt nuk përputhet me kërkimin.'
            : 'End nuk ka produkte të lidhura me konkurrentët. Shto konkurrentët dhe përdor Scrape.'}
        </div>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-text-muted bg-surface-soft/50">
                <th className="py-3 px-4 font-medium">Produkti ynë</th>
                <th className="py-3 pr-4 font-medium text-right">Çmimi ynë</th>
                <th className="py-3 pr-4 font-medium">Konkurrentët</th>
                <th className="py-3 pr-4 font-medium text-right">Më i liri</th>
                <th className="py-3 px-4 font-medium">Përditësuar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {rows.map(row => {
                const latestScrape = row.competitors.reduce(
                  (max, c) => (c.scrapedAt > max ? c.scrapedAt : max),
                  ''
                )
                return (
                  <tr key={row.ourProductId} className="align-top">
                    <td className="py-3 px-4">
                      <p className="font-medium text-text-primary">{row.name_sq}</p>
                      <p className="text-xs text-text-muted font-mono">{row.sku}</p>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums font-semibold">
                      {formatPrice(row.ourPrice)}
                    </td>
                    <td className="py-3 pr-4">
                      <ul className="space-y-1">
                        {row.competitors.map(c => (
                          <li key={c.competitorProductId} className="text-xs">
                            <span className="text-text-secondary">{c.competitorName}: </span>
                            <span className="font-semibold tabular-nums">{formatPrice(c.price)}</span>{' '}
                            <a
                              href={c.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-600 hover:underline"
                            >
                              Link
                            </a>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {row.cheapestCompetitor ? (
                        <div>
                          <p className="font-semibold">{formatComparisonPrice(row.cheapestPrice)}</p>
                          <p className="text-xs text-text-muted">{row.cheapestCompetitor}</p>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-text-muted whitespace-nowrap">
                      {latestScrape ? formatAdminDateTime(latestScrape) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > pageSize && (
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
