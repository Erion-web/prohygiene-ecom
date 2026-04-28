'use client'

import { useState } from 'react'
import { Plus, MapPin, Star, Pencil, Trash2, Save, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Address {
  id: string
  label: string
  full_name: string
  phone: string | null
  city: string
  address: string
  is_primary: boolean
}

interface Props { addresses: Address[]; userId: string }

const emptyForm = { label: 'Shtëpi', full_name: '', phone: '', city: '', address: '' }

export function AddressManager({ addresses, userId }: Props) {
  const router = useRouter()
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [form, setForm]           = useState(emptyForm)

  const u = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const openNew = () => { setForm(emptyForm); setEditId(null); setShowForm(true) }
  const openEdit = (a: Address) => {
    setForm({ label: a.label, full_name: a.full_name, phone: a.phone ?? '', city: a.city, address: a.address })
    setEditId(a.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.full_name || !form.city || !form.address) {
      toast.error('Plotësoni emrin, qytetin dhe adresën')
      return
    }
    setLoading(true)
    const supabase = createClient()

    if (editId) {
      const { error } = await supabase.from('user_addresses').update({
        label:     form.label,
        full_name: form.full_name,
        phone:     form.phone || null,
        city:      form.city,
        address:   form.address,
      }).eq('id', editId)
      if (error) { toast.error(error.message); setLoading(false); return }
    } else {
      const makePrimary = addresses.length === 0
      const { error } = await supabase.from('user_addresses').insert({
        user_id:    userId,
        label:      form.label,
        full_name:  form.full_name,
        phone:      form.phone || null,
        city:       form.city,
        address:    form.address,
        is_primary: makePrimary,
      })
      if (error) { toast.error(error.message); setLoading(false); return }
    }

    toast.success(editId ? 'Adresa u përditësua' : 'Adresa u shtua')
    setShowForm(false)
    setEditId(null)
    setLoading(false)
    router.refresh()
  }

  const makePrimary = async (id: string) => {
    const supabase = createClient()
    await supabase.from('user_addresses').update({ is_primary: false }).eq('user_id', userId)
    await supabase.from('user_addresses').update({ is_primary: true }).eq('id', id)
    toast.success('Adresa kryesore u ndryshua')
    router.refresh()
  }

  const remove = async (id: string) => {
    if (!confirm('Fshi këtë adresë?')) return
    const supabase = createClient()
    const { error } = await supabase.from('user_addresses').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Adresa u fshi'); router.refresh() }
  }

  return (
    <div className="space-y-4">
      {/* Existing addresses */}
      {addresses.map(a => (
        <div key={a.id} className={`card p-4 ${a.is_primary ? 'border-brand-300 bg-brand-50/30' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${a.is_primary ? 'bg-brand-600' : 'bg-surface-muted'}`}>
                <MapPin size={16} className={a.is_primary ? 'text-white' : 'text-text-muted'} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-text-primary text-sm">{a.label}</p>
                  {a.is_primary && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-600 text-white rounded-full flex items-center gap-1">
                      <Star size={8} fill="currentColor" /> Kryesore
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-0.5">{a.full_name}</p>
                <p className="text-xs text-text-muted">{a.address}, {a.city}</p>
                {a.phone && <p className="text-xs text-text-muted">{a.phone}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!a.is_primary && (
                <button
                  onClick={() => makePrimary(a.id)}
                  className="text-xs text-brand-600 hover:underline px-2 py-1 font-medium"
                >
                  Bëje kryesore
                </button>
              )}
              <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => remove(a.id)} className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add form */}
      {showForm ? (
        <div className="card p-5 space-y-4 border-brand-200">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-text-primary text-sm">{editId ? 'Ndrysho Adresën' : 'Adresë e Re'}</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-text-muted" /></button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Etiketa</label>
              <select value={form.label} onChange={e => u('label', e.target.value)} className="input text-sm">
                {['Shtëpi', 'Zyrë', 'Depo', 'Tjetër'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Emri i plotë *</label>
              <input value={form.full_name} onChange={e => u('full_name', e.target.value)} className="input text-sm" placeholder="Emri Mbiemri" />
            </div>
            <div>
              <label className="label">Telefoni</label>
              <input value={form.phone} onChange={e => u('phone', e.target.value)} className="input text-sm" placeholder="+383..." />
            </div>
            <div>
              <label className="label">Qyteti *</label>
              <input value={form.city} onChange={e => u('city', e.target.value)} className="input text-sm" placeholder="Prishtinë" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Adresa *</label>
              <input value={form.address} onChange={e => u('address', e.target.value)} className="input text-sm" placeholder="Rr. X, Nr. Y" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={loading} className="btn-primary py-2 px-5 gap-2 text-sm">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Ruaj
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary py-2 px-4 text-sm">Anulo</button>
          </div>
        </div>
      ) : (
        <button
          onClick={openNew}
          className="w-full card p-4 border-dashed flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:text-brand-600 hover:border-brand-300 transition-all"
        >
          <Plus size={16} /> Shto Adresë të Re
        </button>
      )}
    </div>
  )
}
