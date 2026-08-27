'use client'

import { useMemo, useState } from 'react'
import { Download, Users, Building2, User, Plus, X, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import { CITIES } from '@/lib/cities'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CustomerDetailPanel } from '@/components/admin/CustomerDetailPanel'
import { CustomersAdminTable, type CustomerTableRow } from '@/components/admin/CustomersAdminTable'
import type { LeaseClient, LeaseClientAddress, Profile } from '@/types'

interface OrderSummary {
  id: string
  order_number: string
  total: number
  status: string
  created_at: string
  customer_email: string
}

interface Props {
  customers: Profile[]
  leaseClients: LeaseClient[]
  orders: OrderSummary[]
}

const defaultForm = {
  full_name: '',
  email: '',
  phone: '',
  city: '',
  address: '',
  customer_type: 'individual' as 'individual' | 'business',
  business_name: '',
  fiscal_number: '',
  is_lease: false,
}

function leaseForProfile(profile: Profile, leaseClients: LeaseClient[]) {
  return (
    leaseClients.find(l => l.profile_id === profile.id) ??
    leaseClients.find(l => l.email.toLowerCase() === profile.email.toLowerCase())
  )
}

function exportCSV(customers: Profile[], leaseClients: LeaseClient[]) {
  const headers = [
    'Emri', 'Email', 'Telefoni', 'Tipi', 'Roli', 'Shfrytëzues',
    'Biznesi', 'Nr. Fiskal', 'Qyteti', 'Adresa', 'Regjistruar',
  ]

  const rows = customers.map(c => [
    c.full_name ?? '',
    c.email,
    c.phone ?? '',
    c.customer_type === 'business' ? 'Biznes' : 'Individual',
    c.role,
    leaseForProfile(c, leaseClients) ? 'PO' : 'JO',
    c.business_name ?? '',
    c.fiscal_number ?? '',
    c.city ?? '',
    c.address ?? '',
    new Date(c.created_at).toLocaleDateString('sq-AL'),
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `klientet-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success(`${customers.length} klientë u exportuan`)
}

export function CustomersClient({ customers, leaseClients, orders }: Props) {
  const refresh = useScrollPreservingRefresh()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [cityFilter, setCityFilter] = useState('')
  const [selectedDetail, setSelectedDetail] = useState<{ type: 'profile' | 'lease'; id: string } | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editKind, setEditKind] = useState<'profile' | 'lease'>('profile')
  const [editId, setEditId] = useState('')
  const [editForm, setEditForm] = useState(defaultForm)
  const [editAddresses, setEditAddresses] = useState<Array<{ label: string; city: string; address: string }>>([])

  const matchedIds = new Set(
    customers.flatMap(c => {
      const lease = leaseForProfile(c, leaseClients)
      return lease ? [lease.id] : []
    })
  )
  const extraLease = leaseClients.filter(l => !matchedIds.has(l.id))
  const leaseCount = customers.filter(c => leaseForProfile(c, leaseClients)).length + extraLease.length

  const filteredCustomers = cityFilter
    ? customers.filter(c => c.city === cityFilter)
    : customers
  const filteredExtra = cityFilter
    ? extraLease.filter(l => l.city === cityFilter)
    : extraLease

  const tableRows = useMemo<CustomerTableRow[]>(() => [
    ...filteredCustomers.map(c => {
      const lease = leaseForProfile(c, leaseClients)
      return {
        id: c.id,
        kind: 'profile' as const,
        name: c.full_name ?? '—',
        phone: c.phone,
        email: c.email,
        customerType: c.customer_type,
        businessName: c.business_name,
        role: c.role,
        isLease: Boolean(lease),
        city: c.city,
        createdAt: c.created_at,
        profile: c,
        lease,
      }
    }),
    ...filteredExtra.map(l => ({
      id: l.id,
      kind: 'lease' as const,
      name: l.company_name,
      phone: l.phone,
      email: l.email,
      customerType: 'lease' as const,
      businessName: l.company_name,
      isLease: true,
      city: l.city,
      createdAt: l.created_at,
      lease: l,
    })),
  ], [filteredCustomers, filteredExtra, leaseClients])

  const selectedProfile = selectedDetail?.type === 'profile'
    ? customers.find(c => c.id === selectedDetail.id)
    : undefined
  const selectedLeaseOnly = selectedDetail?.type === 'lease'
    ? leaseClients.find(l => l.id === selectedDetail.id)
    : undefined
  const selectedLease = selectedProfile
    ? leaseForProfile(selectedProfile, leaseClients)
    : selectedLeaseOnly
  const detailEmail = (selectedProfile?.email ?? selectedLeaseOnly?.email ?? '').toLowerCase()
  const detailOrders = detailEmail
    ? orders.filter(o => o.customer_email?.toLowerCase() === detailEmail)
    : []

  const update = (key: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const reset = () => {
    setShowForm(false)
    setForm(defaultForm)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.city) {
      toast.error('Plotësoni emrin, emailin dhe qytetin')
      return
    }
    setLoading(true)
    const res = await fetch('/api/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      toast.error(data.error ?? 'Klienti nuk u krijua')
      return
    }
    toast.success('Klienti u krijua')
    reset()
    refresh()
  }

  const enableLease = async (profile: Profile) => {
    const supabase = createClient()
    const existing = leaseForProfile(profile, leaseClients)
    if (existing) {
      if (!existing.profile_id) {
        const { error } = await supabase
          .from('lease_clients')
          .update({ profile_id: profile.id })
          .eq('id', existing.id)
        if (error) {
          toast.error(error.message)
          return
        }
      }
      refresh()
      return
    }

    const { data: created, error } = await supabase.from('lease_clients').insert({
      profile_id: profile.id,
      company_name: profile.business_name || profile.full_name || profile.email,
      contact_name: profile.full_name || profile.email,
      email: profile.email,
      phone: profile.phone,
      city: profile.city,
      address: profile.address,
      employee_count: 0,
      payment_status: 'paid',
    }).select('id').single()
    if (error) toast.error(error.message)
    else {
      if (created?.id && (profile.city || profile.address)) {
        await supabase.from('lease_client_addresses').insert({
          client_id: created.id,
          label: 'Kryesore',
          city: profile.city || 'Prishtinë',
          address: profile.address || '',
          is_primary: true,
        })
      }
      toast.success('Klienti u shënua si shfrytëzues')
      refresh()
    }
  }

  const disableLease = async (lease: LeaseClient) => {
    const supabase = createClient()
    const { count } = await supabase
      .from('lease_contracts')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', lease.id)

    if ((count ?? 0) > 0) {
      toast.error('Ky klient ka kontrata. Hiq kontrata para se ta çaktivizosh.')
      return
    }

    const { error } = await supabase.from('lease_clients').delete().eq('id', lease.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Klienti nuk është më shfrytëzues')
      refresh()
    }
  }

  const toggleLease = async (profile?: Profile, lease?: LeaseClient) => {
    if (lease) await disableLease(lease)
    else if (profile) await enableLease(profile)
  }

  const startEditProfile = (profile: Profile, lease?: LeaseClient) => {
    setEditKind('profile')
    setEditId(profile.id)
    setEditForm({
      full_name: profile.full_name ?? '',
      email: profile.email,
      phone: profile.phone ?? '',
      city: profile.city ?? '',
      address: profile.address ?? '',
      customer_type: profile.customer_type,
      business_name: profile.business_name ?? '',
      fiscal_number: profile.fiscal_number ?? '',
      is_lease: Boolean(lease),
    })
    const addrs = lease?.addresses?.length
      ? lease.addresses.map((a: LeaseClientAddress) => ({ label: a.label, city: a.city, address: a.address }))
      : [{ label: 'Kryesore', city: profile.city ?? '', address: profile.address ?? '' }]
    setEditAddresses(addrs)
    setEditOpen(true)
  }

  const startEditLease = (lease: LeaseClient) => {
    setEditKind('lease')
    setEditId(lease.id)
    setEditForm({
      full_name: lease.contact_name || lease.company_name,
      email: lease.email,
      phone: lease.phone ?? '',
      city: lease.city ?? '',
      address: lease.address ?? '',
      customer_type: 'business',
      business_name: lease.company_name,
      fiscal_number: '',
      is_lease: true,
    })
    setEditAddresses(
      lease.addresses?.length
        ? lease.addresses.map(a => ({ label: a.label, city: a.city, address: a.address }))
        : [{ label: 'Kryesore', city: lease.city ?? '', address: lease.address ?? '' }]
    )
    setEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const first = editAddresses[0]
    const res = await fetch('/api/admin/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: editKind,
        id: editId,
        ...editForm,
        city: first?.city || editForm.city,
        address: first?.address || editForm.address,
        addresses: editAddresses,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      toast.error(data.error ?? 'Nuk u përditësua')
      return
    }
    toast.success('Klienti u përditësua')
    setEditOpen(false)
    refresh()
  }

  const handleDelete = async (kind: 'profile' | 'lease', id: string) => {
    if (!confirm('Fshi këtë klient?')) return
    const res = await fetch(`/api/admin/customers?kind=${kind}&id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Nuk u fshi')
      return
    }
    toast.success('Klienti u fshi')
    refresh()
  }

  return (
    <div className="space-y-4">
      {selectedDetail && (selectedProfile || selectedLeaseOnly) && (
        <CustomerDetailPanel
          profile={selectedProfile}
          leaseClient={selectedLease}
          orders={detailOrders}
          onEdit={() => {
            if (selectedProfile) startEditProfile(selectedProfile, selectedLease)
            else if (selectedLeaseOnly) startEditLease(selectedLeaseOnly)
          }}
          onClose={() => setSelectedDetail(null)}
        />
      )}

      {!selectedDetail && (
        <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-3 text-sm text-text-secondary flex-wrap">
          <span className="flex items-center gap-1.5">
            <Users size={14} />
            {customers.length} gjithsej
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 size={14} />
            {customers.filter(c => c.customer_type === 'business').length} biznese
          </span>
          <span className="flex items-center gap-1.5">
            <User size={14} />
            {customers.filter(c => c.customer_type === 'individual').length} individuale
          </span>
          <span className="text-text-muted">{leaseCount} shfrytëzues</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-44">
            <SearchableSelect
              value={cityFilter}
              onChange={setCityFilter}
              options={CITIES.map(city => ({ value: city, label: city }))}
              placeholder="Të gjitha qytetet"
              searchPlaceholder="Kërko qytetin..."
              allowClear
            />
          </div>
          <button
            type="button"
            onClick={() => exportCSV(customers, leaseClients)}
            className="btn-secondary gap-2 text-sm py-2"
          >
            <Download size={14} />
            Exporto CSV
          </button>
          {!showForm && (
            <button type="button" onClick={() => setShowForm(true)} className="btn-primary gap-2 text-sm py-2">
              <Plus size={15} />
              Shto Klient
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="admin-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="admin-section-title">Klient i Ri</h3>
            <button type="button" onClick={reset} className="btn-ghost p-1.5"><X size={16} /></button>
          </div>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Emri *</label>
              <input value={form.full_name} onChange={e => update('full_name', e.target.value)} className="input" required />
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
              <label className="label">Qyteti *</label>
              <SearchableSelect
                value={form.city}
                onChange={city => update('city', city)}
                options={CITIES.map(city => ({ value: city, label: city }))}
                placeholder="Zgjedh qytetin..."
                searchPlaceholder="Kërko qytetin..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Adresa</label>
              <input value={form.address} onChange={e => update('address', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Tipi</label>
              <select value={form.customer_type} onChange={e => update('customer_type', e.target.value)} className="input">
                <option value="individual">Individual</option>
                <option value="business">Biznes</option>
              </select>
            </div>
            <div>
              <label className="label">Shfrytëzues</label>
              <select
                value={form.is_lease ? 'po' : 'jo'}
                onChange={e => update('is_lease', e.target.value === 'po')}
                className="input"
              >
                <option value="jo">JO</option>
                <option value="po">PO</option>
              </select>
            </div>
            {form.customer_type === 'business' && (
              <>
                <div>
                  <label className="label">Biznesi</label>
                  <input value={form.business_name} onChange={e => update('business_name', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Nr. Fiskal</label>
                  <input value={form.fiscal_number} onChange={e => update('fiscal_number', e.target.value)} className="input" />
                </div>
              </>
            )}
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary gap-2 text-sm py-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Krijo
              </button>
              <button type="button" onClick={reset} className="btn-secondary text-sm py-2">Anulo</button>
            </div>
          </form>
        </div>
      )}

      <CustomersAdminTable
        rows={tableRows}
        emptyMessage={cityFilter ? 'Asnjë klient në këtë qytet' : 'Nuk ka klientë ende'}
        onRowClick={row => {
          if (row.kind === 'profile' && row.profile) {
            setSelectedDetail({ type: 'profile', id: row.profile.id })
          } else if (row.lease) {
            setSelectedDetail({ type: 'lease', id: row.lease.id })
          }
        }}
        onToggleLease={row => {
          if (row.kind === 'profile' && row.profile) {
            toggleLease(row.profile, row.lease)
          } else if (row.lease) {
            toggleLease(undefined, row.lease)
          }
        }}
        onEdit={row => {
          if (row.kind === 'profile' && row.profile) {
            startEditProfile(row.profile, row.lease)
          } else if (row.lease) {
            startEditLease(row.lease)
          }
        }}
        onDelete={row => {
          if (row.kind === 'profile') {
            handleDelete('profile', row.id)
          } else {
            handleDelete('lease', row.id)
          }
        }}
      />
        </>
      )}

      <Dialog open={editOpen} onOpenChange={open => { if (!open) setEditOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifiko Klientin</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Emri *</label>
                  <input value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} className="input" required />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="input" required />
                </div>
                <div>
                  <label className="label">Telefoni</label>
                  <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Biznesi</label>
                  <input value={editForm.business_name} onChange={e => setEditForm(p => ({ ...p, business_name: e.target.value }))} className="input" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Adresat</h4>
                  <button
                    type="button"
                    onClick={() => setEditAddresses(p => [...p, { label: `Adresa ${p.length + 1}`, city: '', address: '' }])}
                    className="btn-secondary text-xs py-1 px-2"
                  >
                    + Adresë
                  </button>
                </div>
                <div className="space-y-2">
                  {editAddresses.map((row, idx) => (
                    <div key={idx} className="grid sm:grid-cols-[140px_1fr_1fr_auto] gap-2">
                      <input
                        value={row.label}
                        onChange={e => setEditAddresses(p => p.map((a, i) => i === idx ? { ...a, label: e.target.value } : a))}
                        className="input"
                        placeholder="Emri"
                      />
                      <SearchableSelect
                        value={row.city}
                        onChange={city => setEditAddresses(p => p.map((a, i) => i === idx ? { ...a, city } : a))}
                        options={CITIES.map(city => ({ value: city, label: city }))}
                        placeholder="Qyteti"
                        searchPlaceholder="Kërko qytetin..."
                      />
                      <input
                        value={row.address}
                        onChange={e => setEditAddresses(p => p.map((a, i) => i === idx ? { ...a, address: e.target.value } : a))}
                        className="input"
                        placeholder="Adresa"
                      />
                      {editAddresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditAddresses(p => p.filter((_, i) => i !== idx))}
                          className="btn-ghost text-red-500"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary text-sm py-2">Anulo</button>
              <button type="submit" disabled={loading} className="btn-primary gap-2 text-sm py-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Ruaj
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
