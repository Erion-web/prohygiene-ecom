'use client'

import { useMemo, useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDebouncedValue } from '@tanstack/react-pacer'
import { createClient } from '@/lib/supabase/client'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import { formatPrice } from '@/lib/utils'
import { CONTRACT_STATUS_LABELS } from '@/lib/lease/utils'
import type { LeaseDeviceOption } from '@/lib/lease/device-select'
import { LeaseDeviceSelect, LeaseDeviceSelectFooter } from '@/components/admin/lease/LeaseDeviceSelect'
import { LeaseFlowHint } from '@/components/admin/lease/LeaseFlowHint'
import { seedDeployedDevices } from '@/lib/lease/seed-deployed-devices'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatClientAddress, primaryClientAddress } from '@/lib/lease/addresses'
import type { LeaseClientAddress, LeaseContract, LeaseContractStatus, MaterialUnit, ReminderPeriod } from '@/types'

interface ClientOption {
  id: string
  company_name: string
  city?: string | null
  address?: string | null
  addresses?: LeaseClientAddress[]
}
interface MaterialOption { id: string; name_sq: string; unit: string }

interface Props {
  initialContracts: LeaseContract[]
  clients: ClientOption[]
  leaseDevices: LeaseDeviceOption[]
  materials: MaterialOption[]
}

interface DeviceRow { product_id: string; quantity: string; address_id: string }
interface MaterialRow { material_id: string; quantity: string }

const defaultForm = {
  client_id: '',
  duration_months: '12',
  starts_at: new Date().toISOString().slice(0, 10),
  device_count: '1',
  employee_count: '0',
  monthly_fee: '0',
  reminder_period: 'month' as ReminderPeriod,
  surplus_days: '7',
  expected_consumption: '0',
  consumption_unit: 'ml' as MaterialUnit,
  consumption_period: 'month' as ReminderPeriod,
  status: 'draft' as LeaseContractStatus,
  notes: '',
}

