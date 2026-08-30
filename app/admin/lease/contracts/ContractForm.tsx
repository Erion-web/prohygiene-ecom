'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { LeaseDeviceOption } from '@/lib/lease/device-select'
import { LeaseDeviceSelect, LeaseDeviceSelectFooter } from '@/components/admin/lease/LeaseDeviceSelect'
import { seedDeployedDevices } from '@/lib/lease/seed-deployed-devices'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { formatClientAddress, primaryClientAddress } from '@/lib/lease/addresses'
import { materialOptionLabel } from '@/lib/lease/sync-material'
import type { ContractFormClient } from '@/lib/lease/contract-form-data'
import type { LeaseClientAddress, LeaseContract, LeaseContractStatus, MaterialUnit, ReminderPeriod } from '@/types'

interface MaterialOption { id: string; name_sq: string; sku?: string; unit: string; is_active?: boolean }
interface DeviceRow { product_id: string; quantity: string; address_id: string }
interface MaterialRow { material_id: string; quantity: string }

interface Props {
  clients: ContractFormClient[]
  leaseDevices: LeaseDeviceOption[]
  materials: MaterialOption[]
  contract?: LeaseContract
  nextContractNumber?: number
}

function addressesForClient(clients: ContractFormClient[], clientId: string): LeaseClientAddress[] {
  const client = clients.find(c => c.id === clientId)
  if (client?.addresses?.length) return client.addresses
  if (client && (client.city || client.address)) {
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

function defaultAddressId(addresses: LeaseClientAddress[]) {
  if (addresses.length === 1) return addresses[0].id
  return primaryClientAddress(addresses)?.id ?? ''
}

function computeEndsAt(startsAt: string, months: number): string {
  const [year, month, day] = startsAt.split('-').map(Number)
  const d = new Date(year, (month || 1) - 1, day || 1)
  d.setMonth(d.getMonth() + months)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dayNum = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dayNum}`
}

const defaultStartsAt = new Date().toISOString().slice(0, 10)

const defaultForm = {
  client_id: '',
  duration_months: '12',
  starts_at: defaultStartsAt,
  ends_at: computeEndsAt(defaultStartsAt, 12),
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
  contract_number: '',
}

export function ContractForm({ clients, leaseDevices: deviceOptions, materials, contract, nextContractNumber = 1 }: Props) {
  const router = useRouter()
  const editingId = contract?.id ?? null
  const returnTo = '/admin/lease/contracts'

  const [form, setForm] = useState(() => {
    if (!contract) return { ...defaultForm, contract_number: String(nextContractNumber) }
    return {
      contract_number: String(contract.contract_number ?? nextContractNumber),
      client_id: contract.client_id,
      duration_months: contract.duration_months.toString(),
      starts_at: contract.starts_at,
      ends_at: contract.ends_at,
      device_count: contract.device_count.toString(),
      employee_count: contract.employee_count.toString(),
      monthly_fee: contract.monthly_fee.toString(),
      reminder_period: contract.reminder_period,
      surplus_days: contract.surplus_days.toString(),
      expected_consumption: contract.expected_consumption.toString(),
      consumption_unit: contract.consumption_unit,
      consumption_period: contract.consumption_period,
      status: contract.status,
      notes: contract.notes ?? '',
    }
  })
  const [deviceRows, setDeviceRows] = useState<DeviceRow[]>(() => {
    const primaryId = defaultAddressId(addressesForClient(clients, contract?.client_id ?? ''))
    if (contract?.contract_devices?.length) {
      return contract.contract_devices.map(d => ({
        product_id: d.product_id,
        quantity: d.quantity.toString(),
        address_id: primaryId,
      }))
    }
    return [{ product_id: '', quantity: '1', address_id: primaryId }]
  })
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>(() =>
    contract?.contract_materials?.length
      ? contract.contract_materials.map(m => ({ material_id: m.material_id, quantity: m.quantity.toString() }))
      : [{ material_id: '', quantity: '0' }]
  )
  const [loading, setLoading] = useState(false)

  const clientOptions = clients.map(c => ({ value: c.id, label: c.company_name }))
  const materialOptions = materials.map(m => ({
    value: m.id,
    label: materialOptionLabel(m.name_sq, m.unit, m.is_active ?? true, m.sku),
  }))

  const selectedAddresses = addressesForClient(clients, form.client_id)
  const addressOptions = selectedAddresses.map(a => ({ value: a.id, label: formatClientAddress(a) }))

  useEffect(() => {
    if (!form.client_id) return
    const addrs = addressesForClient(clients, form.client_id)
    const fallback = defaultAddressId(addrs)
    if (!fallback) return
    setDeviceRows(rows => {
      const next = rows.map(row => (
        addrs.some(a => a.id === row.address_id) ? row : { ...row, address_id: fallback }
      ))
      return next.every((row, i) => row.address_id === rows[i].address_id) ? rows : next
    })
  }, [form.client_id, clients])

  const update = (key: string, value: string) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'starts_at' || key === 'duration_months') {
        next.ends_at = computeEndsAt(next.starts_at, parseInt(next.duration_months) || 12)
      }
      return next
    })
  }

  const applyClient = (clientId: string) => {
    update('client_id', clientId)
    const addressId = defaultAddressId(addressesForClient(clients, clientId))
    setDeviceRows(rows => rows.map(row => ({ ...row, address_id: addressId })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_id || !form.starts_at || !form.ends_at) {
      toast.error('Plotësoni fushat e detyrueshme')
      return
    }
    if (form.ends_at <= form.starts_at) {
      toast.error('Data e mbarimit duhet të jetë pas fillimit')
      return
    }
    const contractNumber = parseInt(form.contract_number, 10)
    if (!Number.isFinite(contractNumber) || contractNumber < 1) {
      toast.error('Numri i kontratës duhet të jetë 1 ose më i madh')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const durationMonths = parseInt(form.duration_months) || 12
    const validDevices = deviceRows.filter(r => r.product_id && r.quantity)
    const deviceCount = validDevices.reduce((sum, r) => sum + (parseInt(r.quantity) || 1), 0)
    const payload = {
      contract_number: contractNumber,
      client_id: form.client_id,
      duration_months: durationMonths,
      starts_at: form.starts_at,
      ends_at: form.ends_at || computeEndsAt(form.starts_at, durationMonths),
      device_count: deviceCount || parseInt(form.device_count) || 1,
      employee_count: parseInt(form.employee_count) || 0,
      monthly_fee: parseFloat(form.monthly_fee) || 0,
      reminder_period: form.reminder_period,
      surplus_days: parseInt(form.surplus_days) || 7,
      expected_consumption: parseFloat(form.expected_consumption) || 0,
      consumption_unit: form.consumption_unit,
      consumption_period: form.consumption_period,
      status: form.status,
      notes: form.notes.trim() || null,
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
      router.push(returnTo)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="admin-card space-y-5">
        <h3 className="admin-section-title border-b border-surface-border pb-4">Detajet e kontratës</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Nr. i kontratës *</label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.contract_number}
              onChange={e => update('contract_number', e.target.value)}
              className="input"
            />
            {!editingId && (
              <p className="text-[11px] text-text-muted mt-1">Numri i sugjeruar: {nextContractNumber}</p>
            )}
          </div>
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
            <label className="label">Mbarimi</label>
            <input type="date" value={form.ends_at} readOnly tabIndex={-1} className="input bg-surface-soft text-text-secondary cursor-default pointer-events-none" />
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
              <option value="pako">pako</option>
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
          <label className="label">Komenti shtesë</label>
          <textarea
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            className="input resize-none h-28"
            placeholder="Shënime, kushte ose detaje shtesë për këtë kontratë..."
          />
        </div>
      </div>

      <div className="admin-card space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <h3 className="admin-section-title">Pajisjet në kontratë</h3>
          <button
            type="button"
            onClick={() => setDeviceRows(p => [...p, { product_id: '', quantity: '1', address_id: defaultAddressId(selectedAddresses) }])}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            + Pajisje
          </button>
        </div>
        {deviceRows.map((row, idx) => (
          <div key={idx} className="grid sm:grid-cols-[1fr_90px_1fr_auto] gap-2 items-start">
            <div className="space-y-1">
              <LeaseDeviceSelect
                devices={deviceOptions}
                value={row.product_id}
                onChange={id => {
                  const next = [...deviceRows]
                  next[idx] = { ...next[idx], product_id: id }
                  setDeviceRows(next)
                }}
                createReturnTo={editingId ? `/admin/lease/contracts/${editingId}/edit` : '/admin/lease/contracts/new'}
              />
              {idx === 0 && (
                <LeaseDeviceSelectFooter createReturnTo={editingId ? `/admin/lease/contracts/${editingId}/edit` : '/admin/lease/contracts/new'} />
              )}
            </div>
            <input
              type="number"
              min="1"
              value={row.quantity}
              onChange={e => {
                const next = [...deviceRows]
                next[idx] = { ...next[idx], quantity: e.target.value }
                setDeviceRows(next)
              }}
              className="input"
              placeholder="Copë"
            />
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
              <button type="button" onClick={() => setDeviceRows(p => p.filter((_, i) => i !== idx))} className="btn-ghost text-red-500">
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="admin-card space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <h3 className="admin-section-title">Materialet</h3>
          <button
            type="button"
            onClick={() => setMaterialRows(p => [...p, { material_id: '', quantity: '0' }])}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            + Material
          </button>
        </div>
        {materialRows.map((row, idx) => (
          <div key={idx} className="grid sm:grid-cols-[1fr_120px_auto] gap-2 items-start">
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
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.quantity}
              onChange={e => {
                const next = [...materialRows]
                next[idx] = { ...next[idx], quantity: e.target.value }
                setMaterialRows(next)
              }}
              className="input"
            />
            {materialRows.length > 1 && (
              <button type="button" onClick={() => setMaterialRows(p => p.filter((_, i) => i !== idx))} className="btn-ghost text-red-500">
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
        <button type="button" onClick={() => router.push(returnTo)} className="btn-secondary py-2.5 px-5">
          Anulo
        </button>
        <button type="submit" disabled={loading} className="btn-primary py-2.5 px-6 gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {editingId ? 'Ruaj Ndryshimet' : 'Krijo Kontratën'}
        </button>
      </div>
    </form>
  )
}
