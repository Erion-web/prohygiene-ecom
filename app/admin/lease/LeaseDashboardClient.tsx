'use client'

import { useMemo, useState } from 'react'
import {
  Building2, Handshake, AlertTriangle, Mail, TrendingUp, Download, Bell,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import {
  dailyConsumptionRate,
  daysUntilEmpty,
  daysUntilContractEnd,
  LEASE_PAYMENT_LABELS,
} from '@/lib/lease/utils'
import type { DeployedDevice, LeaseClient, LeaseContract, LeaseInquiry, LeaseNotification } from '@/types'

interface Props {
  contracts: LeaseContract[]
  deployedDevices: DeployedDevice[]
  clients: LeaseClient[]
  inquiries: LeaseInquiry[]
  notifications: LeaseNotification[]
}

type Period = 'week' | 'month'

function periodStart(period: Period): Date {
  const d = new Date()
  if (period === 'week') d.setDate(d.getDate() - 7)
  else d.setMonth(d.getMonth() - 1)
  return d
}

export function LeaseDashboardClient({
  contracts,
  deployedDevices,
  clients,
  inquiries,
  notifications,
}: Props) {
  const [period, setPeriod] = useState<Period>('month')

  const start = periodStart(period)

  const activeContracts = contracts.filter(c => c.status === 'active')
  const mrr = activeContracts.reduce((s, c) => s + c.monthly_fee, 0)
  const dangerClients = clients.filter(c => c.payment_status === 'danger' || c.payment_status === 'unpaid')
  const periodInquiries = inquiries.filter(i => new Date(i.created_at) >= start)

  const clientRows = useMemo(() => {
    return clients.map(client => {
      const clientContracts = contracts.filter(c => c.client_id === client.id && c.status === 'active')
      const clientDevices = deployedDevices.filter(d => d.client_id === client.id)
      const locations = Array.from(new Set(clientDevices.map(d => d.location_label)))

      let minDaysToRefill: number | null = null
      let minContractDays: number | null = null

      for (const device of clientDevices) {
        const contract = device.contract
        if (contract) {
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
      }

      const monthlyFee = clientContracts.reduce((s, c) => s + c.monthly_fee, 0)
      const expectedConsumption = clientContracts.reduce((s, c) => s + c.expected_consumption, 0)

      return {
        client,
        deviceCount: clientDevices.length,
        locations,
        monthlyFee,
        expectedConsumption,
        minDaysToRefill,
        minContractDays,
      }
    }).filter(r => r.deviceCount > 0 || contracts.some(c => c.client_id === r.client.id))
  }, [clients, contracts, deployedDevices])

  const devicesDueRefill = useMemo(() => {
    let count = 0
    for (const device of deployedDevices) {
      const contract = device.contract
      if (!contract) continue
      const dailyRate = dailyConsumptionRate(contract.expected_consumption, contract.consumption_period)
      for (const level of device.consumable_levels ?? []) {
        const daysLeft = daysUntilEmpty(level.current_level, dailyRate)
        if (daysLeft !== null && daysLeft <= contract.surplus_days) count++
      }
    }
    return count
  }, [deployedDevices])

  const exportCsv = () => {
    const headers = ['Kompania', 'Pajisje', 'Lokacionet', 'Tarifa/muaj', 'Konsum i pritur', 'Ditë rimbushje', 'Ditë kontratë', 'Pagesa']
    const rows = clientRows.map(r => [
      r.client.company_name,
      r.deviceCount,
      r.locations.join('; '),
      r.monthlyFee.toFixed(2),
      r.expectedConsumption,
      r.minDaysToRefill !== null ? Math.round(r.minDaysToRefill) : '',
      r.minContractDays ?? '',
      LEASE_PAYMENT_LABELS[r.client.payment_status]?.sq ?? r.client.payment_status,
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lease-report-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = [
    { label: 'Kontrata aktive', value: activeContracts.length, icon: Handshake, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Pajisje instaluar', value: deployedDevices.length, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'MRR (€/muaj)', value: formatPrice(mrr), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Kërkesa (periudhë)', value: periodInquiries.length, icon: Mail, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Rimbushje due', value: devicesDueRefill, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Klientë rrezik', value: dangerClients.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {(['week', 'month'] as Period[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                period === p ? 'bg-brand-600 text-white' : 'bg-surface-soft text-text-secondary hover:bg-brand-50'
              }`}
            >
              {p === 'week' ? 'Javore' : 'Mujore'}
            </button>
          ))}
        </div>
        <button type="button" onClick={exportCsv} className="btn-secondary gap-1.5 text-xs py-1.5 px-3">
          <Download size={13} />
          CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map(s => (
          <div key={s.label} className="admin-card">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon size={15} className={s.color} />
              </div>
              <div className="min-w-0">
                <p className="admin-kpi-value leading-tight">{s.value}</p>
                <p className="admin-kpi-label truncate">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 admin-card overflow-hidden p-0">
          <div className="p-4 border-b border-surface-border">
            <h3 className="admin-section-title">Klientët — pamje operacionale</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full admin-table">
              <thead>
                <tr className="bg-surface-soft">
                  <th className="text-left">Kompania</th>
                  <th className="text-left">Pajisje</th>
                  <th className="text-left">MRR</th>
                  <th className="text-left">Rimbushje</th>
                  <th className="text-left">Kontrata</th>
                  <th className="text-left">Pagesa</th>
                </tr>
              </thead>
              <tbody>
                {clientRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-text-muted py-8">Asnjë klient me pajisje</td>
                  </tr>
                ) : (
                  clientRows.map(({ client, deviceCount, locations, monthlyFee, minDaysToRefill, minContractDays }) => (
                    <tr
                      key={client.id}
                      className={
                        client.payment_status === 'danger'
                          ? 'bg-red-50/50'
                          : client.payment_status === 'unpaid'
                            ? 'bg-amber-50/30'
                            : ''
                      }
                    >
                      <td>
                        <p className="font-medium text-sm">{client.company_name}</p>
                        <p className="text-xs text-text-muted truncate max-w-[160px]">{locations.join(', ') || '—'}</p>
                      </td>
                      <td className="text-sm">{deviceCount}</td>
                      <td className="text-sm font-semibold">{formatPrice(monthlyFee)}</td>
                      <td className="text-sm">
                        {minDaysToRefill !== null ? (
                          <span className={minDaysToRefill <= 7 ? 'text-red-600 font-semibold' : ''}>
                            ~{Math.round(minDaysToRefill)} ditë
                          </span>
                        ) : '—'}
                      </td>
                      <td className="text-sm">
                        {minContractDays !== null ? (
                          <span className={minContractDays <= 30 ? 'text-amber-600 font-semibold' : ''}>
                            {minContractDays} ditë
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`badge text-xs ${LEASE_PAYMENT_LABELS[client.payment_status]?.color ?? ''}`}>
                          {LEASE_PAYMENT_LABELS[client.payment_status]?.sq}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card p-0 overflow-hidden">
          <div className="p-4 border-b border-surface-border flex items-center gap-2">
            <Bell size={16} className="text-brand-600" />
            <h3 className="font-bold text-text-primary">Njoftimet e fundit</h3>
          </div>
          <div className="divide-y divide-surface-border max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-sm text-text-muted text-center">Asnjë njoftim</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="p-4">
                  <p className="text-sm font-semibold text-text-primary">{n.title}</p>
                  <p className="text-xs text-text-secondary mt-1 whitespace-pre-wrap line-clamp-3">{n.message}</p>
                  <p className="text-[10px] text-text-muted mt-2">
                    {new Date(n.created_at).toLocaleString('sq-AL')}
                    {n.email_sent ? ' · Email ✓' : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
