'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, User, Phone, MapPin, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { CITIES } from '@/lib/cities'

interface Props {
  userId: string
  initialName: string
  email: string
}

export function SetupForm({ userId, initialName, email }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(initialName)
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [customerType, setCustomerType] = useState<'individual' | 'business'>('individual')
  const [businessName, setBusinessName] = useState('')
  const [fiscalNumber, setFiscalNumber] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { toast.error('Emri është i detyrueshëm'); return }
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      email,
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      city: city.trim() || null,
      address: address.trim() || null,
      customer_type: customerType,
      business_name: customerType === 'business' ? businessName.trim() || null : null,
      fiscal_number: customerType === 'business' ? fiscalNumber.trim() || null : null,
      role: 'customer',
    }, { onConflict: 'id' })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Save primary address if provided
    if (address.trim() && city.trim()) {
      await supabase.from('user_addresses').insert({
        user_id: userId,
        label: 'Shtëpi',
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        address: address.trim(),
        city: city.trim(),
        is_primary: true,
      })
    }

    toast.success('Profili u ruajt!')
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Full name */}
      <div>
        <label className="label">Emri i plotë *</label>
        <div className="relative">
          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="input pl-9"
            placeholder="Emri Mbiemri"
            autoComplete="name"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="label">Numri i telefonit</label>
        <div className="relative">
          <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="input pl-9"
            placeholder="+383 4X XXX XXX"
            autoComplete="tel"
          />
        </div>
      </div>

      {/* City + Address */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Qyteti</label>
          <div className="relative">
            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="input pl-9"
              autoComplete="address-level2"
            >
              <option value="">Zgjedh qytetin...</option>
              {CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Adresa</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="input"
            placeholder="Rr. Ismail Qemali 12"
            autoComplete="street-address"
          />
        </div>
      </div>

      {/* Customer type */}
      <div>
        <label className="label">Lloji i llogarisë</label>
        <div className="grid grid-cols-2 gap-2">
          {(['individual', 'business'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setCustomerType(type)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                customerType === type
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-surface-border text-text-secondary hover:border-brand-200'
              }`}
            >
              {type === 'individual'
                ? <><User size={15} /> Individual</>
                : <><Building2 size={15} /> Biznes</>
              }
            </button>
          ))}
        </div>
      </div>

      {/* Business fields */}
      {customerType === 'business' && (
        <div className="space-y-3 p-4 bg-surface-soft rounded-2xl border border-surface-border">
          <div>
            <label className="label">Emri i biznesit</label>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              className="input"
              placeholder="Kompania SH.P.K."
            />
          </div>
          <div>
            <label className="label">Numri fiskal</label>
            <input
              type="text"
              value={fiscalNumber}
              onChange={e => setFiscalNumber(e.target.value)}
              className="input"
              placeholder="600XXXXXXX"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 justify-center text-base"
      >
        {loading
          ? <><Loader2 size={18} className="animate-spin" /> Duke ruajtur...</>
          : 'Vazhdo te Dyqani'
        }
      </button>

      <button
        type="button"
        onClick={() => router.push('/')}
        className="w-full text-center text-sm text-text-muted hover:text-text-secondary transition-colors"
      >
        Kalo për tani →
      </button>
    </form>
  )
}
