'use client'

import { useState } from 'react'
import { Save, Loader2, User, Building2, Phone, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

interface Props {
  profile: Profile | null
  email: string
}

export function ProfileForm({ profile, email }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name:     profile?.full_name ?? '',
    phone:         profile?.phone ?? '',
    city:          profile?.city ?? '',
    address:       profile?.address ?? '',
    customer_type: profile?.customer_type ?? 'individual',
    business_name: profile?.business_name ?? '',
    fiscal_number: profile?.fiscal_number ?? '',
  })

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name:     form.full_name || null,
        phone:         form.phone || null,
        city:          form.city || null,
        address:       form.address || null,
        customer_type: form.customer_type as 'individual' | 'business',
        business_name: form.customer_type === 'business' ? (form.business_name || null) : null,
        fiscal_number: form.customer_type === 'business' ? (form.fiscal_number || null) : null,
      })
      .eq('id', profile?.id ?? '')

    setLoading(false)
    if (error) toast.error(error.message)
    else {
      toast.success('Profili u ruajt')
      router.refresh()
    }
  }

  return (
    <div className="space-y-5">
      {/* Personal info */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-text-primary flex items-center gap-2">
          <User size={16} className="text-brand-500" />
          Të Dhënat Personale
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Emri i plotë</label>
            <input
              value={form.full_name}
              onChange={e => update('full_name', e.target.value)}
              className="input" placeholder="Emri Mbiemri"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              value={email}
              disabled
              className="input opacity-60 cursor-not-allowed bg-surface-muted"
            />
            <p className="text-xs text-text-muted mt-1">Email-i nuk mund të ndryshohet</p>
          </div>
          <div>
            <label className="label">Numri i telefonit</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                className="input pl-9" placeholder="+383 4X XXX XXX"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Account type */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-text-primary flex items-center gap-2">
          <Building2 size={16} className="text-brand-500" />
          Tipi i Llogarisë
        </h2>
        <div className="flex gap-3">
          {(['individual', 'business'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => update('customer_type', type)}
              className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                form.customer_type === type
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-surface-border text-text-secondary hover:border-brand-200'
              }`}
            >
              {type === 'individual' ? 'Individual' : 'Biznes'}
            </button>
          ))}
        </div>
        {form.customer_type === 'business' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Emri i biznesit</label>
              <input
                value={form.business_name}
                onChange={e => update('business_name', e.target.value)}
                className="input" placeholder="SH.P.K. ..."
              />
            </div>
            <div>
              <label className="label">Numri fiskal</label>
              <input
                value={form.fiscal_number}
                onChange={e => update('fiscal_number', e.target.value)}
                className="input" placeholder="600XXXXXXX"
              />
            </div>
          </div>
        )}
      </div>

      {/* Default address */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-text-primary flex items-center gap-2">
          <MapPin size={16} className="text-brand-500" />
          Adresa Kryesore
        </h2>
        <p className="text-xs text-text-muted -mt-2">
          Kjo adresë parapopullohet automatikisht te blerja.
          <a href="/account/addresses" className="text-brand-600 ml-1 hover:underline">Menaxho të gjitha adresat →</a>
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Qyteti</label>
            <input
              value={form.city}
              onChange={e => update('city', e.target.value)}
              className="input" placeholder="Prishtinë"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Adresa</label>
            <input
              value={form.address}
              onChange={e => update('address', e.target.value)}
              className="input" placeholder="Rr. X, Nr. Y, Kati Z"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="btn-primary py-3 px-8 gap-2 w-full sm:w-auto"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Ruaj Ndryshimet
      </button>
    </div>
  )
}
