'use client'

import Link from 'next/link'
import { Building2, Mail, MapPin, Phone, Pencil, MoreHorizontal, ShoppingBag, FileText } from 'lucide-react'
import { formatPrice, statusColor, statusLabel } from '@/lib/utils'
import type { LeaseClient, Profile } from '@/types'

interface OrderRow {
  id: string
  order_number: string
  total: number
  status: string
  created_at: string
}

interface AddressRow {
  label: string
  city: string
  address: string
}

interface CustomerDetailPanelProps {
  profile?: Profile | null
  leaseClient?: LeaseClient | null
  orders: OrderRow[]
  addresses?: AddressRow[]
  onEdit?: () => void
  onClose: () => void
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

function collectAddresses(
  profile?: Profile | null,
  leaseClient?: LeaseClient | null,
  addresses: AddressRow[] = []
) {
  const seen = new Set<string>()
  const list: AddressRow[] = []

  const push = (label: string, city?: string | null, address?: string | null) => {
    const cityText = (city ?? '').trim()
    const addressText = (address ?? '').trim()
    if (!cityText && !addressText) return
    const key = `${cityText.toLowerCase()}|${addressText.toLowerCase()}`
    if (seen.has(key)) return
    seen.add(key)
    list.push({ label, city: cityText, address: addressText })
  }

  addresses.forEach((a, i) => push(a.label || `Adresa ${i + 1}`, a.city, a.address))
  push('Profili', profile?.city, profile?.address)
  ;(leaseClient?.addresses ?? []).forEach((a, i) => push(a.label || `Adresa ${i + 1}`, a.city, a.address))
  push('Shfrytëzimi', leaseClient?.city, leaseClient?.address)

  return list.map((a, i) => ({ ...a, label: `Adresa ${i + 1}` }))
}

export function CustomerDetailPanel({
  profile,
  leaseClient,
  orders,
  addresses = [],
  onEdit,
  onClose,
}: CustomerDetailPanelProps) {
  const name = profile?.full_name ?? leaseClient?.company_name ?? 'Klient'
  const email = profile?.email ?? leaseClient?.email ?? ''
  const phone = profile?.phone ?? leaseClient?.phone ?? ''
  const company = profile?.business_name ?? leaseClient?.company_name
  const createdAt = profile?.created_at ?? leaseClient?.created_at
  const locationList = collectAddresses(profile, leaseClient, addresses)

  return (
    <div className="grid lg:grid-cols-[minmax(24rem,28rem)_minmax(0,1fr)] gap-4 items-start">
      <div className="admin-card space-y-5">
        <div className="flex flex-col items-center text-center pt-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-xl font-bold text-brand-700">
              {initials(name)}
            </div>
            {leaseClient && (
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px]">✓</span>
            )}
          </div>
          <h2 className="text-lg font-bold text-text-primary mt-3">{name}</h2>
          {company && company !== name && (
            <p className="text-sm text-text-muted mt-0.5">{company}</p>
          )}
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {profile?.customer_type === 'business' && (
              <span className="badge badge-warning text-xs">Biznes</span>
            )}
            {leaseClient && (
              <span className="badge badge-success text-xs">Shfrytëzues</span>
            )}
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          {[
            { label: 'ID', value: (profile?.id ?? leaseClient?.id ?? '').slice(0, 8).toUpperCase() },
            { label: 'Regjistruar', value: createdAt ? new Date(createdAt).toLocaleDateString('sq-AL') : '—' },
            { label: 'Email', value: email || '—' },
            { label: 'Telefoni', value: phone || '—' },
            { label: 'Biznesi', value: company && company !== name ? company : '' },
            { label: 'Nr. Fiskal', value: profile?.fiscal_number ?? '' },
          ].filter(row => row.value).map(row => (
            <div key={row.label} className="flex items-start justify-between gap-3">
              <span className="text-text-muted shrink-0">{row.label}</span>
              <span className="font-medium text-text-primary text-right break-words min-w-0">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t border-surface-border pt-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Adresat</p>
          {locationList.length === 0 ? (
            <p className="text-sm text-text-muted">Nuk ka adresa të ruajtura</p>
          ) : (
            <div className="space-y-3">
              {locationList.map(addr => (
                <div key={`${addr.label}-${addr.city}-${addr.address}`} className="flex items-start gap-2.5 text-sm">
                  <MapPin size={15} className="text-brand-600 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-muted">{addr.label}</p>
                    <p className="font-medium text-text-primary break-words">
                      {[addr.city, addr.address].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          {phone && (
            <a href={`tel:${phone}`} className="flex-1 btn-secondary justify-center gap-2 py-2.5 text-sm">
              <Phone size={15} />
              Telefono
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="flex-1 btn-primary justify-center gap-2 py-2.5 text-sm">
              <Mail size={15} />
              Email
            </a>
          )}
          {onEdit && (
            <button type="button" onClick={onEdit} className="btn-secondary px-3 py-2.5">
              <Pencil size={15} />
            </button>
          )}
        </div>

        <button type="button" onClick={onClose} className="w-full text-xs text-text-muted hover:text-text-primary py-1">
          Kthehu te lista
        </button>
      </div>

      <div className="space-y-3">
        <div className="admin-card">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="admin-section-title">Porositë</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Total: <span className="font-semibold text-text-primary">{orders.length}</span>
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">
              <ShoppingBag size={28} className="mx-auto mb-2 opacity-40" />
              Asnjë porosi ende
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map(order => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="admin-row-card group"
                >
                  <div className="w-9 h-9 rounded-xl bg-surface-soft flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-text-primary truncate">
                      Porosia {order.order_number}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(order.created_at).toLocaleDateString('sq-AL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <p className="font-semibold text-sm text-text-primary">{formatPrice(order.total)}</p>
                  <span className={`badge text-xs border ${statusColor(order.status)}`}>
                    {statusLabel(order.status, 'sq')}
                  </span>
                  <MoreHorizontal size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {leaseClient && (
          <div className="admin-card">
            <h3 className="admin-section-title mb-3">Shfrytëzimi</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Building2 size={14} />
                {leaseClient.company_name}
              </div>
              <Link href="/admin/lease/contracts" className="inline-flex text-xs font-semibold text-brand-600 hover:text-brand-700 mt-1">
                Shiko kontratat →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
