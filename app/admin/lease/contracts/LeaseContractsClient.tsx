'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { PrintContractButton } from './PrintContractButton'
import toast from 'react-hot-toast'
import { useDebouncedValue } from '@tanstack/react-pacer'
import { createClient } from '@/lib/supabase/client'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import { formatPrice } from '@/lib/utils'
import { CONTRACT_STATUS_LABELS } from '@/lib/lease/utils'
import type { LeaseContract } from '@/types'

interface Props {
  initialContracts: LeaseContract[]
}

export function LeaseContractsClient({ initialContracts }: Props) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, { wait: 320 })
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const refresh = useScrollPreservingRefresh()

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return initialContracts.filter(c => {
      if (statusFilter && c.status !== statusFilter) return false
      if (fromDate && c.ends_at < fromDate) return false
      if (toDate && c.starts_at > toDate) return false
      if (!q) return true
      const name = c.client?.company_name?.toLowerCase() ?? ''
      const notes = c.notes?.toLowerCase() ?? ''
      return name.includes(q) || notes.includes(q)
    })
  }, [initialContracts, debouncedSearch, statusFilter, fromDate, toDate])

  const handleDelete = async (c: LeaseContract) => {
    if (!confirm('Fshi këtë kontratë?')) return
    const supabase = createClient()
    const { error } = await supabase.from('lease_contracts').delete().eq('id', c.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Kontrata u fshi')
      refresh()
    }
  }

  const hasFilters = Boolean(search || statusFilter || fromDate || toDate)

  return (
    <div className="space-y-3">
      <div className="admin-card space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-8"
              placeholder="Kërko klient ose shënim..."
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input sm:w-40">
            <option value="">Të gjitha statuset</option>
            <option value="draft">Draft</option>
            <option value="active">Aktiv</option>
            <option value="expired">Skaduar</option>
            <option value="cancelled">Anuluar</option>
          </select>
          <Link href="/admin/lease/contracts/new" className="btn-primary gap-2 text-sm shrink-0">
            <Plus size={15} />
            Kontratë e Re
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-text-muted">Nga</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input w-auto" />
          <label className="text-xs text-text-muted">Deri</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input w-auto" />
          <span className="ml-auto text-xs text-text-muted">
            {filtered.length} / {initialContracts.length}
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setFromDate('')
                setToDate('')
              }}
              className="text-xs font-semibold text-red-500 hover:underline"
            >
              Pastro
            </button>
          )}
        </div>
      </div>

      <div className="admin-card overflow-hidden p-0">
        <table className="w-full admin-table">
          <thead>
            <tr className="bg-surface-soft border-b border-surface-border">
              <th className="text-left">Klienti</th>
              <th className="text-left">Periudha</th>
              <th className="text-left">Pajisje</th>
              <th className="text-left">Tarifa/muaj</th>
              <th className="text-left">Statusi</th>
              <th className="text-right">Veprime</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-text-muted">
                  {hasFilters ? 'Asnjë kontratë nuk përputhet me filtrat' : 'Nuk ka kontrata ende'}
                </td>
              </tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-surface-soft">
                <td className="text-sm font-medium">{c.client?.company_name ?? '—'}</td>
                <td className="text-sm text-text-secondary">
                  {c.starts_at} → {c.ends_at}
                  <span className="block text-xs text-text-muted">{c.duration_months} muaj</span>
                </td>
                <td className="text-sm">{c.device_count}</td>
                <td className="text-sm font-semibold">{formatPrice(c.monthly_fee)}</td>
                <td>
                  <span className="badge text-xs bg-surface-soft">{CONTRACT_STATUS_LABELS[c.status] ?? c.status}</span>
                </td>
                <td>
                  <div className="flex justify-end gap-1.5">
                    <PrintContractButton contractId={c.id} iconOnly />
                    <Link href={`/admin/lease/contracts/${c.id}/edit`} className="p-1.5 hover:bg-brand-50 rounded-lg" title="Modifiko">
                      <Edit size={14} />
                    </Link>
                    <button type="button" onClick={() => handleDelete(c)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
