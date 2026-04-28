import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import Link from 'next/link'
import {
  ShoppingBag, Package, TrendingUp, AlertTriangle,
  Tag, Clock, ArrowRight, CheckCircle2, Truck
} from 'lucide-react'
import { formatPrice, statusColor, statusLabel } from '@/lib/utils'

async function getDashboardData() {
  const supabase = await createClient()

  const now = new Date().toISOString()

  const [
    ordersRes,
    pendingOrdersRes,
    productsRes,
    lowStockRes,
    campaignsRes,
    revenueRes,
  ] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock', 10).gt('stock', 0),
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('is_active', true).lte('starts_at', now).gte('ends_at', now),
    supabase.from('orders').select('total').in('payment_status', ['approved']),
  ])

  const revenue = (revenueRes.data ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0)

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)

  return {
    totalOrders: ordersRes.count ?? 0,
    pendingOrders: pendingOrdersRes.count ?? 0,
    totalProducts: productsRes.count ?? 0,
    lowStockCount: lowStockRes.count ?? 0,
    activeCampaigns: campaignsRes.count ?? 0,
    revenue,
    recentOrders: recentOrders ?? [],
  }
}

export default async function AdminDashboard() {
  const {
    totalOrders, pendingOrders, totalProducts, lowStockCount,
    activeCampaigns, revenue, recentOrders,
  } = await getDashboardData()

  const stats = [
    { label: 'Të Ardhura Totale', value: formatPrice(revenue), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', change: '+12%' },
    { label: 'Porosi Totale', value: totalOrders, icon: ShoppingBag, color: 'text-brand-600', bg: 'bg-brand-50', change: '+8%' },
    { label: 'Porosi Pritje', value: pendingOrders, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', href: '/admin/orders?status=pending' },
    { label: 'Gjendje e Ulët', value: lowStockCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', href: '/admin/products?low_stock=true' },
    { label: 'Produkte Aktive', value: totalProducts, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Kampanja Aktive', value: activeCampaigns, icon: Tag, color: 'text-pink-600', bg: 'bg-pink-50', href: '/admin/campaigns' },
  ]

  const quickActions = [
    { href: '/admin/products/new', label: 'Shto Produkt', icon: Package, desc: 'Krijo produkt të ri' },
    { href: '/admin/orders', label: 'Porositë', icon: ShoppingBag, desc: 'Menaxho porositë' },
    { href: '/admin/campaigns', label: 'Kampanja e Re', icon: Tag, desc: 'Krijo ofertë' },
  ]

  return (
    <div>
      <AdminHeader
        title="Paneli Kryesor"
        subtitle={`${new Date().toLocaleDateString('sq-AL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className={stat.href ? 'cursor-pointer' : undefined}>
              {stat.href ? (
                <Link href={stat.href} className="admin-card block hover:shadow-card transition-shadow">
                  <StatCard {...stat} />
                </Link>
              ) : (
                <div className="admin-card">
                  <StatCard {...stat} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 admin-card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-text-primary">Porositë e Fundit</h2>
              <Link href="/admin/orders" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                Shiko të gjitha <ArrowRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full admin-table">
                <thead>
                  <tr className="bg-surface-soft">
                    <th className="text-left">Porosia</th>
                    <th className="text-left">Klienti</th>
                    <th className="text-left">Totali</th>
                    <th className="text-left">Statusi</th>
                    <th className="text-left">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id}>
                      <td>
                        <Link href={`/admin/orders/${order.id}`} className="font-mono text-brand-600 hover:text-brand-700 font-semibold text-xs">
                          {order.order_number}
                        </Link>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-text-primary">{order.customer_name}</p>
                          <p className="text-text-muted text-xs">{order.customer_phone}</p>
                        </div>
                      </td>
                      <td className="font-semibold">{formatPrice(order.total)}</td>
                      <td>
                        <span className={`badge border text-xs ${statusColor(order.status)}`}>
                          {statusLabel(order.status, 'sq')}
                        </span>
                      </td>
                      <td className="text-text-muted text-xs">
                        {new Date(order.created_at).toLocaleDateString('sq-AL')}
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-text-muted py-8">
                        Nuk ka porosi ende
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="admin-card">
              <h2 className="font-bold text-text-primary mb-4">Veprime të Shpejta</h2>
              <div className="space-y-2">
                {quickActions.map(action => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-soft transition-colors duration-150 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                      <action.icon size={16} className="text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{action.label}</p>
                      <p className="text-xs text-text-muted">{action.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Order status breakdown */}
            <div className="admin-card">
              <h2 className="font-bold text-text-primary mb-4">Statuset e Porosive</h2>
              <div className="space-y-2.5">
                {[
                  { status: 'pending', icon: Clock },
                  { status: 'confirmed', icon: CheckCircle2 },
                  { status: 'shipped', icon: Truck },
                ].map(({ status, icon: Icon }) => (
                  <Link
                    key={status}
                    href={`/admin/orders?status=${status}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-sm ${statusColor(status)} hover:opacity-80 transition-opacity`}
                  >
                    <Icon size={14} />
                    <span className="font-medium">{statusLabel(status, 'sq')}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, bg, change }: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  bg: string
  change?: string
  href?: string
}) {
  return (
    <>
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <Icon size={20} className={color} />
      </div>
      <p className="text-2xl font-black text-text-primary mb-0.5">{value}</p>
      <p className="text-xs text-text-muted font-medium">{label}</p>
      {change && <p className="text-xs text-emerald-600 font-semibold mt-1">{change} ↑</p>}
    </>
  )
}
