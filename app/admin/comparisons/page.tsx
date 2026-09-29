import { AdminHeader } from '@/components/admin/AdminHeader'
import { formatAdminDateTime } from '@/lib/comparisons/format-datetime'
import { loadComparisonTable, formatComparisonPrice } from '@/lib/comparisons/query-table'
import { formatPrice } from '@/lib/utils'

export default async function ComparisonsPage() {
  const rows = await loadComparisonTable()

  return (
    <div>
      <AdminHeader
        title="Krahasimet"
        subtitle="Çmimet tona krahasuar me konkurrentët (të dhëna të ruajtura nga scraping)"
      />
      <div className="admin-page">
        {!rows.length ? (
          <div className="admin-card p-10 text-center text-text-muted text-sm">
            End nuk ka produkte të lidhura me konkurrentët. Shto konkurrentët dhe përdor Kontrollo tani.
          </div>
        ) : (
          <div className="admin-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-text-muted">
                  <th className="py-3 pr-4 font-medium">Produkti ynë</th>
                  <th className="py-3 pr-4 font-medium text-right">Çmimi ynë</th>
                  <th className="py-3 pr-4 font-medium">Konkurrentët</th>
                  <th className="py-3 pr-4 font-medium text-right">Më i liri</th>
                  <th className="py-3 font-medium">Përditësuar</th>
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
                      <td className="py-3 pr-4">
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
                              <span className="font-semibold tabular-nums">{formatPrice(c.price)}</span>
                              {' '}
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
                      <td className="py-3 text-xs text-text-muted whitespace-nowrap">
                        {latestScrape ? formatAdminDateTime(latestScrape) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
