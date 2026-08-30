'use client'

import { useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Download, Users, Building2, User, Plus, X, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import { CITIES } from '@/lib/cities'
import { customerFormSchema } from '@/lib/validation/admin-schemas'
import { enableLeaseClientAction, disableLeaseClientAction } from '@/lib/actions/customers'
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
  customer_name?: string | null
  customer_phone?: string | null
  customer_type?: string | null
  city?: string | null
  address?: string | null
}

export interface GuestCustomer {
  email: string
  name: string
  phone: string | null
  city: string
  address: string
  customer_type: 'individual' | 'business'
  created_at: string
}

export interface CustomerAddressRow {
  user_id: string
  label: string
  city: string
  address: string
  is_primary: boolean
}

interface Props {
  customers: Profile[]
  leaseClients: LeaseClient[]
  orders: OrderSummary[]
  userAddresses: CustomerAddressRow[]
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

export function CustomersClient({ customers, leaseClients, orders, userAddresses }: Props) {
  const refresh = useScrollPreservingRefresh()
  const [showForm, setShowForm] = useState(false)
  const createForm = useForm({
    resolver: zodResolver(customerFormSchema),
    defaultValues: defaultForm,
  })
  const createCustomerType = createForm.watch('customer_type')
  const [loading, setLoading] = useState(false)
  const [cityFilter, setCityFilter] = useState('')
  const [selectedDetail, setSelectedDetail] = useState<{ type: 'profile' | 'lease' | 'guest'; id: string } | null>(null)
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

  const firstOrderByEmail = useMemo(() => {
    const map = new Map<string, OrderSummary>()
    for (const order of orders) {
      const email = order.customer_email?.trim().toLowerCase()
      if (!email) continue
      const current = map.get(email)
      if (!current || order.created_at < current.created_at) map.set(email, order)
    }
    return map
  }, [orders])

  const guests = useMemo<GuestCustomer[]>(() => {
    const known = new Set([
      ...customers.map(c => c.email.toLowerCase()),
      ...leaseClients.map(l => l.email.toLowerCase()),
    ])
    return Array.from(firstOrderByEmail.entries()).flatMap(([email, order]) => {
      if (known.has(email)) return []
      return [{
        email: order.customer_email,
        name: order.customer_name?.trim() || email,
        phone: order.customer_phone ?? null,
        city: order.city ?? '',
        address: order.address ?? '',
        customer_type: order.customer_type === 'business' ? 'business' as const : 'individual' as const,
        created_at: order.created_at,
      }]
    })
  }, [customers, leaseClients, firstOrderByEmail])

  const filteredCustomers = cityFilter
    ? customers.filter(c => (c.city || firstOrderByEmail.get(c.email.toLowerCase())?.city) === cityFilter)
    : customers
  const filteredExtra = cityFilter
    ? extraLease.filter(l => l.city === cityFilter)
    : extraLease
  const filteredGuests = cityFilter
    ? guests.filter(g => g.city === cityFilter)
    : guests

  const tableRows = useMemo<CustomerTableRow[]>(() => [
    ...filteredCustomers.map(c => {
      const lease = leaseForProfile(c, leaseClients)
      const firstOrder = firstOrderByEmail.get(c.email.toLowerCase())
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
        city: c.city || firstOrder?.city || null,
        createdAt: c.created_at,
        profile: {
          ...c,
          city: c.city || firstOrder?.city || c.city,
          address: c.address || firstOrder?.address || c.address,
        },
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
    ...filteredGuests.map(g => ({
      id: g.email,
      kind: 'guest' as const,
      name: g.name,
      phone: g.phone,
      email: g.email,
      customerType: g.customer_type,
      isLease: false,
      city: g.city || null,
      createdAt: g.created_at,
    })),
  ], [filteredCustomers, filteredExtra, filteredGuests, leaseClients, firstOrderByEmail])

  const selectedGuest = selectedDetail?.type === 'guest'
    ? guests.find(g => g.email === selectedDetail.id)
    : undefined
  const rawProfile = selectedDetail?.type === 'profile'
    ? customers.find(c => c.id === selectedDetail.id)
    : undefined
  const firstForProfile = rawProfile ? firstOrderByEmail.get(rawProfile.email.toLowerCase()) : undefined
  const selectedProfile = rawProfile
    ? {
        ...rawProfile,
        city: rawProfile.city || firstForProfile?.city || rawProfile.city,
        address: rawProfile.address || firstForProfile?.address || rawProfile.address,
      }
    : selectedGuest
      ? {
          id: selectedGuest.email,
          email: selectedGuest.email,
          full_name: selectedGuest.name,
          phone: selectedGuest.phone,
          city: selectedGuest.city,
          address: selectedGuest.address,
          role: 'customer' as const,
          customer_type: selectedGuest.customer_type,
          business_name: null,
          fiscal_number: null,
          created_at: selectedGuest.created_at,
          updated_at: selectedGuest.created_at,
        }
      : undefined
  const selectedLeaseOnly = selectedDetail?.type === 'lease'
    ? leaseClients.find(l => l.id === selectedDetail.id)
    : undefined
  const selectedLease = selectedDetail?.type === 'guest'
    ? undefined
    : selectedProfile && selectedDetail?.type === 'profile'
      ? leaseForProfile(selectedProfile, leaseClients)
      : selectedLeaseOnly
  const detailEmail = (selectedGuest?.email ?? selectedProfile?.email ?? selectedLeaseOnly?.email ?? '').toLowerCase()
  const detailOrders = detailEmail
    ? orders.filter(o => o.customer_email?.toLowerCase() === detailEmail)
    : []

  const reset = () => {
    setShowForm(false)
    createForm.reset(defaultForm)
  }

  const handleCreate = createForm.handleSubmit(async values => {
    setLoading(true)
    const res = await fetch('/api/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
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
  })

  const enableLease = async (profile: Profile) => {
    const existing = leaseForProfile(profile, leaseClients)
    if (existing) {
      const result = await enableLeaseClientAction(profile.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      refresh()
      return
    }

    const result = await enableLeaseClientAction(profile.id)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success('Klienti u shënua si shfrytëzues')
      refresh()
    }
  }

  const disableLease = async (lease: LeaseClient) => {
    const result = await disableLeaseClientAction(lease.id)
    if (!result.ok) toast.error(result.error)
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
          addresses={[
            ...(selectedProfile
              ? userAddresses.filter(a => a.user_id === selectedProfile.id)
              : []),
            ...detailOrders
              .filter(o => o.city || o.address)
              .map((o, i) => ({
                label: `Porosi ${i + 1}`,
                city: o.city ?? '',
                address: o.address ?? '',
                is_primary: false,
              })),
          ]}
          onEdit={selectedGuest ? undefined : () => {
            if (rawProfile) startEditProfile(rawProfile, selectedLease)
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
            {customers.length + guests.length} gjithsej
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
              <input {...createForm.register('full_name')} className="input" />
              {createForm.formState.errors.full_name && (
                <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.full_name.message}</p>
              )}
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" {...createForm.register('email')} className="input" />
              {createForm.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="label">Telefoni</label>
              <input {...createForm.register('phone')} className="input" />
            </div>
            <div>
              <label className="label">Qyteti *</label>
              <Controller
                control={createForm.control}
                name="city"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={CITIES.map(city => ({ value: city, label: city }))}
                    placeholder="Zgjedh qytetin..."
                    searchPlaceholder="Kërko qytetin..."
                  />
                )}
              />
              {createForm.formState.errors.city && (
                <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.city.message}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Adresa</label>
              <input {...createForm.register('address')} className="input" />
            </div>
            <div>
              <label className="label">Tipi</label>
              <select {...createForm.register('customer_type')} className="input">
                <option value="individual">Individual</option>
                <option value="business">Biznes</option>
              </select>
            </div>
            <div>
              <label className="label">Shfrytëzues</label>
              <Controller
                control={createForm.control}
                name="is_lease"
                render={({ field }) => (
                  <select
                    value={field.value ? 'po' : 'jo'}
                    onChange={e => field.onChange(e.target.value === 'po')}
                    className="input"
                  >
                    <option value="jo">JO</option>
                    <option value="po">PO</option>
                  </select>
                )}
              />
            </div>
            {createCustomerType === 'business' && (
              <>
                <div>
                  <label className="label">Biznesi</label>
                  <input {...createForm.register('business_name')} className="input" />
                </div>
                <div>
                  <label className="label">Nr. Fiskal</label>
                  <input {...createForm.register('fiscal_number')} className="input" />
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
          if (row.kind === 'guest') {
            setSelectedDetail({ type: 'guest', id: row.email })
          } else if (row.kind === 'profile' && row.profile) {
            setSelectedDetail({ type: 'profile', id: row.profile.id })
          } else if (row.lease) {
            setSelectedDetail({ type: 'lease', id: row.lease.id })
          }
        }}
        onToggleLease={row => {
          if (row.kind === 'guest') return
          if (row.kind === 'profile' && row.profile) {
            toggleLease(row.profile, row.lease)
          } else if (row.lease) {
            toggleLease(undefined, row.lease)
          }
        }}
        onEdit={row => {
          if (row.kind === 'guest') return
          if (row.kind === 'profile' && row.profile) {
            startEditProfile(row.profile, row.lease)
          } else if (row.lease) {
            startEditLease(row.lease)
          }
        }}
        onDelete={row => {
          if (row.kind === 'guest') return
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
