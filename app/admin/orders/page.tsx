import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { ORDER_STATUSES } from '@/lib/orders/status'
import { statusColor, statusLabel } from '@/lib/utils'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { OrdersPageClient } from './OrdersPageClient'

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
      <AdminHeader
        title="Porositë"
        subtitle={`${orders.length} porosi`}
        actions={
          <Link href="/admin/orders/new" className="btn-primary gap-2 text-sm py-2">
            <Plus size={15} />
            Krijo
          </Link>
        }
      />

      <div className="admin-page">
        <div className="admin-filter-bar mb-1 overflow-x-auto pb-1 no-scrollbar">
          <Link href="/admin/orders"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${!status ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-surface-border text-text-muted hover:border-brand-300'}`}>
            Të Gjitha
          </Link>
          {ORDER_STATUSES.map(s => (
            <Link key={s} href={`/admin/orders?status=${s}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${status === s ? statusColor(s) : 'bg-white border-surface-border text-text-muted hover:border-brand-300'}`}>
              {statusLabel(s, 'sq')}
            </Link>
          ))}
        </div>

        <OrdersPageClient orders={orders} />
      </div>
    </div>
  )
}
