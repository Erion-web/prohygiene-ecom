'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Loader2, Droplets } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import { dailyConsumptionRate, daysUntilEmpty } from '@/lib/lease/utils'
import type { DeployedDevice, DeployedDeviceStatus } from '@/types'

interface ContractOption { id: string; client_id: string; status: string }
interface ClientOption { id: string; company_name: string }
interface ProductOption { id: string; name_sq: string; sku: string }
interface MaterialOption { id: string; name_sq: string; unit: string }

interface Props {
  initialDevices: DeployedDevice[]
  contracts: ContractOption[]
  clients: ClientOption[]
  products: ProductOption[]
  materials: MaterialOption[]
}

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

export function DeployedDevicesClient({ initialDevices, contracts, clients, products, materials }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [refillDeviceId, setRefillDeviceId] = useState<string | null>(null)
  const [refillMaterialId, setRefillMaterialId] = useState('')
  const [refillAmount, setRefillAmount] = useState('')
  const refresh = useScrollPreservingRefresh()

  const update = (key: string, value: string) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'contract_id') {
        const contract = contracts.find(c => c.id === value)
        if (contract) next.client_id = contract.client_id
      }
      return next
    })
  }

  const reset = () => {
    setShowForm(false)
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
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.contract_id || !form.product_id || !form.location_label) {
      toast.error('Plotësoni fushat e detyrueshme')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const payload = {
      contract_id: form.contract_id,
      client_id: form.client_id,
      product_id: form.product_id,
      location_label: form.location_label,
      city: form.city || null,
      address: form.address || null,
      installed_at: form.installed_at,
      status: form.status,
    }

    let error
    let deviceId = editingId

    if (editingId) {
      const res = await supabase.from('deployed_devices').update(payload).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('deployed_devices').insert(payload).select('id').single()
      error = res.error
      deviceId = res.data?.id ?? null

      if (!error && deviceId) {
        const { data: deviceMaterials } = await supabase
          .from('device_materials')
          .select('material_id, capacity')
          .eq('product_id', form.product_id)

        if (deviceMaterials?.length) {
          await supabase.from('device_consumable_levels').insert(
            deviceMaterials.map(dm => ({
              deployed_device_id: deviceId,
              material_id: dm.material_id,
              capacity: dm.capacity,
              current_level: dm.capacity,
              last_refilled_at: new Date().toISOString(),
            }))
          )
        }
      }
    }

    if (error) toast.error(error.message)
    else {
      toast.success(editingId ? 'Pajisja u përditësua' : 'Pajisja u instalua')
      reset()
      refresh()
    }
    setLoading(false)
  }

  const handleDelete = async (d: DeployedDevice) => {
    if (!confirm('Fshi këtë pajisje të instaluar?')) return
    const supabase = createClient()
    const { error } = await supabase.from('deployed_devices').delete().eq('id', d.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Pajisja u fshi')
      refresh()
    }
  }

  const handleRefill = async () => {
    if (!refillDeviceId || !refillMaterialId || !refillAmount) {
      toast.error('Plotësoni fushat e rimbushjes')
      return
    }
    const supabase = createClient()
    const amount = parseFloat(refillAmount)
    const device = initialDevices.find(d => d.id === refillDeviceId)
    const level = device?.consumable_levels?.find(l => l.material_id === refillMaterialId)

    const { error: refillErr } = await supabase.from('refill_events').insert({
      deployed_device_id: refillDeviceId,
      material_id: refillMaterialId,
      amount,
    })

    if (refillErr) {
      toast.error(refillErr.message)
      return
    }

    const { error: levelErr } = await supabase
      .from('device_consumable_levels')
      .update({
        current_level: level?.capacity ?? amount,
        last_refilled_at: new Date().toISOString(),
      })
      .eq('deployed_device_id', refillDeviceId)
      .eq('material_id', refillMaterialId)

    if (levelErr) toast.error(levelErr.message)
    else {
      toast.success('Rimbushja u regjistrua')
      setRefillDeviceId(null)
      setRefillMaterialId('')
      setRefillAmount('')
      refresh()
    }
  }

  return (
    <div className="space-y-5">
      {!showForm && (
        <button onClick={() => setShowForm(true)} className="btn-primary gap-2 text-sm">
          <Plus size={15} />
          Instalo Pajisje
        </button>
      )}

      {showForm && (
        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold">{editingId ? 'Modifiko Pajisjen' : 'Pajisje e Re'}</h3>
            <button type="button" onClick={reset} className="btn-ghost p-1.5"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Kontrata *</label>
              <select value={form.contract_id} onChange={e => update('contract_id', e.target.value)} className="input" required>
                <option value="">Zgjedh...</option>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>Kontratë {c.id.slice(0, 8)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Klienti</label>
              <select value={form.client_id} onChange={e => update('client_id', e.target.value)} className="input">
                <option value="">Zgjedh...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Pajisja *</label>
              <select value={form.product_id} onChange={e => update('product_id', e.target.value)} className="input" required>
                <option value="">Zgjedh...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name_sq}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Lokacioni *</label>
              <input value={form.location_label} onChange={e => update('location_label', e.target.value)} className="input" placeholder="p.sh. Hyrja kryesore" required />
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
              <label className="label">Data instalimit</label>
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
                {editingId ? 'Ruaj' : 'Instalo'}
              </button>
              <button type="button" onClick={reset} className="btn-secondary text-sm py-2">Anulo</button>
            </div>
          </form>
        </div>
      )}

      {refillDeviceId && (
        <div className="admin-card p-5 border-2 border-brand-200">
          <h4 className="font-bold mb-3 flex items-center gap-2"><Droplets size={16} /> Rimbushje</h4>
          <div className="grid sm:grid-cols-3 gap-3">
            <select value={refillMaterialId} onChange={e => setRefillMaterialId(e.target.value)} className="input">
              <option value="">Materiali...</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.name_sq}</option>
              ))}
            </select>
            <input type="number" min="0" step="0.01" value={refillAmount} onChange={e => setRefillAmount(e.target.value)} className="input" placeholder="Sasia" />
            <div className="flex gap-2">
              <button type="button" onClick={handleRefill} className="btn-primary text-sm flex-1">Regjistro</button>
              <button type="button" onClick={() => setRefillDeviceId(null)} className="btn-secondary text-sm">Anulo</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {initialDevices.map(d => {
          const contract = d.contract
          const dailyRate = contract
            ? dailyConsumptionRate(contract.expected_consumption, contract.consumption_period)
            : 0

          return (
            <div key={d.id} className="admin-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-bold text-text-primary">{d.product?.name_sq ?? 'Pajisje'}</p>
                  <p className="text-sm text-text-secondary">{d.client?.company_name} — {d.location_label}</p>
                  <p className="text-xs text-text-muted">{d.city}{d.address ? `, ${d.address}` : ''}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRefillDeviceId(d.id)} className="btn-secondary text-xs py-1.5 px-3 gap-1">
                    <Droplets size={14} /> Rimbush
                  </button>
                  <button type="button" onClick={() => startEdit(d)} className="btn-ghost p-2"><Edit size={14} /></button>
                  <button type="button" onClick={() => handleDelete(d)} className="btn-ghost p-2 text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>

              {d.consumable_levels && d.consumable_levels.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {d.consumable_levels.map(level => {
                    const daysLeft = daysUntilEmpty(level.current_level, dailyRate)
                    const pct = level.capacity > 0 ? Math.round((level.current_level / level.capacity) * 100) : 0
                    return (
                      <div key={level.id} className="bg-surface-soft rounded-xl p-3 border border-surface-border">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">{level.material?.name_sq ?? 'Material'}</span>
                          <span className="text-text-muted">{level.current_level} / {level.capacity} {level.material?.unit}</span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden mb-1">
                          <div
                            className={`h-full rounded-full ${pct <= 20 ? 'bg-red-500' : pct <= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        {daysLeft !== null && (
                          <p className="text-xs text-text-muted">~{Math.round(daysLeft)} ditë të mbetura</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
