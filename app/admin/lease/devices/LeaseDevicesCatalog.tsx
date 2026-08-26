import Link from 'next/link'
import { Edit, Plus } from 'lucide-react'
import { toLeaseDeviceOptions, type LeaseDeviceRow } from '@/lib/lease/device-select'

interface Props {
  devices: LeaseDeviceRow[] | null[] | Record<string, unknown>[]
}

export function LeaseDevicesCatalog({ devices }: Props) {
  const options = toLeaseDeviceOptions(devices as LeaseDeviceRow[])

  return (
    <div className="admin-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-sm">Katalogu i pajisjeve</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Produktet me listim Shfrytëzim — zgjidhen kur krijoni një kontratë
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products?listing=lease" className="btn-secondary text-xs py-1.5 px-3">
            Shiko në produkte
          </Link>
          <Link href="/admin/products/new?lease=1&return=/admin/lease/devices" className="btn-primary gap-1.5 text-xs py-1.5 px-3">
            <Plus size={14} />
            Shto pajisje
          </Link>
        </div>
      </div>

      {options.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">
          Asnjë pajisje ende.{' '}
          <Link href="/admin/products/new?lease=1&return=/admin/lease/devices" className="text-brand-600 font-semibold">
            Krijoni të parën
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full admin-table">
            <thead>
              <tr className="bg-surface-soft border-b border-surface-border">
                <th className="text-left">Pajisja</th>
                <th className="text-left">Kategoria</th>
                <th className="text-right w-16" />
              </tr>
            </thead>
            <tbody>
              {options.map(d => (
                <tr key={d.id} className="hover:bg-surface-soft">
                  <td>
                    <p className="font-medium text-sm">{d.name_sq}</p>
                    <p className="text-xs text-text-muted font-mono">{d.sku}</p>
                  </td>
                  <td className="text-sm text-text-secondary">{d.group}</td>
                  <td className="text-right">
                    <Link href={`/admin/products/${d.id}/edit`} className="p-1.5 inline-flex hover:bg-brand-50 rounded-lg text-text-muted hover:text-brand-600">
                      <Edit size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
