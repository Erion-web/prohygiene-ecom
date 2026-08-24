import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingBag, RefreshCw, MapPin, ChevronRight,
  AlertCircle, Package, Plus, User,
} from 'lucide-react'
import { formatPrice, statusColor, statusLabel } from '@/lib/utils'
import { ProfileForm } from './ProfileForm'

const FREQ_LABELS: Record<string, string> = {
  weekly:   'Çdo javë',
  biweekly: 'Çdo 2 javë',
  monthly:  'Çdo muaj',
}

export default async function AccountPage() {
  const supabase = await createClient()
  const user = await getAuthUser()
  if (!user) redirect('/auth/login?redirect=/account')

  // Upsert profile so it always exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    await supabase.from('profiles').insert({
      id:            user.id,
      email:         user.email ?? '',
      full_name:     (user.user_metadata?.full_name as string | undefined) ?? null,
      role:          'customer',
      customer_type: 'individual',
    })
  }

  const name = profile?.full_name || user.user_metadata?.full_name as string | undefined
  const missingName = !name

  // Recent orders with their items + product images
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, total, created_at,
      items:order_items(
        id, product_name_sq, product_image_url, quantity, unit_price, sale_price
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Active subscriptions with items
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select(`
      id, name, frequency, next_order_date, is_active,
      items:subscription_items(
        quantity,
        product:products(id, name_sq, image_url, price, sale_price, unit)
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="space-y-6">

      {/* ── NAME SETUP PROMPT ── */}
      {missingName && (
        <div className="card p-5 border-amber-200 bg-amber-50 flex items-start gap-4">
          <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 text-sm">Plotësoni profilin tuaj</p>
            <p className="text-amber-700 text-xs mt-0.5 mb-3">
              Shtoni emrin tuaj dhe adresën për blerje më të shpejta.
            </p>
            <Link href="#profile" className="btn-primary py-1.5 px-4 text-xs gap-1.5">
              <User size={13} /> Plotëso Profilin
            </Link>
          </div>
        </div>
      )}

      {/* ── RECENT ORDERS ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-text-primary flex items-center gap-2">
            <ShoppingBag size={16} className="text-brand-500" />
            Porositë e Fundit
          </h2>
          {orders && orders.length > 0 && (
            <Link href="/account/orders" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
              Shiko të gjitha <ChevronRight size={12} />
            </Link>
          )}
        </div>

        {!orders || orders.length === 0 ? (
          <div className="card p-8 text-center">
            <Package size={36} className="text-text-muted mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-text-primary text-sm mb-1">Nuk keni porosi ende</p>
            <p className="text-text-muted text-xs mb-4">Shfletoni dyqanin dhe bëni blerjen e parë</p>
            <Link href="/shop" className="btn-primary py-2 px-5 text-sm inline-flex">Shko te Dyqani</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const items = order.items ?? []
              const images = items
                .filter((i: { product_image_url: string | null }) => i.product_image_url)
                .slice(0, 4)

              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="card p-4 flex items-center gap-4 hover:border-brand-200 transition-colors group"
                >
                  {/* Product image stack */}
                  <div className="flex -space-x-2 flex-shrink-0">
                    {images.length > 0 ? (
                      images.map((item: { id: string; product_image_url: string | null; product_name_sq: string }, idx: number) => (
                        <div key={item.id} className="w-11 h-11 rounded-xl border-2 border-white overflow-hidden bg-surface-soft relative" style={{ zIndex: images.length - idx }}>
                          <Image src={item.product_image_url!} alt={item.product_name_sq} fill className="object-cover" sizes="44px" />
                        </div>
                      ))
                    ) : (
                      <div className="w-11 h-11 rounded-xl border-2 border-white bg-brand-50 flex items-center justify-center">
                        <ShoppingBag size={16} className="text-brand-400" />
                      </div>
                    )}
                    {items.length > 4 && (
                      <div className="w-11 h-11 rounded-xl border-2 border-white bg-surface-muted flex items-center justify-center text-[10px] font-bold text-text-muted">
                        +{items.length - 4}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-text-primary">{order.order_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(order.status)}`}>
                        {statusLabel(order.status, 'sq')}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {items.length} artikuj · {new Date(order.created_at).toLocaleDateString('sq-AL')}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0 flex items-center gap-2">
                    <span className="font-extrabold text-text-primary">{formatPrice(order.total)}</span>
                    <ChevronRight size={15} className="text-text-muted group-hover:text-brand-600 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── ACTIVE SUBSCRIPTIONS ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-text-primary flex items-center gap-2">
            <RefreshCw size={16} className="text-brand-500" />
            Paketa Periodike
          </h2>
          <Link href="/account/subscriptions/new" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
            <Plus size={12} /> Shto Paketë
          </Link>
        </div>

        {!subscriptions || subscriptions.length === 0 ? (
          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <RefreshCw size={20} className="text-brand-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-primary text-sm">Nuk keni paketa aktive</p>
              <p className="text-text-muted text-xs mt-0.5">Krijoni një paketë periodike dhe kurseni kohë çdo muaj</p>
            </div>
            <Link href="/account/subscriptions/new" className="btn-primary py-2 px-4 text-xs gap-1.5 flex-shrink-0">
              <Plus size={13} /> Krijo
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map(sub => {
              const items = sub.items ?? []
              const subtotal = items.reduce((sum: number, item: any) => {
                const p = item.product
                return sum + (p?.sale_price ?? p?.price ?? 0) * item.quantity
              }, 0)

              return (
                <Link
                  key={sub.id}
                  href="/account/subscriptions"
                  className="card p-4 hover:border-brand-200 transition-colors group block"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <RefreshCw size={16} className="text-brand-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary text-sm">{sub.name}</p>
                        <p className="text-xs text-text-muted">
                          {FREQ_LABELS[sub.frequency]} · {items.length} produkte ·{' '}
                          Tjetër: {new Date(sub.next_order_date).toLocaleDateString('sq-AL')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-text-primary text-sm">{formatPrice(subtotal)}</span>
                      <ChevronRight size={15} className="text-text-muted group-hover:text-brand-600 transition-colors" />
                    </div>
                  </div>

                  {/* Product thumbnails */}
                  {items.length > 0 && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {items.slice(0, 5).map((item: any, idx: number) => {
                        const p = item.product
                        return p ? (
                          <div key={idx} className="flex items-center gap-1 bg-surface-soft rounded-lg px-2 py-1">
                            {p.image_url && (
                              <Image src={p.image_url} alt={p.name_sq} width={20} height={20} className="rounded object-cover" />
                            )}
                            <span className="text-[10px] text-text-secondary font-medium truncate max-w-[80px]">{p.name_sq}</span>
                            <span className="text-[10px] text-text-muted">×{item.quantity}</span>
                          </div>
                        ) : null
                      })}
                      {items.length > 5 && (
                        <span className="text-[10px] text-text-muted self-center">+{items.length - 5} të tjera</span>
                      )}
                    </div>
                  )}
                </Link>
              )
            })}

            <Link href="/account/subscriptions" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1 mt-1">
              Menaxho të gjitha paketat <ChevronRight size={12} />
            </Link>
          </div>
        )}
      </section>

      {/* ── PROFILE FORM ── */}
      <section id="profile">
        <h2 className="font-bold text-text-primary flex items-center gap-2 mb-4">
          <User size={16} className="text-brand-500" />
          {missingName ? 'Plotëso Profilin' : 'Të Dhënat e Profilit'}
        </h2>
        <ProfileForm profile={profile} email={user.email ?? ''} />
      </section>

    </div>
  )
}
