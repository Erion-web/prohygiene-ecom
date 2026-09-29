import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { ComparisonAiCard } from './ComparisonAiCard'
import type { ComparisonAiSettings } from '@/types'

export default async function SettingsAiPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('app_settings').select('value').eq('key', 'comparison_ai').maybeSingle()
  const initial = (data?.value ?? { model: 'deepseek-chat', temperature: 0.2 }) as ComparisonAiSettings

  return (
    <>
      <AdminHeader title="Cilësimet" subtitle="AI krahasimet" />
      <ComparisonAiCard initial={initial} apiKeyConfigured={Boolean(process.env.DEEPSEEK_API_KEY)} />
    </>
  )
}