function computeEndsAt(startsAt: string, months: number): string {
  const d = new Date(startsAt)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function LeaseContractsClient({ initialContracts, clients, leaseDevices: deviceOptions, materials }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [deviceRows, setDeviceRows] = useState<DeviceRow[]>([{ product_id: '', quantity: '1', address_id: '' }])
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([{ material_id: '', quantity: '0' }])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, { wait: 320 })
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const refresh = useScrollPreservingRefresh()

  const clientOptions = clients.map(c => ({ value: c.id, label: c.company_name }))
  const materialOptions = materials.map(m => ({ value: m.id, label: `${m.name_sq} (${m.unit})` }))

  const addressesFor = (clientId: string): LeaseClientAddress[] => {
    const client = clients.find(c => c.id === clientId)
    if (client?.addresses?.length) return client.addresses
    if (client?.city || client?.address) {
      return [{
        id: `legacy-${client.id}`,
        client_id: client.id,
        label: 'Kryesore',
        city: client.city ?? '',
        address: client.address ?? '',
        is_primary: true,
        created_at: '',
      }]
    }
    return []
  }

  const selectedAddresses = addressesFor(form.client_id)
  const addressOptions = selectedAddresses.map(a => ({ value: a.id, label: formatClientAddress(a) }))

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return initialContracts.filter(c => {
      if (statusFilter && c.status !== statusFilter) return false
      if (fromDate && c.ends_at < fromDate) return false
      if (toDate && c.starts_at > toDate) return false
      if (!q) return true
      const name = c.client?.company_name?.toLowerCase() ?? ''
      const notes = c.notes?.toLowerCase() ?? ''
      return name.includes(q) || notes.includes(q)
    })
  }, [initialContracts, debouncedSearch, statusFilter, fromDate, toDate])

  const update = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const applyClient = (clientId: string) => {
    update('client_id', clientId)
    const primary = primaryClientAddress(addressesFor(clientId))
    setDeviceRows(rows => rows.map(row => ({ ...row, address_id: primary?.id ?? '' })))
  }

  const reset = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(defaultForm)
    setDeviceRows([{ product_id: '', quantity: '1', address_id: '' }])
    setMaterialRows([{ material_id: '', quantity: '0' }])
  }

  const startCreate = () => {
    setEditingId(null)
    setForm(defaultForm)
    setDeviceRows([{ product_id: '', quantity: '1', address_id: '' }])
    setMaterialRows([{ material_id: '', quantity: '0' }])
    setModalOpen(true)
  }

  const startEdit = (c: LeaseContract) => {
    setEditingId(c.id)
    setForm({
      client_id: c.client_id,
      duration_months: c.duration_months.toString(),
      starts_at: c.starts_at,
      device_count: c.device_count.toString(),
      employee_count: c.employee_count.toString(),
      monthly_fee: c.monthly_fee.toString(),
      reminder_period: c.reminder_period,
      surplus_days: c.surplus_days.toString(),
      expected_consumption: c.expected_consumption.toString(),
      consumption_unit: c.consumption_unit,
      consumption_period: c.consumption_period,
      status: c.status,
      notes: c.notes ?? '',
    })
    setDeviceRows(
      c.contract_devices?.length
        ? c.contract_devices.map(d => ({
            product_id: d.product_id,
            quantity: d.quantity.toString(),
            address_id: primaryClientAddress(addressesFor(c.client_id))?.id ?? '',
          }))
        : [{ product_id: '', quantity: '1', address_id: primaryClientAddress(addressesFor(c.client_id))?.id ?? '' }]
    )
    setMaterialRows(
      c.contract_materials?.length
        ? c.contract_materials.map(m => ({ material_id: m.material_id, quantity: m.quantity.toString() }))
        : [{ material_id: '', quantity: '0' }]
    )
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_id || !form.starts_at) {
      toast.error('Plotësoni fushat e detyrueshme')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const durationMonths = parseInt(form.duration_months) || 12
    const validDevices = deviceRows.filter(r => r.product_id && r.quantity)
    const deviceCount = validDevices.reduce((sum, r) => sum + (parseInt(r.quantity) || 1), 0)
    const payload = {
      client_id: form.client_id,
      duration_months: durationMonths,
      starts_at: form.starts_at,
      ends_at: computeEndsAt(form.starts_at, durationMonths),
      device_count: deviceCount || parseInt(form.device_count) || 1,
      employee_count: parseInt(form.employee_count) || 0,
      monthly_fee: parseFloat(form.monthly_fee) || 0,
      reminder_period: form.reminder_period,
      surplus_days: parseInt(form.surplus_days) || 7,
      expected_consumption: parseFloat(form.expected_consumption) || 0,
      consumption_unit: form.consumption_unit,
      consumption_period: form.consumption_period,
      status: form.status,
      notes: form.notes || null,
    }

    let contractId = editingId
    let error

    if (editingId) {
      const res = await supabase.from('lease_contracts').update(payload).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('lease_contracts').insert(payload).select('id').single()
      error = res.error
      contractId = res.data?.id ?? null
    }

    if (!error && contractId) {
      await supabase.from('contract_devices').delete().eq('contract_id', contractId)
      await supabase.from('contract_materials').delete().eq('contract_id', contractId)

      if (validDevices.length > 0) {
        const { error: dErr } = await supabase.from('contract_devices').insert(
          validDevices.map(r => ({
            contract_id: contractId,
            product_id: r.product_id,
            quantity: parseInt(r.quantity) || 1,
          }))
        )
        if (dErr) error = dErr
      }

      if (!error) {
        const seedErr = await seedDeployedDevices(supabase, {
          contractId,
          clientId: form.client_id,
          startsAt: form.starts_at,
          devices: validDevices.map(row => {
            const addr = selectedAddresses.find(a => a.id === row.address_id) ?? primaryClientAddress(selectedAddresses)
            return {
              product_id: row.product_id,
              quantity: row.quantity,
              location: addr ? formatClientAddress(addr) : '',
              city: addr?.city,
              address: addr?.address,
            }
          }),
        })
        if (seedErr) error = seedErr
      }

      const validMaterials = materialRows.filter(r => r.material_id)
      if (validMaterials.length > 0) {
        const { error: mErr } = await supabase.from('contract_materials').insert(
          validMaterials.map(r => ({
            contract_id: contractId,
            material_id: r.material_id,
            quantity: parseFloat(r.quantity) || 0,
          }))
        )
        if (mErr) error = mErr
      }
    }

    if (error) toast.error(error.message)
    else {
      toast.success(editingId ? 'Kontrata u përditësua' : 'Kontrata u krijua')
      reset()
      refresh()
    }
    setLoading(false)
  }

  const handleDelete = async (c: LeaseContract) => {
    if (!confirm('Fshi këtë kontratë?')) return
    const supabase = createClient()
    const { error } = await supabase.from('lease_contracts').delete().eq('id', c.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Kontrata u fshi')
      refresh()
    }
  }

  const hasFilters = Boolean(search || statusFilter || fromDate || toDate)

  return (
    <div className="space-y-3">
      <div className="admin-card space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-8"
              placeholder="Kërko klient ose shënim..."
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input sm:w-40">
            <option value="">Të gjitha statuset</option>
            <option value="draft">Draft</option>
            <option value="active">Aktiv</option>
            <option value="expired">Skaduar</option>
            <option value="cancelled">Anuluar</option>
          </select>
          <button type="button" onClick={startCreate} className="btn-primary gap-2 text-sm shrink-0">
            <Plus size={15} />
            Kontratë e Re
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-text-muted">Nga</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input w-auto" />
          <label className="text-xs text-text-muted">Deri</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input w-auto" />
          <span className="ml-auto text-xs text-text-muted">
            {filtered.length} / {initialContracts.length}
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setFromDate('')
                setToDate('')
              }}
              className="text-xs font-semibold text-red-500 hover:underline"
            >
              Pastro
            </button>
          )}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={open => { if (!open) reset() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifiko Kontratën' : 'Kontratë e Re'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-5">
              <LeaseFlowHint step="contract" />

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label">Klienti *</label>
                  <SearchableSelect
                    value={form.client_id}
                    onChange={applyClient}
                    options={clientOptions}
                    searchType="clients"
                    placeholder="Zgjedh klientin..."
                    searchPlaceholder="Kërko klientin..."
                  />
                </div>
                <div>
                  <label className="label">Kohëzgjatja (muaj)</label>
                  <input type="number" min="1" value={form.duration_months} onChange={e => update('duration_months', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Fillimi</label>
                  <input type="date" value={form.starts_at} onChange={e => update('starts_at', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Nr. punonjësve</label>
                  <input type="number" min="0" value={form.employee_count} onChange={e => update('employee_count', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Tarifa mujore (€)</label>
                  <input type="number" step="0.01" min="0" value={form.monthly_fee} onChange={e => update('monthly_fee', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Periudha njoftimit</label>
                  <select value={form.reminder_period} onChange={e => update('reminder_period', e.target.value)} className="input">
                    <option value="week">Javë</option>
                    <option value="month">Muaj</option>
                  </select>
                </div>
                <div>
                  <label className="label">Suficit (ditë)</label>
                  <input type="number" min="0" value={form.surplus_days} onChange={e => update('surplus_days', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Konsumi i pritur</label>
                  <input type="number" min="0" step="0.01" value={form.expected_consumption} onChange={e => update('expected_consumption', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Njësia konsumit</label>
                  <select value={form.consumption_unit} onChange={e => update('consumption_unit', e.target.value)} className="input">
                    <option value="ml">ml</option>
                    <option value="cope">copë</option>
                  </select>
                </div>
                <div>
                  <label className="label">Periudha konsumit</label>
                  <select value={form.consumption_period} onChange={e => update('consumption_period', e.target.value)} className="input">
                    <option value="week">Javë</option>
                    <option value="month">Muaj</option>
                  </select>
                </div>
                <div>
                  <label className="label">Statusi</label>
                  <select value={form.status} onChange={e => update('status', e.target.value)} className="input">
                    <option value="draft">Draft</option>
                    <option value="active">Aktiv</option>
                    <option value="expired">Skaduar</option>
                    <option value="cancelled">Anuluar</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Pajisjet në kontratë</h4>
                  <button type="button" onClick={() => setDeviceRows(p => [...p, { product_id: '', quantity: '1', address_id: primaryClientAddress(selectedAddresses)?.id ?? '' }])} className="btn-secondary text-xs py-1 px-2">+ Pajisje</button>
                </div>
                {deviceRows.map((row, idx) => (
                  <div key={idx} className="grid sm:grid-cols-[1fr_90px_1fr_auto] gap-2 mb-2 items-start">
                    <div className="space-y-1">
                      <LeaseDeviceSelect
                        devices={deviceOptions}
                        value={row.product_id}
                        onChange={id => {
                          const next = [...deviceRows]
                          next[idx] = { ...next[idx], product_id: id }
                          setDeviceRows(next)
                        }}
                        createReturnTo="/admin/lease/contracts"
                      />
                      {idx === 0 && <LeaseDeviceSelectFooter createReturnTo="/admin/lease/contracts" />}
                    </div>
                    <input type="number" min="1" value={row.quantity} onChange={e => {
                      const next = [...deviceRows]
                      next[idx] = { ...next[idx], quantity: e.target.value }
                      setDeviceRows(next)
                    }} className="input" placeholder="Copë" />
                    <div>
                      <SearchableSelect
                        value={row.address_id}
                        onChange={id => {
                          const next = [...deviceRows]
                          next[idx] = { ...next[idx], address_id: id }
                          setDeviceRows(next)
                        }}
                        options={addressOptions}
                        placeholder={form.client_id ? 'Lokacioni i klientit' : 'Zgjidh klientin fillimisht'}
                        searchPlaceholder="Kërko adresën..."
                        disabled={!form.client_id || addressOptions.length === 0}
                      />
                      {form.client_id && addressOptions.length === 0 && (
                        <p className="text-xs text-amber-700 mt-1">Ky klient s’ka adresa. Shtojini te Klientët.</p>
                      )}
                    </div>
                    {deviceRows.length > 1 && (
                      <button type="button" onClick={() => setDeviceRows(p => p.filter((_, i) => i !== idx))} className="btn-ghost text-red-500"><X size={16} /></button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Materialet</h4>
                  <button type="button" onClick={() => setMaterialRows(p => [...p, { material_id: '', quantity: '0' }])} className="btn-secondary text-xs py-1 px-2">+ Material</button>
                </div>
                {materialRows.map((row, idx) => (
                  <div key={idx} className="grid sm:grid-cols-[1fr_100px_auto] gap-2 mb-2 items-start">
                    <SearchableSelect
                      value={row.material_id}
                      onChange={id => {
                        const next = [...materialRows]
                        next[idx] = { ...next[idx], material_id: id }
                        setMaterialRows(next)
                      }}
                      options={materialOptions}
                      searchType="materials"
                      placeholder="Zgjedh materialin..."
                      searchPlaceholder="Kërko materialin..."
                    />
                    <input type="number" min="0" step="0.01" value={row.quantity} onChange={e => {
                      const next = [...materialRows]
                      next[idx] = { ...next[idx], quantity: e.target.value }
                      setMaterialRows(next)
                    }} className="input" />
                    {materialRows.length > 1 && (
                      <button type="button" onClick={() => setMaterialRows(p => p.filter((_, i) => i !== idx))} className="btn-ghost text-red-500"><X size={16} /></button>
                    )}
                  </div>
                ))}
              </div>
            </DialogBody>
            <DialogFooter>
              <button type="button" onClick={reset} className="btn-secondary text-sm py-2">Anulo</button>
              <button type="submit" disabled={loading} className="btn-primary gap-2 text-sm py-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {editingId ? 'Ruaj' : 'Krijo'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="admin-card overflow-hidden p-0">
        <table className="w-full admin-table">
          <thead>
            <tr className="bg-surface-soft border-b border-surface-border">
              <th className="text-left">Klienti</th>
              <th className="text-left">Periudha</th>
              <th className="text-left">Pajisje</th>
              <th className="text-left">Tarifa/muaj</th>
              <th className="text-left">Statusi</th>
              <th className="text-right">Veprime</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-text-muted">
                  {hasFilters ? 'Asnjë kontratë nuk përputhet me filtrat' : 'Nuk ka kontrata ende'}
                </td>
              </tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-surface-soft">
                <td className="text-sm font-medium">{c.client?.company_name ?? '—'}</td>
                <td className="text-sm text-text-secondary">
                  {c.starts_at} → {c.ends_at}
                  <span className="block text-xs text-text-muted">{c.duration_months} muaj</span>
                </td>
                <td className="text-sm">{c.device_count}</td>
                <td className="text-sm font-semibold">{formatPrice(c.monthly_fee)}</td>
                <td>
                  <span className="badge text-xs bg-surface-soft">{CONTRACT_STATUS_LABELS[c.status] ?? c.status}</span>
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
