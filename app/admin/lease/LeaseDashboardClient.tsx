'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Handshake, AlertTriangle, Mail, TrendingUp, Download, ArrowRight, Droplets, Clock,
} from 'lucide-react'
import { type LegacyColumnDef } from '@tanstack/react-table/legacy'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { AdminKpiCard } from '@/components/admin/AdminKpiCard'
import { AdminTable } from '@/components/admin/AdminTable'
import { formatPrice } from '@/lib/utils'
import {
  dailyConsumptionRate,
  daysUntilEmpty,
  daysUntilContractEnd,
  LEASE_PAYMENT_LABELS,
} from '@/lib/lease/utils'
import type { DeployedDevice, LeaseClient, LeaseContract, LeaseInquiry } from '@/types'

interface Props {
  contracts: LeaseContract[]
  deployedDevices: DeployedDevice[]
  clients: LeaseClient[]
  inquiries: LeaseInquiry[]
}

interface ClientRow {
  client: LeaseClient
  deviceCount: number
  locations: string[]
  monthlyFee: number
  minDaysToRefill: number | null
  minContractDays: number | null
}

const MONTH_LABELS = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj']

function rowPriority(row: ClientRow) {
  if (row.client.payment_status === 'danger') return 0
  if (row.client.payment_status === 'unpaid') return 1
  if (row.minDaysToRefill !== null && row.minDaysToRefill <= 7) return 2
  if (row.minContractDays !== null && row.minContractDays <= 30) return 3
  return 4
}

