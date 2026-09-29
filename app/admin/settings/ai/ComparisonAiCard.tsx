'use client'

import { useState } from 'react'
import { Bot, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { ComparisonAiSettings } from '@/types'

interface Props {
  initial: ComparisonAiSettings
  apiKeyConfigured: boolean
}

export function ComparisonAiCard({ initial, apiKeyConfigured }: Props) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('app_settings').upsert({
      key: 'comparison_ai',
      value: form,
    })
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Cilësimet AI u ruajtën')
  }

  return (
    <div className="admin-card space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
          <Bot size={20} className="text-brand-600" />
        </div>
        <div>
          <h3 className="font-bold text-text-primary">AI krahasimet</h3>
          <p className="text-text-muted text-sm">
            Modeli lexon vetëm çmimet e ruajtura. Çelësi DeepSeek vendoset në server si DEEPSEEK_API_KEY.
          </p>
        </div>
      </div>

      <div className="text-sm">
        <span className="text-text-secondary">Çelësi API: </span>
        <span className={apiKeyConfigured ? 'text-success font-medium' : 'text-danger font-medium'}>
          {apiKeyConfigured ? 'I konfiguruar' : 'Mungon në mjedis'}
        </span>
      </div>

      <div>
        <label className="label">Modeli</label>
        <input
          className="input font-mono text-sm"
          value={form.model}
          onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
        />
      </div>
      <div>
        <label className="label">Temperatura</label>
        <input
          type="number"
          min={0}
          max={1}
          step={0.1}
          className="input w-32"
          value={form.temperature}
          onChange={e => setForm(f => ({ ...f, temperature: Number(e.target.value) }))}
        />
        <p className="text-xs text-text-muted mt-1">0.2 rekomandohet për çmime.</p>
      </div>

      <button type="button" onClick={save} disabled={saving} className="btn-primary gap-2">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Ruaj
      </button>
    </div>
  )
}
