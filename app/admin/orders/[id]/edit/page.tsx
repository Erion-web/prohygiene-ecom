import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { OrderForm } from '../../OrderForm'
import { OrderPricingForm } from '../../OrderPricingForm'

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single()
  if (!order) notFound()
  const { data: items } = await supabase
    .from('order_items')
    .select('id, product_name_sq, quantity, unit_price, sale_price')
    .eq('order_id', id)
    .order('created_at', { ascending: true })
  const isManual = order.source === 'admin'

  return (
    <div>
      <AdminHeader
        title={`Modifiko ${order.order_number}`}
        subtitle={order.customer_name}
        actions={
          <Link href={`/admin/orders/${order.id}`} className="btn-ghost gap-1.5 text-sm">
            <ArrowLeft size={15} />
            Kthehu
          </Link>
        }
      />
      <div className="admin-page max-w-3xl">
        {isManual ? (
          <div className="mb-4">
            <OrderPricingForm orderId={order.id} items={items ?? []} shippingCost={Number(order.shipping_cost)} />
          </div>
        ) : (
          <p className="admin-card text-xs text-text-muted mb-4">
            Çmimet mund të ndryshohen vetëm për porositë e krijuara manualisht nga admini, jo për porositë e klientëve.
          </p>
        )}
        <OrderForm order={order} />
      </div>
    </div>
  )
}
