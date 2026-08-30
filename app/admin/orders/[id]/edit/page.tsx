import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { OrderForm } from '../../OrderForm'

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single()
  if (!order) notFound()

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
        <OrderForm order={order} />
      </div>
    </div>
  )
}
