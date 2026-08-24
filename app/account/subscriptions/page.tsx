import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, RefreshCw, Package, Calendar, Pencil, Pause, Play, Trash2 } from 'lucide-react'
import { SubscriptionActions } from './SubscriptionActions'

const FREQ_LABELS: Record<string, string> = {
  weekly:    'Çdo javë',
  biweekly:  'Çdo 2 javë',
  monthly:   'Çdo muaj',
}

export default async function SubscriptionsPage() {
  const supabase = await createClient()
  const user = await getAuthUser()
  if (!user) redirect('/auth/login?redirect=/account/subscriptions')

  const { data: subs } = await supabase
    .from('subscriptions')
    .select(`
      *,
      items:subscription_items(
        id, quantity,
        product:products(id, name_sq, image_url, price, sale_price, unit)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-text-primary flex items-center gap-2">
            <RefreshCw size={22} className="text-brand-500" />
            Porositë Periodike
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Zgjidhni produktet dhe frekuencën — ne porositim automatikisht
          </p>
        </div>
        <Link href="/account/subscriptions/new" className="btn-primary gap-2">
          <Plus size={16} /> Shto Paketë
        </Link>
      </div>

      {!subs || subs.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={48} className="text-text-muted mx-auto mb-4 opacity-40" />
          <h2 className="font-bold text-text-primary text-lg mb-1">Nuk keni paketa aktive</h2>
          <p className="text-text-muted text-sm mb-6">
            Krijoni paketën e parë dhe kurseni kohë çdo muaj
          </p>
          <Link href="/account/subscriptions/new" className="btn-primary inline-flex gap-2">
            <Plus size={16} /> Krijo Paketën e Parë
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subs.map(sub => {
            const items = sub.items ?? []
            const subtotal = items.reduce((sum: number, item: any) => {
              const p = item.product
              const price = p?.sale_price ?? p?.price ?? 0
              return sum + price * item.quantity
            }, 0)

            return (
              <div key={sub.id} className={`card p-5 ${!sub.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-text-primary text-base">{sub.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <RefreshCw size={12} />
                        {FREQ_LABELS[sub.frequency]}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Porosia tjetër: {new Date(sub.next_order_date).toLocaleDateString('sq-AL')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${sub.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-muted text-text-muted'}`}>
                      {sub.is_active ? 'Aktive' : 'Pauzuar'}
                    </span>
                    <SubscriptionActions id={sub.id} isActive={sub.is_active} />
                  </div>
                </div>

                {/* Items */}
                <div className="mt-4 space-y-2">
                  {items.map((item: any) => {
                    const p = item.product
                    if (!p) return null
                    const price = p.sale_price ?? p.price
                    return (
                      <div key={item.id} className="flex items-center gap-3 py-2 border-b border-surface-border/50 last:border-0">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name_sq} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-muted" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{p.name_sq}</p>
                          <p className="text-xs text-text-muted">{item.quantity} {p.unit}</p>
                        </div>
                        <p className="text-sm font-semibold text-text-primary">
                          {(price * item.quantity).toFixed(2)}€
                        </p>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
                  <Link
                    href={`/account/subscriptions/new?edit=${sub.id}`}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                  >
                    <Pencil size={11} /> Ndrysho paketën
                  </Link>
                  <p className="text-sm font-bold text-text-primary">
                    Gjithsej: {subtotal.toFixed(2)}€
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
