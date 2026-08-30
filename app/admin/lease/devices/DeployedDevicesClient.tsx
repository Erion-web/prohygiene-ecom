'use client'

import { useState } from 'react'
import { AdminSectionTitle } from '@/components/admin/AdminSectionTitle'
import { Save, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import { CITIES } from '@/lib/cities'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DeployedDevicesTable } from './DeployedDevicesTable'
import type { DeployedDevice, DeployedDeviceStatus } from '@/types'

const defaultForm = {
  contract_id: '',
  client_id: '',
  product_id: '',
  location_label: '',
  city: '',
  address: '',
  installed_at: new Date().toISOString().slice(0, 10),
  status: 'active' as DeployedDeviceStatus,
}

export function DeployedDevicesClient({ initialDevices }: { initialDevices: DeployedDevice[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const refresh = useScrollPreservingRefresh()

  const update = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const reset = () => {
    setEditingId(null)
    setForm(defaultForm)
  }

  const startEdit = (d: DeployedDevice) => {
    setEditingId(d.id)
    setForm({
      contract_id: d.contract_id,
      client_id: d.client_id,
      product_id: d.product_id,
      location_label: d.location_label,
      city: d.city ?? '',
      address: d.address ?? '',
      installed_at: d.installed_at,
      status: d.status,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    if (!form.location_label) {
      toast.error('Plotësoni lokacionin')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('deployed_devices').update({
      location_label: form.location_label,
      city: form.city || null,
      address: form.address || null,
      installed_at: form.installed_at,
      status: form.status,
    }).eq('id', editingId)

    if (error) toast.error(error.message)
    else {
      toast.success('Pajisja u përditësua')
      reset()
      refresh()
    }
    setLoading(false)
  }

  const handleDelete = async (d: DeployedDevice) => {
    if (!confirm('Fshi këtë pajisje nga lokacioni?')) return
    const supabase = createClient()
    const { error } = await supabase.from('deployed_devices').delete().eq('id', d.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Pajisja u fshi')
      refresh()
    }
  }

  return (
    <div className="space-y-3">
      <AdminSectionTitle>Pajisjet në lokacion</AdminSectionTitle>

      {editingId && (
        <div className="admin-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="admin-section-title">Modifiko lokacionin</h3>
            <button type="button" onClick={reset} className="btn-ghost p-1.5"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Lokacioni *</label>
              <input value={form.location_label} onChange={e => update('location_label', e.target.value)} className="input" placeholder="p.sh. Hyrja kryesore" required />
            </div>
            <div>
              <label className="label">Qyteti</label>
              <SearchableSelect
                value={form.city}
                onChange={city => update('city', city)}
                options={CITIES.map(c => ({ value: c, label: c }))}
                placeholder="Zgjedh qytetin..."
                searchPlaceholder="Kërko qytetin..."
                allowClear
              />
            </div>
            <div>
              <label className="label">Adresa</label>
              <input value={form.address} onChange={e => update('address', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Data</label>
              <input type="date" value={form.installed_at} onChange={e => update('installed_at', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Statusi</label>
              <select value={form.status} onChange={e => update('status', e.target.value)} className="input">
                <option value="active">Aktiv</option>
                <option value="maintenance">Mirëmbajtje</option>
                <option value="retired">Tërhequr</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary gap-2 text-sm py-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Ruaj
              </button>
              <button type="button" onClick={reset} className="btn-secondary text-sm py-2">Anulo</button>
            </div>
          </form>
        </div>
      )}

      <DeployedDevicesTable
        devices={initialDevices}
        onEdit={startEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
