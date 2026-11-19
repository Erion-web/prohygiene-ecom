'use client'

import { useState } from 'react'
import { Truck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { ShippingSettings } from '@/lib/settings/shipping'

export function ShippingCard({ initial }: { initial: ShippingSettings }) {
  const [cost, setCost] = useState(String(initial.cost))
  const [threshold, setThreshold] = useState(String(initial.free_threshold))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const next: ShippingSettings = { cost: Number(cost), free_threshold: Number(threshold) }
    if (!Number.isFinite(next.cost) || next.cost < 0 || !Number.isFinite(next.free_threshold) || next.free_threshold < 0) {
      toast.error('Vendosni vlera të vlefshme (0 ose më shumë)')
      return
    }
    setSaving(true)
    const { error } = await createClient()
      .from('app_settings')
      .upsert({ key: 'shipping', value: next })
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Transporti u ruajt')
  }

  return (
    <div className="admin-card">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
          <Truck size={20} className="text-brand-600" />
        </div>
        <div>
          <h3 className="font-bold text-text-primary">Transporti</h3>
          <p className="text-text-muted text-sm">Çmimi i postës dhe pragu për transport falas</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
        <label className="block">
          <span className="text-sm font-medium text-text-primary">Çmimi i transportit (€)</span>
          <input type="number" min={0} step="0.01" value={cost} onChange={e => setCost(e.target.value)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-text-primary">Falas mbi (€)</span>
          <input type="number" min={0} step="0.01" value={threshold} onChange={e => setThreshold(e.target.value)} className="input mt-1" />
        </label>
      </div>
      <p className="text-xs text-text-muted mt-3">
        Vendos pragun në 0 që transporti të jetë gjithmonë falas. Teksti statik në faqe (p.sh. “Transport falas mbi €30”) nuk ndryshon automatikisht.
      </p>

      <button onClick={save} disabled={saving} className="btn-primary mt-5 inline-flex items-center gap-2">
        {saving && <Loader2 size={16} className="animate-spin" />}
        Ruaj
      </button>
    </div>
  )
}
