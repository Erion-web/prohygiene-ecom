import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminKpiCard } from '@/components/admin/AdminKpiCard'
import { RefreshCw, Package } from 'lucide-react'

const FREQ_LABELS: Record<string, string> = {
  weekly:   'Çdo javë',
  biweekly: 'Çdo 2 javë',
  monthly:  'Çdo muaj',
}

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient()

  const { data: subs } = await supabase
    .from('subscriptions')
    .select(`
      *,
      profile:profiles(full_name, email),
      items:subscription_items(
        quantity,
        product:products(name_sq, sku, price, sale_price, unit)
      )
    `)
    .order('created_at', { ascending: false })

  const activeCount   = subs?.filter(s => s.is_active).length ?? 0
  const pausedCount   = subs?.filter(s => !s.is_active).length ?? 0
  const totalProducts = subs?.reduce((n, s) => n + (s.items?.length ?? 0), 0) ?? 0

  return (
    <div>
      <AdminHeader
        title="Abonimi i Klientëve"
        subtitle="Porositë periodike automatike"
      />

      <div className="admin-page max-w-5xl">
        <div className="grid grid-cols-3 gap-4">
          <AdminKpiCard label="Aktive" value={activeCount} />
          <AdminKpiCard label="Pauzuara" value={pausedCount} />
          <AdminKpiCard label="Produkte gjithsej" value={totalProducts} icon={Package} />
        </div>

        {!subs || subs.length === 0 ? (
          <div className="admin-card p-12 text-center">
            <Package size={40} className="text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-text-secondary font-medium">Asnjë klient nuk ka paketë periodike ende</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subs.map(sub => {
              const items = sub.items ?? []
              const subtotal = items.reduce((sum: number, item: { product?: { sale_price?: number | null; price?: number }; quantity: number }) => {
                const p = item.product
                return sum + (p?.sale_price ?? p?.price ?? 0) * item.quantity
              }, 0)
              const profile = sub.profile as { full_name: string | null; email: string } | null

              return (
                <div key={sub.id} className={`admin-card ${!sub.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary text-sm">{sub.name}</span>
                        <span className={`badge text-xs ${sub.is_active ? 'badge-success' : 'badge-neutral'}`}>
                          {sub.is_active ? 'Aktive' : 'Pauzuar'}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-0.5">
                        {profile?.full_name || profile?.email || 'Klient i panjohur'}
                        {profile?.email && profile.full_name && (
                          <span className="text-text-muted ml-1">({profile.email})</span>
                        )}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <RefreshCw size={10} /> {FREQ_LABELS[sub.frequency]}
                        </span>
                        <span>
                          Tjetër: {new Date(sub.next_order_date).toLocaleDateString('sq-AL')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-text-primary whitespace-nowrap">
                      {subtotal.toFixed(2)}€
                    </p>
                  </div>

                  {items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-surface-border flex flex-wrap gap-2">
                      {items.map((item: { product?: { name_sq?: string }; quantity: number }, idx: number) => (
                        <span key={idx} className="text-xs px-2.5 py-1 bg-surface-soft rounded-full text-text-secondary">
                          {item.product?.name_sq} × {item.quantity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
