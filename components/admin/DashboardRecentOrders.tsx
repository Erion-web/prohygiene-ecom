'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { OrdersAdminTable, type OrderTableRow } from '@/components/admin/OrdersAdminTable'

interface DashboardRecentOrdersProps {
  orders: OrderTableRow[]
}

export function DashboardRecentOrders({ orders }: DashboardRecentOrdersProps) {
  return (
    <div className="admin-card-flush">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
        <h2 className="admin-card-title">Porositë e Fundit</h2>
        <Link href="/admin/orders" className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
          Shiko të gjitha <ArrowRight size={12} />
        </Link>
      </div>
      <OrdersAdminTable orders={orders} variant="compact" emptyMessage="Nuk ka porosi ende" />
    </div>
  )
}
