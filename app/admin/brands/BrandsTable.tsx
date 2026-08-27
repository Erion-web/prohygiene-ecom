'use client'

import Link from 'next/link'
import { Pencil, Award } from 'lucide-react'
import { type LegacyColumnDef } from '@tanstack/react-table/legacy'
import { AdminTable } from '@/components/admin/AdminTable'
import { DeleteBrandButton } from './DeleteBrandButton'

interface BrandRow {
  id: string
  name: string
  slug: string
  logo_url: string | null
  is_active: boolean
  productCount: number
}

interface BrandsTableProps {
  brands: BrandRow[]
}

const columns: LegacyColumnDef<BrandRow, unknown>[] = [
  {
    id: 'name',
    header: 'Emri',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {row.original.logo_url ? (
          <img src={row.original.logo_url} alt={row.original.name} className="w-8 h-8 object-contain rounded" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
            <Award size={14} className="text-brand-500" />
          </div>
        )}
        <span className="font-medium text-text-primary">{row.original.name}</span>
      </div>
    ),
  },
  {
    id: 'slug',
    header: 'Slug',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-text-muted">{row.original.slug}</span>
    ),
  },
  {
    id: 'products',
    header: 'Produkte',
    cell: ({ row }) => (
      <span className="text-text-secondary">{row.original.productCount}</span>
    ),
  },
  {
    id: 'status',
    header: 'Statusi',
    cell: ({ row }) => (
      <span className={`badge text-xs ${row.original.is_active ? 'badge-success' : 'badge-neutral'}`}>
        {row.original.is_active ? 'Aktiv' : 'Joaktiv'}
      </span>
    ),
  },
  {
    id: 'actions',
    header: 'Veprime',
    meta: { align: 'right' },
    cell: ({ row }) => (
      <div className="flex items-center gap-2 justify-end" onClick={e => e.stopPropagation()}>
        <Link
          href={`/admin/brands/${row.original.id}/edit`}
          className="p-1.5 rounded-lg text-text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
        >
          <Pencil size={14} />
        </Link>
        <DeleteBrandButton id={row.original.id} name={row.original.name} productCount={row.original.productCount} />
      </div>
    ),
  },
]

export function BrandsTable({ brands }: BrandsTableProps) {
  return (
    <AdminTable
      data={brands}
      columns={columns}
      getRowId={row => row.id}
      emptyMessage="Nuk ka brende ende"
    />
  )
}
