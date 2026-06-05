import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { formatPrice, statusColor, statusLabel } from '@/lib/utils'
import Link from 'next/link'
import { Eye, ShoppingBag } from 'lucide-react'
import { DeleteOrderButton } from './DeleteOrderButton'

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

async function getOrders(status?: string) {
  const supabase = await createClient()
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
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
      <AdminHeader title="Porositë" subtitle={`${orders.length} porosi`} />

      <div className="p-3 md:p-6">
        {/* Status filter chips */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 no-scrollbar">
          <Link href="/admin/orders"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${!status ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-200 text-gray-500 hover:border-brand-300'}`}>
            Të Gjitha
          </Link>
          {ORDER_STATUSES.map(s => (
            <Link key={s} href={`/admin/orders?status=${s}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${status === s ? statusColor(s) : 'bg-white border-gray-200 text-gray-500 hover:border-brand-300'}`}>
              {statusLabel(s, 'sq')}
            </Link>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-gray-400">
            <ShoppingBag size={32} className="mx-auto mb-3 opacity-30" />
            <p>Nuk ka porosi</p>
          </div>
        ) : (
          <>
            {/* ── MOBILE CARDS ── */}
            <div className="md:hidden space-y-2">
              {orders.map(order => (
                <Link key={order.id} href={`/admin/orders/${order.id}`}
                  className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3.5 active:bg-gray-50 transition-colors">
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    order.status === 'delivered' ? 'bg-emerald-500' :
                    order.status === 'cancelled' ? 'bg-red-400' :
                    order.status === 'shipped'   ? 'bg-blue-500' :
                    'bg-amber-400'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-600">{order.order_number}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${statusColor(order.status)}`}>
                        {statusLabel(order.status, 'sq')}
                      </span>
                    </div>
                    <p className="font-medium text-sm text-gray-900 truncate mt-0.5">{order.customer_name}</p>
                    <p className="text-[11px] text-gray-400">{order.city} · {new Date(order.created_at).toLocaleDateString('sq-AL')}</p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="font-bold text-sm text-gray-900">{formatPrice(order.total)}</p>
                    <span className={`text-[10px] font-semibold ${statusColor(order.payment_status)}`}>
                      {statusLabel(order.payment_status, 'sq')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* ── DESKTOP TABLE ── */}
            <div className="hidden md:block bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      {['Numri','Klienti','Qyteti','Totali','Pagesa','Statusi','Data',''].map(h => (
                        <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50/60 transition-colors group">
                        <td className="px-3 py-2.5">
                          <Link href={`/admin/orders/${order.id}`} className="font-mono text-brand-600 hover:text-brand-700 font-semibold text-xs">
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-gray-900 text-sm">{order.customer_name}</p>
                          <p className="text-gray-400 text-xs">{order.customer_phone}</p>
                          {order.customer_type === 'business' && <p className="text-xs text-brand-500">{order.business_name}</p>}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-gray-500">{order.city}</td>
                        <td className="px-3 py-2.5 font-semibold text-sm text-gray-900">{formatPrice(order.total)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md border ${statusColor(order.payment_status)}`}>
                            {statusLabel(order.payment_status, 'sq')}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md border ${statusColor(order.status)}`}>
                            {statusLabel(order.status, 'sq')}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-400 text-xs">
                          {new Date(order.created_at).toLocaleDateString('sq-AL')}<br />
                          {new Date(order.created_at).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/orders/${order.id}`}
                              className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all">
                              <Eye size={14} />
                            </Link>
                            <DeleteOrderButton id={order.id} orderNumber={order.order_number} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
