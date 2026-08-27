'use client'

import Link from 'next/link'
import { Eye } from 'lucide-react'
import { type LegacyColumnDef } from '@tanstack/react-table/legacy'
import { AdminTable } from '@/components/admin/AdminTable'
import { formatPrice, statusColor, statusLabel } from '@/lib/utils'
import { DeleteOrderButton } from '@/app/admin/orders/DeleteOrderButton'

export interface OrderTableRow {
  id: string
  order_number: string
  customer_name: string
  customer_phone?: string | null
  customer_type?: string | null
  business_name?: string | null
  city?: string | null
  total: number
  payment_status: string
  status: string
  created_at: string
}

interface OrdersAdminTableProps {
  orders: OrderTableRow[]
  variant?: 'full' | 'compact'
  emptyMessage?: string
}

const compactColumns: LegacyColumnDef<OrderTableRow, unknown>[] = [
  {
    id: 'order_number',
    header: 'Porosia',
    cell: ({ row }) => (
      <Link
        href={`/admin/orders/${row.original.id}`}
        className="font-mono text-brand-600 hover:text-brand-700 font-semibold text-xs"
      >
        {row.original.order_number}
      </Link>
    ),
  },
  {
    id: 'customer',
    header: 'Klienti',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-text-primary">{row.original.customer_name}</p>
        {row.original.customer_phone && (
          <p className="text-text-muted text-xs">{row.original.customer_phone}</p>
        )}
      </div>
    ),
  },
  {
    id: 'total',
    header: 'Totali',
    cell: ({ row }) => (
      <span className="font-semibold">{formatPrice(row.original.total)}</span>
    ),
  },
  {
    id: 'status',
    header: 'Statusi',
    cell: ({ row }) => (
      <span className={`badge border text-xs ${statusColor(row.original.status)}`}>
        {statusLabel(row.original.status, 'sq')}
      </span>
    ),
  },
  {
    id: 'date',
    header: 'Data',
    cell: ({ row }) => (
      <span className="text-text-muted text-xs">
        {new Date(row.original.created_at).toLocaleDateString('sq-AL')}
      </span>
    ),
  },
]

const fullColumns: LegacyColumnDef<OrderTableRow, unknown>[] = [
  {
    id: 'order_number',
    header: 'Numri',
    cell: ({ row }) => (
      <Link
        href={`/admin/orders/${row.original.id}`}
        className="font-mono text-brand-600 hover:text-brand-700 font-semibold text-xs"
      >
        {row.original.order_number}
      </Link>
    ),
  },
  {
    id: 'customer',
    header: 'Klienti',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-text-primary">{row.original.customer_name}</p>
        {row.original.customer_phone && (
          <p className="text-text-muted text-xs">{row.original.customer_phone}</p>
        )}
        {row.original.customer_type === 'business' && row.original.business_name && (
          <p className="text-xs text-brand-500">{row.original.business_name}</p>
        )}
      </div>
    ),
  },
  {
    id: 'city',
    header: 'Qyteti',
    cell: ({ row }) => (
      <span className="text-text-secondary">{row.original.city ?? '—'}</span>
    ),
  },
  {
    id: 'total',
    header: 'Totali',
    cell: ({ row }) => (
      <span className="font-semibold">{formatPrice(row.original.total)}</span>
    ),
  },
  {
    id: 'payment',
    header: 'Pagesa',
    cell: ({ row }) => (
      <span className={`badge text-[11px] border ${statusColor(row.original.payment_status)}`}>
        {statusLabel(row.original.payment_status, 'sq')}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Statusi',
    cell: ({ row }) => (
      <span className={`badge text-[11px] border ${statusColor(row.original.status)}`}>
        {statusLabel(row.original.status, 'sq')}
      </span>
    ),
  },
  {
    id: 'date',
    header: 'Data',
    cell: ({ row }) => (
      <span className="text-text-muted text-xs">
        {new Date(row.original.created_at).toLocaleDateString('sq-AL')}
        <br />
        {new Date(row.original.created_at).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
      </span>
    ),
  },
  {
    id: 'actions',
    header: '',
    meta: { align: 'right' },
    cell: ({ row }) => (
      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/admin/orders/${row.original.id}`}
          className="p-1.5 text-text-muted hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
        >
          <Eye size={14} />
        </Link>
        <DeleteOrderButton id={row.original.id} orderNumber={row.original.order_number} />
      </div>
    ),
  },
]

export function OrdersAdminTable({
  orders,
  variant = 'full',
  emptyMessage = 'Nuk ka porosi',
}: OrdersAdminTableProps) {
  return (
    <AdminTable
      data={orders}
      columns={variant === 'compact' ? compactColumns : fullColumns}
      getRowId={row => row.id}
      emptyMessage={emptyMessage}
    />
  )
}
