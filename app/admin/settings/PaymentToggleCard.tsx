'use client'

import { useState } from 'react'
import { CreditCard, Banknote, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface Methods { card: boolean; cash_on_delivery: boolean }
interface Props { initialMethods: Methods }

export function PaymentToggleCard({ initialMethods }: Props) {
  const [methods, setMethods] = useState<Methods>(initialMethods)
  const [saving, setSaving]   = useState<string | null>(null)

  const toggle = async (key: keyof Methods) => {
    // Prevent disabling both
    const newVal = !methods[key]
    const other = key === 'card' ? methods.cash_on_delivery : methods.card
    if (!newVal && !other) {
      toast.error('Duhet të jetë aktive të paktën një metodë pagese')
      return
    }

    setSaving(key)
    const next: Methods = { ...methods, [key]: newVal }
    const supabase = createClient()
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'payment_methods', value: next })

    setSaving(null)
    if (error) {
      toast.error(error.message)
    } else {
      setMethods(next)
      toast.success(newVal ? 'Metoda u aktivizua' : 'Metoda u çaktivizua')
    }
  }

  const items = [
    {
      key: 'card' as const,
      icon: CreditCard,
      label: 'Pagesa me Kartë',
      desc: 'Paysera — Visa, Mastercard, Apple Pay',
    },
    {
      key: 'cash_on_delivery' as const,
      icon: Banknote,
      label: 'Para në Dorëzim (CAD)',
      desc: 'Klienti paguan kur merr porosinë',
    },
  ]

  return (
    <div className="admin-card">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
          <CreditCard size={20} className="text-brand-600" />
        </div>
        <div>
          <h3 className="font-bold text-text-primary">Metodat e Pagesës</h3>
          <p className="text-text-muted text-sm">Aktivizo ose çaktivizo metodat e pagesës për klientët</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map(({ key, icon: Icon, label, desc }) => (
          <div
            key={key}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              methods[key] ? 'border-brand-200 bg-brand-50/40' : 'border-surface-border bg-surface-soft'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${methods[key] ? 'bg-brand-600' : 'bg-surface-muted'}`}>
              <Icon size={18} className={methods[key] ? 'text-white' : 'text-text-muted'} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-primary text-sm">{label}</p>
              <p className="text-xs text-text-muted">{desc}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${methods[key] ? 'text-emerald-600' : 'text-text-muted'}`}>
                {methods[key] ? 'Aktive' : 'Joaktive'}
              </span>
              {saving === key ? (
                <Loader2 size={18} className="animate-spin text-brand-500" />
              ) : (
                <button
                  onClick={() => toggle(key)}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${methods[key] ? 'bg-brand-600' : 'bg-surface-muted'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-soft transition-transform duration-200 ${methods[key] ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
