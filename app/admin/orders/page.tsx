import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { formatPrice, statusColor, statusLabel } from '@/lib/utils'
import Link from 'next/link'
import { Eye, ShoppingBag } from 'lucide-react'
import { DeleteOrderButton } from './DeleteOrderButton'

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

async function getOrders(status?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  const { data } = await query
  return data ?? []
}

export default async function OrdersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const orders = await getOrders(status)

  return (
    <div>
      <AdminHeader
        title="Porositë"
        subtitle={`${orders.length} porosi`}
      />

      <div className="p-6">
        {/* Status filters */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
          <Link
            href="/admin/orders"
            className={`px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${!status ? 'bg-brand-600 text-white' : 'bg-white border border-surface-border text-text-secondary hover:border-brand-200'}`}
          >
            Të Gjitha
          </Link>
          {ORDER_STATUSES.map(s => (
            <Link
              key={s}
              href={`/admin/orders?status=${s}`}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                status === s
                  ? statusColor(s) + ' font-semibold'
                  : 'bg-white border-surface-border text-text-secondary hover:border-brand-200'
              }`}
            >
              {statusLabel(s, 'sq')}
            </Link>
          ))}
        </div>

        <div className="admin-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full admin-table">
              <thead>
                <tr className="bg-surface-soft border-b border-surface-border">
                  <th className="text-left">Numri</th>
                  <th className="text-left">Klienti</th>
                  <th className="text-left">Qyteti</th>
                  <th className="text-left">Totali</th>
                  <th className="text-left">Pagesa</th>
                  <th className="text-left">Statusi</th>
                  <th className="text-left">Data</th>
                  <th className="text-right">Veprime</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-surface-soft transition-colors">
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-brand-600 hover:text-brand-700 font-semibold text-xs">
                        {order.order_number}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-text-primary text-sm">{order.customer_name}</p>
                        <p className="text-text-muted text-xs">{order.customer_phone}</p>
                        {order.customer_type === 'business' && (
                          <p className="text-xs text-brand-500">{order.business_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="text-sm text-text-secondary">{order.city}</td>
                    <td className="font-semibold text-sm">{formatPrice(order.total)}</td>
                    <td>
                      <span className={`badge border text-xs ${statusColor(order.payment_status)}`}>
                        {statusLabel(order.payment_status, 'sq')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge border text-xs ${statusColor(order.status)}`}>
                        {statusLabel(order.status, 'sq')}
                      </span>
                    </td>
                    <td className="text-text-muted text-xs">
                      {new Date(order.created_at).toLocaleDateString('sq-AL')}
                      <br />
                      {new Date(order.created_at).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="p-1.5 text-text-muted hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all duration-200"
                        >
                          <Eye size={15} />
                        </Link>
                        <DeleteOrderButton id={order.id} orderNumber={order.order_number} />
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-text-muted">
                      <ShoppingBag size={32} className="mx-auto mb-3 opacity-40" />
                      <p>Nuk ka porosi</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
