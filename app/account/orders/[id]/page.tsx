import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Package, MapPin, CreditCard, Truck } from 'lucide-react'
import { formatPrice, statusColor, statusLabel } from '@/lib/utils'
import { orderStatusMessage } from '@/lib/orders/status'

const PAYMENT_LABELS: Record<string, string> = {
  card:             'Kartë',
  cash_on_delivery: 'Para në Dorëzim',
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getAuthUser()
  if (!user) redirect('/auth/login?redirect=/account/orders')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()

  const items = order.items ?? []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/account/orders" className="p-2 rounded-xl hover:bg-surface-muted transition-colors text-text-muted hover:text-text-primary">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-text-primary">Porosia {order.order_number}</h1>
          <p className="text-xs text-text-muted mt-0.5">
            {new Date(order.created_at).toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Status banner */}
      <div className={`card p-4 flex items-center gap-3 border ${statusColor(order.status)}`}>
        <Truck size={18} className="flex-shrink-0" />
        <div>
          <p className="font-bold text-sm">{statusLabel(order.status, 'sq')}</p>
          <p className="text-xs opacity-80">{orderStatusMessage(order.status)}</p>
        </div>
      </div>

      {/* Products */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-3.5 border-b border-surface-border flex items-center gap-2">
          <Package size={15} className="text-brand-500" />
          <h2 className="font-bold text-text-primary text-sm">Produktet e Porosisë</h2>
          <span className="text-xs text-text-muted ml-auto">{items.length} artikuj</span>
        </div>

        <div className="divide-y divide-surface-border/60">
          {items.map((item: any) => {
            const price = item.sale_price ?? item.unit_price
            return (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                {/* Image */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-soft relative flex-shrink-0 border border-surface-border">
                  {item.product_image_url ? (
                    <Image
                      src={item.product_image_url}
                      alt={item.product_name_sq}
                      fill
                      className="object-contain p-1"
                      sizes="56px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package size={18} className="text-text-muted opacity-30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary text-sm leading-snug truncate">{item.product_name_sq}</p>
                  <p className="text-xs text-text-muted font-mono mt-0.5">{item.product_sku}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    {formatPrice(price)} × {item.quantity}
                  </p>
                </div>

                {/* Subtotal */}
                <p className="font-bold text-text-primary flex-shrink-0">
                  {formatPrice(price * item.quantity)}
                </p>
              </div>
            )
          })}
        </div>

        {/* Totals */}
        <div className="px-5 py-4 bg-surface-soft border-t border-surface-border space-y-2">
          {[
            { label: 'Nëntotali',   value: order.subtotal },
            order.discount_amount > 0 && { label: 'Zbritja', value: -order.discount_amount },
            { label: 'Transporti',  value: order.shipping_cost },
            { label: 'TVSH (18%)', value: order.vat_amount },
          ].filter(Boolean).map((row: any) => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-text-secondary">{row.label}</span>
              <span className={`font-semibold ${row.value < 0 ? 'text-emerald-600' : 'text-text-primary'}`}>
                {row.value < 0 ? '-' : ''}{formatPrice(Math.abs(row.value))}
              </span>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t border-surface-border">
            <span className="font-bold text-text-primary">Totali</span>
            <span className="font-extrabold text-text-primary text-base">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery & Payment info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-bold text-text-primary text-sm flex items-center gap-2 mb-3">
            <MapPin size={14} className="text-brand-500" /> Adresa e Dorëzimit
          </h3>
          <p className="font-semibold text-text-primary text-sm">{order.customer_name}</p>
          <p className="text-sm text-text-secondary">{order.address}</p>
          <p className="text-sm text-text-secondary">{order.city}</p>
          <p className="text-sm text-text-secondary">{order.customer_phone}</p>
          {order.customer_type === 'business' && order.business_name && (
            <p className="text-xs text-brand-600 font-medium mt-1">{order.business_name}</p>
          )}
          {order.notes && (
            <p className="text-xs text-text-muted mt-2 italic">"{order.notes}"</p>
          )}
        </div>

        <div className="card p-4">
          <h3 className="font-bold text-text-primary text-sm flex items-center gap-2 mb-3">
            <CreditCard size={14} className="text-brand-500" /> Pagesa
          </h3>
          <p className="text-sm text-text-secondary">
            {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
          </p>
          <div className={`inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor(order.payment_status)}`}>
            {statusLabel(order.payment_status, 'sq')}
          </div>
        </div>
      </div>
    </div>
  )
}
