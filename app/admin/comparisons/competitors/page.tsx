import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { CompetitorsClient } from './CompetitorsClient'
import type { Competitor, ScrapeRun } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CompetitorsPage() {
  const supabase = await createClient()
  const [{ data }, { data: activeRuns }] = await Promise.all([
    supabase.from('competitors').select('*').order('name'),
    supabase
      .from('scrape_runs')
      .select('*')
      .in('status', ['pending', 'running'])
      .order('started_at', { ascending: false }),
  ])

  return (
    <div>
      <AdminHeader
        title="Konkurrentët"
        subtitle="URL-të e katalogut dhe kontrolli manual i çmimeve"
        actions={
          <Link href="/admin/comparisons/competitors/new" className="btn-primary gap-2 text-sm py-2">
            <Plus size={16} /> Shto konkurrent
          </Link>
        }
      />
      <div className="admin-page">
        {!(data ?? []).length ? (
          <div className="admin-card p-10 text-center text-text-muted text-sm">
            Shto konkurrentin e parë me URL-në e katalogut publik.
          </div>
        ) : (
          <CompetitorsClient
            competitors={(data ?? []) as Competitor[]}
            initialActiveRuns={(activeRuns ?? []) as ScrapeRun[]}
          />
        )}
      </div>
    </div>
  )
}
