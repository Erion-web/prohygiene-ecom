import { createServiceClient } from '@/lib/supabase/server'
import type { ComparisonAiSettings } from '@/types'

const DEFAULTS: ComparisonAiSettings = {
  model: 'deepseek-chat',
  temperature: 0.2,
}

export async function getComparisonAiSettings(): Promise<ComparisonAiSettings> {
  const supabase = await createServiceClient()
  const { data } = await supabase.from('app_settings').select('value').eq('key', 'comparison_ai').maybeSingle()
  const raw = data?.value as Partial<ComparisonAiSettings> | undefined
  return {
    model: raw?.model ?? DEFAULTS.model,
    temperature: typeof raw?.temperature === 'number' ? raw.temperature : DEFAULTS.temperature,
  }
}
