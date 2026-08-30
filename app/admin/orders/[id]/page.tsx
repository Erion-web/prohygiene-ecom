import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { formatPrice, statusColor, statusLabel } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Package, Truck } from 'lucide-react'
import Image from 'next/image'
import { OrderStatusUpdater } from './OrderStatusUpdater'
import { FalconSendButton } from './FalconSendButton'

async function getOrder(id: string) {
  const supabase = await createClient()
  const [orderRes, itemsRes] = await Promise.all([
    supabase.from('orders').select('*').eq('id', id).single(),
    supabase.from('order_items').select('*').eq('order_id', id),
  ])
  if (!orderRes.data) return null
  return { ...orderRes.data, items: itemsRes.data ?? [] }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(id)
  if (!order) notFound()

  return (
    <div>
      <AdminHeader
        title={`Porosia ${order.order_number}`}
        subtitle={new Date(order.created_at).toLocaleString('sq-AL')}
        actions={
          <Link href="/admin/orders" className="btn-ghost gap-1.5 text-sm">
            <ArrowLeft size={15} />
            Kthehu
          </Link>
        }
      />

      <div className="admin-page grid lg:grid-cols-3 gap-4">
        {/* Order items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="admin-card p-5">
            <h3 className="font-bold text-text-primary mb-4">Artikujt e Porosisë</h3>
            <div className="space-y-3">
              {order.items.map((item: { id: string; product_image_url: string | null; product_name_sq: string; product_sku: string; quantity: number; unit_price: number; sale_price: number | null; subtotal: number }) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-surface-soft rounded-xl">
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-white border border-surface-border">
                    {item.product_image_url ? (
                      <Image src={item.product_image_url} alt="" fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xl">🧴</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm">{item.product_name_sq}</p>
                    <p className="text-xs text-text-muted font-mono">{item.product_sku}</p>
                  </div>
                  <div className="text-right text-sm flex-shrink-0">
                    <p className="font-bold">{formatPrice(item.subtotal)}</p>
                    <p className="text-text-muted text-xs">{item.quantity} × {formatPrice(item.sale_price ?? item.unit_price)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-surface-border mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Nëntotali</span>
                <span>{formatPrice(order.subtotal + order.discount_amount)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Zbritja</span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Transporti</span>
                <span>{order.shipping_cost === 0 ? 'Falas' : formatPrice(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t border-surface-border">
                <span>TOTAL</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status updater */}
          <div className="admin-card p-5">
            <h3 className="font-bold text-text-primary mb-4">Statusi i Porosisë</h3>
            <div className="mb-3">
              <span className={`badge border ${statusColor(order.status)}`}>
                {statusLabel(order.status, 'sq')}
              </span>
            </div>
            <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
          </div>

          {/* Customer */}
          <div className="admin-card p-5">
            <h3 className="font-bold text-text-primary mb-4">Klienti</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-text-muted">Emri:</span> <span className="font-medium ml-1">{order.customer_name}</span></div>
              <div><span className="text-text-muted">Email:</span> <a href={`mailto:${order.customer_email}`} className="text-brand-600 ml-1">{order.customer_email}</a></div>
              <div><span className="text-text-muted">Tel:</span> <a href={`tel:${order.customer_phone}`} className="text-brand-600 ml-1">{order.customer_phone}</a></div>
              <div><span className="text-text-muted">Tipi:</span> <span className="ml-1 font-medium">{order.customer_type === 'business' ? 'Biznes' : 'Individual'}</span></div>
              {order.business_name && <div><span className="text-text-muted">Biznesi:</span> <span className="ml-1 font-medium">{order.business_name}</span></div>}
              {order.fiscal_number && <div><span className="text-text-muted">Nr. Fiskal:</span> <span className="ml-1 font-mono">{order.fiscal_number}</span></div>}
            </div>
          </div>

          {/* Delivery */}
          <div className="admin-card p-5">
            <h3 className="font-bold text-text-primary mb-4">Dërgimi</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-text-muted">Qyteti:</span> <span className="ml-1 font-medium">{order.city}</span></div>
              <div><span className="text-text-muted">Adresa:</span> <span className="ml-1 font-medium">{order.address}</span></div>
              {order.notes && <div><span className="text-text-muted">Shënime:</span> <span className="ml-1 italic text-text-secondary">{order.notes}</span></div>}
            </div>
          </div>

          {/* Falcon Posta */}
          <div className="admin-card p-5">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-1.5"><Truck size={15} /> Falcon Posta</h3>
            {order.falcon_order_id ? (
              <div className="space-y-2 text-sm">
                <div><span className="text-text-muted">ID:</span> <span className="ml-1 font-mono font-medium">{order.falcon_order_id}</span></div>
                {order.falcon_status_name && (
                  <div><span className="text-text-muted">Statusi:</span> <span className="ml-1 font-medium">{order.falcon_status_name}</span></div>
                )}
              </div>
            ) : (
              <FalconSendButton orderId={order.id} />
            )}
          </div>

          {/* Payment */}
          <div className="admin-card p-5">
            <h3 className="font-bold text-text-primary mb-3">Pagesa</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Metoda:</span>
              <span className="text-sm font-medium">{order.payment_method === 'card' ? '💳 Kartë' : '💵 Kesh'}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-text-muted">Statusi:</span>
              <span className={`badge border text-xs ${statusColor(order.payment_status)}`}>
                {statusLabel(order.payment_status, 'sq')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
