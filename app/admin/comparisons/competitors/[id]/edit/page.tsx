import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { CompetitorForm } from '../../CompetitorForm'
import type { Competitor } from '@/types'

export default async function EditCompetitorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('competitors').select('*').eq('id', id).single()
  if (!data) notFound()

  return (
    <div>
      <AdminHeader title={`Ndrysho: ${data.name}`} subtitle="Konfigurimi i scraping" />
      <div className="admin-page max-w-2xl">
        <CompetitorForm competitor={data as Competitor} />
      </div>
    </div>
  )
}
