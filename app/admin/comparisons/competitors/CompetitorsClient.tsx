'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLink, Loader2, Pencil, Package, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatAdminDateTime } from '@/lib/comparisons/format-datetime'
import type { Competitor, ScrapeRun } from '@/types'

interface Props {
  competitors: Competitor[]
  initialActiveRuns: ScrapeRun[]
}

async function processUntilDone(runId: string, onProgress: (run: ScrapeRun) => void) {
  let run: ScrapeRun | null = null
  const statusRes = await fetch(`/api/admin/comparisons/scrape/status?runId=${runId}`)
  if (statusRes.ok) {
    const data = await statusRes.json()
    run = data.run as ScrapeRun
    onProgress(run)
    if (run.status === 'completed' || run.status === 'failed') return run
  }

  let done = false
  let guard = 0
  while (!done && guard < 60) {
    guard++
    const batchRes = await fetch('/api/admin/comparisons/scrape/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId }),
    })
    if (!batchRes.ok) throw new Error('Batch scraping dështoi')
    const data = await batchRes.json()
    run = data.run as ScrapeRun
    onProgress(run)
    done = data.done === true || run.status === 'completed' || run.status === 'failed'
    if (run.status === 'failed') throw new Error(run.error_message ?? 'Scraping dështoi')
  }
  return run
}

async function startScrapeRun(competitorId: string): Promise<ScrapeRun> {
  const startRes = await fetch('/api/admin/comparisons/scrape/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ competitorId }),
  })
  if (!startRes.ok) {
    const err = await startRes.json().catch(() => ({}))
    throw new Error(err.error ?? 'Nuk u fillua scraping')
  }
  const { run } = await startRes.json()
  return run as ScrapeRun
}

function isActiveRun(run: ScrapeRun | null | undefined) {
  return run != null && (run.status === 'pending' || run.status === 'running')
}

export function CompetitorsClient({ competitors, initialActiveRuns }: Props) {
  const router = useRouter()
  const resumeStartedRef = useRef<string | null>(null)
  const drivingRef = useRef(false)

  const initialRun = initialActiveRuns[0] ?? null
  const [activeRun, setActiveRun] = useState<ScrapeRun | null>(
    isActiveRun(initialRun) ? initialRun : null
  )

  const scrapingId = isActiveRun(activeRun) ? activeRun!.competitor_id : null
  const scrapingName = scrapingId
    ? competitors.find(c => c.id === scrapingId)?.name
    : null

  const driveScrape = useCallback(
    async (runId: string) => {
      if (drivingRef.current) return
      drivingRef.current = true
      try {
        await processUntilDone(runId, setActiveRun)
        toast.success('Katalogu u përditësua')
        setActiveRun(null)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Gabim gjatë scraping')
        setActiveRun(null)
        router.refresh()
      } finally {
        drivingRef.current = false
      }
    },
    [router]
  )

  useEffect(() => {
    const run = initialActiveRuns[0]
    if (!isActiveRun(run)) return
    if (resumeStartedRef.current === run.id) return
    resumeStartedRef.current = run.id
    setActiveRun(run)
    void driveScrape(run.id)
  }, [initialActiveRuns, driveScrape])

  const handleScrape = async (id: string) => {
    if (scrapingId && scrapingId !== id) {
      toast.error('Prisni të përfundojë scraping i konkurrentit aktual')
      return
    }
    try {
      const run = await startScrapeRun(id)
      setActiveRun(run)
      await driveScrape(run.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gabim gjatë scraping')
      setActiveRun(null)
    }
  }

  return (
    <div className="space-y-4">

      {scrapingId && activeRun && (
        <div className="admin-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-brand-200 bg-brand-50/40">
          <div className="flex items-center gap-2 text-brand-800">
            <Loader2 size={18} className="animate-spin flex-shrink-0" />
            <span className="text-sm font-medium">
              Scraping: {scrapingName ?? 'Konkurrent'}
            </span>
          </div>
          <p className="text-sm text-text-secondary sm:ml-auto tabular-nums">
            Faqe {activeRun.pages_processed} · {activeRun.products_upserted} produkte · {activeRun.status}
          </p>
        </div>
      )}

      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-text-muted bg-surface-soft/50">
              <th className="py-3 px-4 font-medium">Emri</th>
              <th className="py-3 pr-4 font-medium">Katalogu</th>
              <th className="py-3 pr-4 font-medium">Përditësimi</th>
              <th className="py-3 pr-4 font-medium">Statusi</th>
              <th className="py-3 pr-4 font-medium">Scrape</th>
              <th className="py-3 px-4 font-medium text-right">Veprime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {competitors.map(c => {
              const isScraping = scrapingId === c.id
              return (
                <tr key={c.id} className={isScraping ? 'bg-brand-50/30' : undefined}>
                  <td className="py-3 px-4 font-medium text-text-primary">{c.name}</td>
                  <td className="py-3 pr-4">
                    <a
                      href={c.catalog_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:underline inline-flex items-center gap-1 text-xs"
                    >
                      Link <ExternalLink size={12} />
                    </a>
                  </td>
                  <td className="py-3 pr-4 text-xs text-text-muted whitespace-nowrap">
                    {c.last_success_at
                      ? formatAdminDateTime(c.last_success_at)
                      : 'End nuk është bërë'}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`badge text-xs ${c.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      {c.is_active ? 'Aktiv' : 'Joaktiv'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      disabled={Boolean(scrapingId) || !c.is_active}
                      onClick={() => handleScrape(c.id)}
                      className="btn-secondary gap-1.5 text-xs py-1.5 px-3 whitespace-nowrap disabled:opacity-50"
                      title={!c.is_active ? 'Aktivizo konkurrentin për të skrapuar' : undefined}
                    >
                      {isScraping ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Scraping…
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} />
                          Scrape
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/comparisons/competitors/${c.id}/products`}
                        className="p-1.5 rounded-md text-text-muted hover:text-brand-600 hover:bg-brand-50"
                        title="Produktet e skrapuara"
                      >
                        <Package size={14} />
                      </Link>
                      <Link
                        href={`/admin/comparisons/competitors/${c.id}/edit`}
                        className="p-1.5 rounded-md text-text-muted hover:text-brand-600 hover:bg-brand-50"
                        title="Ndrysho"
                      >
                        <Pencil size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
