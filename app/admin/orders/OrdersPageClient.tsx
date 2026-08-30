'use client'

import Link from 'next/link'
import { Pencil, ShoppingBag } from 'lucide-react'
import { OrdersAdminTable, type OrderTableRow } from '@/components/admin/OrdersAdminTable'
import { formatPrice, statusColor, statusLabel } from '@/lib/utils'
import { normalizeOrderStatus } from '@/lib/orders/status'
import { DeleteOrderButton } from './DeleteOrderButton'

interface OrdersPageClientProps {
  orders: OrderTableRow[]
}

export function OrdersPageClient({ orders }: OrdersPageClientProps) {
  if (orders.length === 0) {
    return (
      <div className="admin-card p-12 text-center text-text-muted">
        <ShoppingBag size={32} className="mx-auto mb-3 opacity-30" />
        <p>Nuk ka porosi</p>
      </div>
    )
  }

  return (
    <>
      <div className="md:hidden space-y-2">
        {orders.map(order => (
          <div key={order.id} className="admin-row-card">
            <Link href={`/admin/orders/${order.id}`} className="flex flex-1 min-w-0 items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                normalizeOrderStatus(order.status) === 'completed' ? 'bg-emerald-500' :
                normalizeOrderStatus(order.status) === 'processing' ? 'bg-indigo-500' :
                'bg-amber-400'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-600">{order.order_number}</span>
                  <span className={`badge text-[10px] border ${statusColor(order.status)}`}>
                    {statusLabel(order.status, 'sq')}
                  </span>
                </div>
                <p className="font-medium text-sm text-text-primary truncate mt-0.5">{order.customer_name}</p>
                <p className="text-[11px] text-text-muted">
                  {order.city} · {new Date(order.created_at).toLocaleDateString('sq-AL')}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="font-semibold text-sm text-text-primary">{formatPrice(order.total)}</p>
                <span className={`text-[10px] font-semibold ${statusColor(order.payment_status)}`}>
                  {statusLabel(order.payment_status, 'sq')}
                </span>
              </div>
            </Link>
            <div className="flex flex-col gap-0.5 shrink-0">
              <Link
                href={`/admin/orders/${order.id}/edit`}
                className="p-1.5 text-text-muted hover:text-brand-600 hover:bg-brand-50 rounded-lg"
              >
                <Pencil size={14} />
              </Link>
              <DeleteOrderButton id={order.id} orderNumber={order.order_number} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <OrdersAdminTable orders={orders} variant="full" />
      </div>
    </>
  )
}