export function LeaseDashboardClient({
  contracts,
  deployedDevices,
  clients,
  inquiries,
}: Props) {
  const activeContracts = contracts.filter(c => c.status === 'active')
  const mrr = activeContracts.reduce((s, c) => s + c.monthly_fee, 0)
  const newInquiries = inquiries.filter(i => i.status === 'new')
  const unpaidClients = clients.filter(c => c.payment_status === 'danger' || c.payment_status === 'unpaid')

  const clientRows = useMemo<ClientRow[]>(() => {
    return clients
      .map(client => {
        const clientContracts = contracts.filter(c => c.client_id === client.id && c.status === 'active')
        const clientDevices = deployedDevices.filter(d => d.client_id === client.id)
        const locations = Array.from(new Set(clientDevices.map(d => d.location_label)))

        let minDaysToRefill: number | null = null
        let minContractDays: number | null = null

        for (const device of clientDevices) {
          const contract = device.contract
          if (!contract) continue
          const cd = daysUntilContractEnd(contract.ends_at)
          if (minContractDays === null || cd < minContractDays) minContractDays = cd
          const dailyRate = dailyConsumptionRate(contract.expected_consumption, contract.consumption_period)
          for (const level of device.consumable_levels ?? []) {
            const dl = daysUntilEmpty(level.current_level, dailyRate)
            if (dl !== null && (minDaysToRefill === null || dl < minDaysToRefill)) {
              minDaysToRefill = dl
            }
          }
        }

        return {
          client,
          deviceCount: clientDevices.length,
          locations,
          monthlyFee: clientContracts.reduce((s, c) => s + c.monthly_fee, 0),
          minDaysToRefill,
          minContractDays,
        }
      })
      .filter(r => r.deviceCount > 0 || contracts.some(c => c.client_id === r.client.id))
      .sort((a, b) => rowPriority(a) - rowPriority(b) || a.client.company_name.localeCompare(b.client.company_name, 'sq'))
  }, [clients, contracts, deployedDevices])

  const attention = useMemo(() => {
    const items: { id: string; href: string; title: string; detail: string; tone: 'red' | 'amber' }[] = []

    for (const device of deployedDevices) {
      const contract = device.contract
      if (!contract) continue
      const dailyRate = dailyConsumptionRate(contract.expected_consumption, contract.consumption_period)
      for (const level of device.consumable_levels ?? []) {
        const daysLeft = daysUntilEmpty(level.current_level, dailyRate)
        if (daysLeft !== null && daysLeft <= contract.surplus_days) {
          items.push({
            id: `refill-${device.id}-${level.id}`,
            href: '/admin/lease/devices',
            title: device.product?.name_sq ?? 'Pajisje',
            detail: `${device.client?.company_name ?? 'Klient'} · ~${Math.round(daysLeft)} ditë rimbushje`,
            tone: daysLeft <= 3 ? 'red' : 'amber',
          })
        }
      }
    }

    for (const contract of activeContracts) {
      const days = daysUntilContractEnd(contract.ends_at)
      if (days <= 30) {
        items.push({
          id: `contract-${contract.id}`,
          href: '/admin/lease/contracts',
          title: contract.client?.company_name ?? 'Kontratë',
          detail: days < 0 ? 'Kontrata ka skaduar' : `Skadon për ${days} ditë`,
          tone: days <= 7 ? 'red' : 'amber',
        })
      }
    }

    return items.slice(0, 8)
  }, [deployedDevices, activeContracts])

  const refillDue = attention.filter(i => i.id.startsWith('refill-')).length
  const contractsEnding = attention.filter(i => i.id.startsWith('contract-')).length

  const inquiryChart = useMemo(() => {
    const now = new Date()
    const map = new Map<string, { month: string; count: number }>()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      map.set(key, { month: MONTH_LABELS[d.getMonth()], count: 0 })
    }
    for (const inquiry of inquiries) {
      const d = new Date(inquiry.created_at)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const entry = map.get(key)
      if (entry) entry.count += 1
    }
    return Array.from(map.values())
  }, [inquiries])

  const columns = useMemo<LegacyColumnDef<ClientRow, unknown>[]>(() => [
    {
      id: 'company',
      header: 'Klienti',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm text-text-primary">{row.original.client.company_name}</p>
          <p className="text-xs text-text-muted truncate max-w-[200px]">
            {row.original.locations.join(', ') || 'Pa lokacion'}
          </p>
        </div>
      ),
    },
    {
      id: 'devices',
      header: 'Pajisje',
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">{row.original.deviceCount}</span>
      ),
    },
    {
      id: 'mrr',
      header: 'MRR',
      cell: ({ row }) => (
        <span className="tabular-nums text-sm font-semibold">{formatPrice(row.original.monthlyFee)}</span>
      ),
    },
    {
      id: 'refill',
      header: 'Rimbushje',
      cell: ({ row }) => {
        const days = row.original.minDaysToRefill
        if (days === null) return <span className="text-text-muted">—</span>
        return (
          <span className={`tabular-nums text-sm ${days <= 7 ? 'text-red-600 font-semibold' : 'text-text-secondary'}`}>
            ~{Math.round(days)} ditë
          </span>
        )
      },
    },
    {
      id: 'contract',
      header: 'Kontrata',
      cell: ({ row }) => {
        const days = row.original.minContractDays
        if (days === null) return <span className="text-text-muted">—</span>
        return (
          <span className={`tabular-nums text-sm ${days <= 30 ? 'text-amber-600 font-semibold' : 'text-text-secondary'}`}>
            {days} ditë
          </span>
        )
      },
    },
    {
      id: 'payment',
      header: 'Pagesa',
      cell: ({ row }) => {
        const payment = LEASE_PAYMENT_LABELS[row.original.client.payment_status]
        return <span className={`badge text-xs ${payment?.color ?? ''}`}>{payment?.sq ?? '—'}</span>
      },
    },
  ], [])

  const exportCsv = () => {
    const headers = ['Kompania', 'Pajisje', 'Lokacionet', 'Tarifa/muaj', 'Ditë rimbushje', 'Ditë kontratë', 'Pagesa']
    const rows = clientRows.map(r => [
      r.client.company_name,
      r.deviceCount,
      r.locations.join('; '),
      r.monthlyFee.toFixed(2),
      r.minDaysToRefill !== null ? Math.round(r.minDaysToRefill) : '',
      r.minContractDays ?? '',
      LEASE_PAYMENT_LABELS[r.client.payment_status]?.sq ?? r.client.payment_status,
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lease-klientet.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const maxInquiries = Math.max(...inquiryChart.map(d => d.count), 1)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          label="MRR aktiv"
          value={formatPrice(mrr)}
          icon={TrendingUp}
          highlight
          change={`${activeContracts.length} kontrata aktive`}
        />
        <AdminKpiCard
          label="Kontrata aktive"
          value={activeContracts.length}
          icon={Handshake}
          href="/admin/lease/contracts"
          change={contractsEnding > 0 ? `${contractsEnding} skadojnë së shpejti` : 'Asnjë skadim i afërt'}
          changePositive={contractsEnding === 0}
        />
        <AdminKpiCard
          label="Pajisje në lokacion"
          value={deployedDevices.length}
          icon={Droplets}
          href="/admin/lease/devices"
          change={refillDue > 0 ? `${refillDue} kërkojnë rimbushje` : 'Nivelet në rregull'}
          changePositive={refillDue === 0}
        />
        <AdminKpiCard
          label="Kërkesa të reja"
          value={newInquiries.length}
          icon={Mail}
          href="/admin/lease/inquiries"
          change={`${inquiries.length} gjithsej`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 admin-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="admin-card-title">Kërkesat e fundit</h2>
            <span className="text-xs text-text-muted">6 muajt e fundit</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={inquiryChart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(14, 149, 189, 0.06)' }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}
                formatter={(value) => [value ?? 0, 'Kërkesa']}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {inquiryChart.map(entry => (
                  <Cell key={entry.month} fill={entry.count === maxInquiries && entry.count > 0 ? '#0e95bd' : '#b8e8f4'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-card-flush">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
            <h2 className="admin-card-title">Kërkon vëmendje</h2>
            {unpaidClients.length > 0 && (
              <span className="badge badge-warning text-xs">{unpaidClients.length} pagesa</span>
            )}
          </div>
          {attention.length === 0 && unpaidClients.length === 0 ? (
            <p className="px-5 py-10 text-sm text-text-muted text-center">Asgjë në pritje</p>
          ) : (
            <div className="divide-y divide-surface-border">
              {unpaidClients.slice(0, 3).map(client => (
                <Link
                  key={client.id}
                  href="/admin/lease/contracts"
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-soft transition-colors"
                >
                  <AlertTriangle size={14} className="mt-0.5 text-red-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{client.company_name}</p>
                    <p className="text-xs text-text-muted">
                      {LEASE_PAYMENT_LABELS[client.payment_status]?.sq ?? 'Pa paguar'}
                    </p>
                  </div>
                </Link>
              ))}
              {attention.map(item => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-soft transition-colors"
                >
                  {item.id.startsWith('refill-')
                    ? <Droplets size={14} className={`mt-0.5 shrink-0 ${item.tone === 'red' ? 'text-red-500' : 'text-amber-500'}`} />
                    : <Clock size={14} className={`mt-0.5 shrink-0 ${item.tone === 'red' ? 'text-red-500' : 'text-amber-500'}`} />
                  }
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                    <p className="text-xs text-text-muted truncate">{item.detail}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 admin-card-flush">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
            <h2 className="admin-card-title">Klientët aktivë</h2>
            <button type="button" onClick={exportCsv} className="btn-ghost text-xs py-1.5 px-2.5 gap-1.5">
              <Download size={13} />
              CSV
            </button>
          </div>
          <AdminTable
            data={clientRows}
            columns={columns}
            getRowId={row => row.client.id}
            emptyMessage="Asnjë klient me kontratë ose pajisje"
            className="border-0 rounded-none"
          />
        </div>

        <div className="admin-card-flush">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
            <h2 className="admin-card-title">Kërkesat e reja</h2>
            <Link href="/admin/lease/inquiries" className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
              Të gjitha <ArrowRight size={12} />
            </Link>
          </div>
          {newInquiries.length === 0 ? (
            <p className="px-5 py-10 text-sm text-text-muted text-center">Nuk ka kërkesa të reja</p>
          ) : (
            <div className="divide-y divide-surface-border">
              {newInquiries.slice(0, 6).map(inquiry => (
                <Link
                  key={inquiry.id}
                  href="/admin/lease/inquiries"
                  className="block px-5 py-3.5 hover:bg-surface-soft transition-colors"
                >
                  <p className="text-sm font-medium text-text-primary truncate">{inquiry.company || inquiry.name}</p>
                  <p className="text-xs text-text-muted truncate mt-0.5">{inquiry.email}</p>
                  <p className="text-[11px] text-text-muted mt-1">
                    {new Date(inquiry.created_at).toLocaleDateString('sq-AL')}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
