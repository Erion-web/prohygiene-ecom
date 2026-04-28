'use client'

import { Download, Users, Building2, User } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Profile } from '@/types'

interface Props { customers: Profile[] }

function exportCSV(customers: Profile[]) {
  const headers = [
    'Emri', 'Email', 'Telefoni', 'Tipi', 'Roli',
    'Biznesi', 'Nr. Fiskal', 'Qyteti', 'Adresa', 'Regjistruar',
  ]

  const rows = customers.map(c => [
    c.full_name ?? '',
    c.email,
    c.phone ?? '',
    c.customer_type === 'business' ? 'Biznes' : 'Individual',
    c.role,
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

export function CustomersClient({ customers }: Props) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-sm text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Users size={14} />
            {customers.length} gjithsej
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 size={14} />
            {customers.filter(c => c.customer_type === 'business').length} biznese
          </span>
          <span className="flex items-center gap-1.5">
            <User size={14} />
            {customers.filter(c => c.customer_type === 'individual').length} individuale
          </span>
        </div>
        <button
          onClick={() => exportCSV(customers)}
          className="btn-secondary gap-2 text-sm py-2"
        >
          <Download size={14} />
          Exporto CSV
        </button>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr className="bg-surface-soft border-b border-surface-border">
                <th className="text-left">Klienti</th>
                <th className="text-left">Email</th>
                <th className="text-left">Tipi</th>
                <th className="text-left">Roli</th>
                <th className="text-left">Qyteti</th>
                <th className="text-left">Regjistruar</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-surface-soft transition-colors">
                  <td>
                    <div>
                      <p className="font-medium text-text-primary text-sm">{c.full_name ?? '—'}</p>
                      {c.phone && <p className="text-text-muted text-xs">{c.phone}</p>}
                      {c.customer_type === 'business' && c.business_name && (
                        <p className="text-xs text-brand-500">{c.business_name}</p>
                      )}
                    </div>
                  </td>
                  <td className="text-sm text-text-secondary">{c.email}</td>
                  <td>
                    <span className={`badge text-xs ${c.customer_type === 'business' ? 'badge-warning' : 'badge-neutral'}`}>
                      {c.customer_type === 'business' ? 'Biznes' : 'Individual'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge text-xs ${c.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'badge-neutral'}`}>
                      {c.role}
                    </span>
                  </td>
                  <td className="text-sm text-text-secondary">{c.city ?? '—'}</td>
                  <td className="text-xs text-text-muted">
                    {new Date(c.created_at).toLocaleDateString('sq-AL')}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted">
                    <Users size={32} className="mx-auto mb-3 opacity-40" />
                    <p>Nuk ka klientë ende</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
