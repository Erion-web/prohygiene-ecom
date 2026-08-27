'use client'

import { useMemo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { type LegacyColumnDef } from '@tanstack/react-table/legacy'
import { AdminTable } from '@/components/admin/AdminTable'
import type { LeaseClient, Profile } from '@/types'

export interface CustomerTableRow {
  id: string
  kind: 'profile' | 'lease'
  name: string
  phone?: string | null
  email: string
  customerType: 'individual' | 'business' | 'lease'
  businessName?: string | null
  role?: string
  isLease: boolean
  city?: string | null
  createdAt: string
  profile?: Profile
  lease?: LeaseClient
}

interface CustomersAdminTableProps {
  rows: CustomerTableRow[]
  emptyMessage?: string
  onRowClick: (row: CustomerTableRow) => void
  onToggleLease: (row: CustomerTableRow) => void
  onEdit: (row: CustomerTableRow) => void
  onDelete: (row: CustomerTableRow) => void
}

export function CustomersAdminTable({
  rows,
  emptyMessage = 'Nuk ka klientë ende',
  onRowClick,
  onToggleLease,
  onEdit,
  onDelete,
}: CustomersAdminTableProps) {
  const columns = useMemo<LegacyColumnDef<CustomerTableRow, unknown>[]>(() => [
    {
      id: 'customer',
      header: 'Klienti',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-text-primary text-sm">{row.original.name}</p>
          {row.original.phone && <p className="text-text-muted text-xs">{row.original.phone}</p>}
          {row.original.businessName && (
            <p className="text-xs text-brand-500">{row.original.businessName}</p>
          )}
        </div>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm text-text-secondary">{row.original.email}</span>
      ),
    },
    {
      id: 'type',
      header: 'Tipi',
      cell: ({ row }) => (
        <span className={`badge text-xs ${
          row.original.customerType === 'business' || row.original.customerType === 'lease'
            ? 'badge-warning'
            : 'badge-neutral'
        }`}>
          {row.original.customerType === 'business' || row.original.customerType === 'lease' ? 'Biznes' : 'Individual'}
        </span>
      ),
    },
    {
      id: 'role',
      header: 'Roli',
      cell: ({ row }) => (
        row.original.role ? (
          <span className={`badge text-xs ${row.original.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'badge-neutral'}`}>
            {row.original.role}
          </span>
        ) : (
          <span className="badge text-xs badge-neutral">—</span>
        )
      ),
    },
    {
      id: 'lease',
      header: 'Shfrytëzues',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onToggleLease(row.original)
          }}
          className={`badge text-xs ${row.original.isLease ? 'badge-success' : 'badge-neutral'}`}
        >
          {row.original.isLease ? 'PO' : 'JO'}
        </button>
      ),
    },
    {
      id: 'city',
      header: 'Qyteti',
      cell: ({ row }) => (
        <span className="text-sm text-text-secondary">{row.original.city ?? '—'}</span>
      ),
    },
    {
      id: 'created',
      header: 'Regjistruar',
      cell: ({ row }) => (
        <span className="text-xs text-text-muted">
          {new Date(row.original.createdAt).toLocaleDateString('sq-AL')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Veprime',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onEdit(row.original)}
            className="p-1.5 hover:bg-brand-50 rounded-lg"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(row.original)}
            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ], [onToggleLease, onEdit, onDelete])

  return (
    <AdminTable
      data={rows}
      columns={columns}
      getRowId={row => `${row.kind}-${row.id}`}
      onRowClick={onRowClick}
      emptyMessage={emptyMessage}
    />
  )
}
