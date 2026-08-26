'use client'

import Link from 'next/link'
import { SearchableSelect, type SearchableOption } from '@/components/ui/searchable-select'
import type { LeaseDeviceOption } from '@/lib/lease/device-select'

interface Props {
  devices: LeaseDeviceOption[]
  value: string
  onChange: (id: string) => void
  required?: boolean
  disabled?: boolean
  placeholder?: string
  createReturnTo?: string
}

export function LeaseDeviceSelect({
  devices,
  value,
  onChange,
  disabled,
  placeholder = 'Zgjedh pajisjen...',
  createReturnTo,
}: Props) {
  const options: SearchableOption[] = devices.map(d => ({
    value: d.id,
    label: `${d.name_sq} (${d.sku})`,
    group: d.group,
  }))
  const createHref = createReturnTo
    ? `/admin/products/new?lease=1&return=${encodeURIComponent(createReturnTo)}`
    : '/admin/products/new?lease=1'

  if (devices.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 space-y-2">
        <p className="text-sm text-amber-900">
          Nuk ka pajisje në katalog. Shtoni një produkt me listim <strong>Shfrytëzim</strong>.
        </p>
        <Link href={createHref} className="btn-primary text-xs py-1.5 px-3 inline-flex">
          + Shto pajisje të re
        </Link>
      </div>
    )
  }

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={options}
      searchType="devices"
      placeholder={placeholder}
      searchPlaceholder="Kërko pajisjen..."
      disabled={disabled}
    />
  )
}

export function LeaseDeviceSelectFooter({ createReturnTo }: { createReturnTo?: string }) {
  const createHref = createReturnTo
    ? `/admin/products/new?lease=1&return=${encodeURIComponent(createReturnTo)}`
    : '/admin/products/new?lease=1'

  return (
    <Link href={createHref} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
      + Shto pajisje të re
    </Link>
  )
}
