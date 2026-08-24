'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useScrollPreservingRefresh } from '@/hooks/useScrollPreservingRefresh'
import type { LeaseInquiry, LeaseInquiryStatus } from '@/types'

interface Props {
  initialInquiries: LeaseInquiry[]
}

const STATUS_LABELS: Record<LeaseInquiryStatus, string> = {
  new: 'E re',
  contacted: 'Kontaktuar',
  closed: 'Mbyllur',
}

export function LeaseInquiriesClient({ initialInquiries }: Props) {
  const refresh = useScrollPreservingRefresh()
  const [updating, setUpdating] = useState<string | null>(null)

  const updateStatus = async (id: string, status: LeaseInquiryStatus) => {
    setUpdating(id)
    const supabase = createClient()
    const { error } = await supabase.from('lease_inquiries').update({ status }).eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Statusi u përditësua')
      refresh()
    }
    setUpdating(null)
  }

  if (initialInquiries.length === 0) {
    return (
      <div className="admin-card p-12 text-center text-text-muted">
        Asnjë kërkesë ende.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {initialInquiries.map(inq => (
        <div key={inq.id} className="admin-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-bold text-text-primary">{inq.name}</p>
              <p className="text-sm text-text-secondary">{inq.email}{inq.phone ? ` · ${inq.phone}` : ''}</p>
              {inq.company && <p className="text-sm text-text-muted">{inq.company}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="badge text-xs bg-brand-50 text-brand-700">
                {STATUS_LABELS[inq.status]}
              </span>
              <select
                value={inq.status}
                disabled={updating === inq.id}
                onChange={e => updateStatus(inq.id, e.target.value as LeaseInquiryStatus)}
                className="input text-xs py-1.5 w-auto"
              >
                <option value="new">E re</option>
                <option value="contacted">Kontaktuar</option>
                <option value="closed">Mbyllur</option>
              </select>
            </div>
          </div>
          {inq.product && (
            <p className="text-sm mb-2">
              <span className="text-text-muted">Pajisja:</span>{' '}
              <span className="font-medium">{inq.product.name_sq}</span>
            </p>
          )}
          {inq.message && (
            <p className="text-sm text-text-secondary whitespace-pre-wrap bg-surface-soft rounded-xl p-3">{inq.message}</p>
          )}
          <p className="text-xs text-text-muted mt-3">
            {new Date(inq.created_at).toLocaleString('sq-AL')}
          </p>
        </div>
      ))}
    </div>
  )
}
