import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { formatPrice, statusColor, statusLabel } from '@/lib/utils'

export default async function AccountOrdersPage() {
  const supabase = await createClient()
  const user = await getAuthUser()
  if (!user) redirect('/auth/login?redirect=/account/orders')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, total, created_at, items:order_items(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-text-primary">Porositë e Mia</h1>
        <p className="text-text-muted text-sm mt-0.5">{orders?.length ?? 0} porosi gjithsej</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingBag size={48} className="text-text-muted mx-auto mb-4 opacity-30" />
          <p className="font-bold text-text-primary mb-1">Nuk keni porosi ende</p>
          <p className="text-text-muted text-sm mb-4">Produktet tuaja të para janë vetëm një klik larg</p>
          <Link href="/shop" className="btn-primary inline-flex">Shko te Dyqani</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const itemCount = (order.items as unknown as { count: number }[])?.[0]?.count ?? 0
            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="card p-4 flex items-center gap-4 hover:border-brand-200 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={18} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-sm text-text-primary">{order.order_number}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor(order.status)}`}>
                      {statusLabel(order.status, 'sq')}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {itemCount} artikuj · {new Date(order.created_at).toLocaleDateString('sq-AL')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-text-primary">{formatPrice(order.total)}</p>
                </div>
                <ChevronRight size={16} className="text-text-muted group-hover:text-brand-600 transition-colors" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
