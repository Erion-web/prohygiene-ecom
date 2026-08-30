'use client'

import { useMemo } from 'react'
import { type LegacyColumnDef } from '@tanstack/react-table/legacy'
import { Edit, Trash2 } from 'lucide-react'
import { AdminTable } from '@/components/admin/AdminTable'
import { dailyConsumptionRate, daysUntilEmpty } from '@/lib/lease/utils'
import type { DeployedDevice } from '@/types'

const STATUS_LABELS: Record<DeployedDevice['status'], { label: string; className: string }> = {
  active: { label: 'Aktiv', className: 'badge-success' },
  maintenance: { label: 'Mirëmbajtje', className: 'badge-warning' },
  retired: { label: 'Tërhequr', className: 'badge-neutral' },
}

interface DeployedDevicesTableProps {
  devices: DeployedDevice[]
  onEdit: (device: DeployedDevice) => void
  onDelete: (device: DeployedDevice) => void
}

export function DeployedDevicesTable({
  devices,
  onEdit,
  onDelete,
}: DeployedDevicesTableProps) {
  const columns = useMemo<LegacyColumnDef<DeployedDevice, unknown>[]>(
    () => [
      {
        id: 'product',
        header: 'Pajisja',
        cell: ({ row }) => (
          <p className="text-sm font-medium text-text-primary max-w-[200px] truncate" title={row.original.product?.name_sq ?? undefined}>
            {row.original.product?.name_sq ?? 'Pajisje'}
          </p>
        ),
      },
      {
        id: 'contract',
        header: 'Kontrata',
        cell: ({ row }) => (
          <p className="text-sm font-semibold tabular-nums text-text-primary">
            {row.original.contract?.contract_number != null ? `#${row.original.contract.contract_number}` : '—'}
          </p>
        ),
      },
      {
        id: 'client',
        header: 'Klienti',
        cell: ({ row }) => (
          <p className="text-sm text-text-secondary max-w-[140px] truncate" title={row.original.client?.company_name ?? undefined}>
            {row.original.client?.company_name ?? '—'}
          </p>
        ),
      },
      {
        id: 'location',
        header: 'Lokacioni',
        cell: ({ row }) => (
          <p className="text-sm text-text-secondary max-w-[120px] truncate" title={row.original.location_label}>
            {row.original.location_label}
          </p>
        ),
      },
      {
        id: 'address',
        header: 'Adresa',
        cell: ({ row }) => {
          const parts = [row.original.city, row.original.address].filter(Boolean)
          const text = parts.length > 0 ? parts.join(', ') : '—'
          return (
            <p className="text-xs text-text-muted max-w-[160px] truncate" title={text}>
              {text}
            </p>
          )
        },
      },
      {
        id: 'levels',
        header: 'Materialet',
        cell: ({ row }) => {
          const d = row.original
          const levels = d.consumable_levels ?? []
          if (levels.length === 0) {
            return <span className="text-xs text-text-muted">—</span>
          }

          const dailyRate = d.contract
            ? dailyConsumptionRate(d.contract.expected_consumption, d.contract.consumption_period)
            : 0

          return (
            <div className="space-y-1.5 min-w-[180px]">
              {levels.map(level => {
                const pct = level.capacity > 0 ? Math.round((level.current_level / level.capacity) * 100) : 0
                const daysLeft = daysUntilEmpty(level.current_level, dailyRate)
                const barColor = pct <= 20 ? 'bg-red-500' : pct <= 40 ? 'bg-amber-500' : 'bg-emerald-500'

                return (
                  <div key={level.id} className="flex items-center gap-2">
                    <span
                      className="text-[11px] text-text-muted w-[72px] truncate shrink-0"
                      title={level.material?.name_sq ?? undefined}
                    >
                      {level.material?.name_sq ?? 'Material'}
                    </span>
                    <div className="h-1.5 flex-1 min-w-[56px] bg-surface-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <span className="text-[11px] text-text-muted tabular-nums w-9 shrink-0 text-right">{pct}%</span>
                    {daysLeft !== null && (
                      <span className={`text-[11px] tabular-nums shrink-0 ${daysLeft <= 7 ? 'text-red-600 font-semibold' : 'text-text-muted'}`}>
                        ~{Math.round(daysLeft)}d
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )
        },
      },
      {
        id: 'status',
        header: 'Statusi',
        cell: ({ row }) => {
          const status = STATUS_LABELS[row.original.status]
          return <span className={`badge text-xs ${status.className}`}>{status.label}</span>
        },
      },
      {
        id: 'actions',
        header: 'Veprime',
        meta: { align: 'right' },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => onEdit(row.original)} className="btn-ghost p-1.5">
              <Edit size={14} />
            </button>
            <button type="button" onClick={() => onDelete(row.original)} className="btn-ghost p-1.5 text-red-500">
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete]
  )

  return (
    <AdminTable
      data={devices}
      columns={columns}
      getRowId={row => row.id}
      emptyMessage="Nuk ka pajisje ende. Shtojini në kontratë — shfaqen këtu automatikisht."
    />
  )
}
