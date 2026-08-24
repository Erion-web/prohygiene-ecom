'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import { LEASE_PAYMENT_LABELS } from '@/lib/lease/utils'
import type { LeaseClient, LeasePaymentStatus } from '@/types'

interface Props {
  initialClients: LeaseClient[]
}

const defaultForm = {
  company_name: '',
  contact_name: '',
  email: '',
  phone: '',
  city: '',
  address: '',
  employee_count: '0',
  payment_status: 'paid' as LeasePaymentStatus,
  notes: '',
}

export function LeaseClientsClient({ initialClients }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const refresh = useScrollPreservingRefresh()

  const update = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const reset = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(defaultForm)
  }

  const startEdit = (c: LeaseClient) => {
    setEditingId(c.id)
    setForm({
      company_name: c.company_name,
      contact_name: c.contact_name,
      email: c.email,
      phone: c.phone ?? '',
      city: c.city ?? '',
      address: c.address ?? '',
      employee_count: c.employee_count.toString(),
      payment_status: c.payment_status,
      notes: c.notes ?? '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company_name || !form.contact_name || !form.email) {
      toast.error('Plotësoni fushat e detyrueshme')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const payload = {
      company_name: form.company_name,
      contact_name: form.contact_name,
      email: form.email,
      phone: form.phone || null,
      city: form.city || null,
      address: form.address || null,
      employee_count: parseInt(form.employee_count) || 0,
      payment_status: form.payment_status,
      notes: form.notes || null,
    }

    const { error } = editingId
      ? await supabase.from('lease_clients').update(payload).eq('id', editingId)
      : await supabase.from('lease_clients').insert(payload)

    if (error) toast.error(error.message)
    else {
      toast.success(editingId ? 'Klienti u përditësua' : 'Klienti u shtua')
      reset()
      refresh()
    }
    setLoading(false)
  }

  const handleDelete = async (c: LeaseClient) => {
    if (!confirm(`Fshi klientin "${c.company_name}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('lease_clients').delete().eq('id', c.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Klienti u fshi')
      refresh()
    }
  }

  return (
    <div className="space-y-3">
      {!showForm && (
        <button onClick={() => setShowForm(true)} className="btn-primary gap-2 text-sm">
          <Plus size={15} />
          Shto Klient
        </button>
      )}

      {showForm && (
        <div className="admin-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold">{editingId ? 'Modifiko Klientin' : 'Klient i Ri'}</h3>
            <button type="button" onClick={reset} className="btn-ghost p-1.5"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Kompania *</label>
              <input value={form.company_name} onChange={e => update('company_name', e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Kontakti *</label>
              <input value={form.contact_name} onChange={e => update('contact_name', e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Telefoni</label>
              <input value={form.phone} onChange={e => update('phone', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Qyteti</label>
              <input value={form.city} onChange={e => update('city', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Adresa</label>
              <input value={form.address} onChange={e => update('address', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Nr. punonjësve</label>
              <input type="number" min="0" value={form.employee_count} onChange={e => update('employee_count', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Statusi pagesës</label>
              <select value={form.payment_status} onChange={e => update('payment_status', e.target.value)} className="input">
                <option value="paid">Paguar</option>
                <option value="unpaid">Pa paguar</option>
                <option value="danger">Rrezik</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Shënime</label>
              <textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="input resize-none h-20" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary gap-2 text-sm py-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {editingId ? 'Ruaj' : 'Krijo'}
              </button>
              <button type="button" onClick={reset} className="btn-secondary text-sm py-2">Anulo</button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card overflow-hidden p-0">
        <table className="w-full admin-table">
          <thead>
            <tr className="bg-surface-soft border-b border-surface-border">
              <th className="text-left">Kompania</th>
              <th className="text-left">Kontakti</th>
              <th className="text-left">Punonjës</th>
              <th className="text-left">Pagesa</th>
              <th className="text-right">Veprime</th>
            </tr>
          </thead>
          <tbody>
            {initialClients.map(c => (
              <tr key={c.id} className="hover:bg-surface-soft">
                <td>
                  <p className="font-medium text-sm">{c.company_name}</p>
                  <p className="text-xs text-text-muted">{c.email}</p>
                </td>
                <td className="text-sm">{c.contact_name}</td>
                <td className="text-sm">{c.employee_count}</td>
                <td>
                  <span className={`badge text-xs ${LEASE_PAYMENT_LABELS[c.payment_status]?.color ?? ''}`}>
                    {LEASE_PAYMENT_LABELS[c.payment_status]?.sq ?? c.payment_status}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-1.5">
                    <button type="button" onClick={() => startEdit(c)} className="p-1.5 hover:bg-brand-50 rounded-lg"><Edit size={14} /></button>
                    <button type="button" onClick={() => handleDelete(c)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
