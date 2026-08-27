import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminKpiCard } from '@/components/admin/AdminKpiCard'
import { AdminQuickActions } from '@/components/admin/AdminQuickActions'
import { OrdersBarChart } from '@/components/admin/charts/OrdersBarChart'
import { OrderStatusDonut } from '@/components/admin/charts/OrderStatusDonut'
import Link from 'next/link'
import { ShoppingBag, TrendingUp, Users, Package } from 'lucide-react'
import { DashboardRecentOrders } from '@/components/admin/DashboardRecentOrders'
import { formatPrice, statusLabel } from '@/lib/utils'

const MONTH_LABELS = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj']
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#0e95bd',
  processing: '#6366f1',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
}

function pctChange(current: number, previous: number): string | null {
  if (previous === 0) return current > 0 ? '+100%' : null
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(0)}%`
}

async function getDashboardData() {
  const supabase = await createClient()
  const now = new Date()
  const nowIso = now.toISOString()

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

  const [
    ordersRes,
    pendingOrdersRes,
    productsRes,
    customersRes,
    revenueRes,
    currentMonthOrdersRes,
    prevMonthOrdersRes,
    currentMonthRevenueRes,
    prevMonthRevenueRes,
    chartOrdersRes,
    statusOrdersRes,
    recentOrdersRes,
  ] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('total').in('payment_status', ['approved']),
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
    supabase.from('orders').select('total').in('payment_status', ['approved']).gte('created_at', monthStart),
    supabase.from('orders').select('total').in('payment_status', ['approved']).gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
    supabase.from('orders').select('total, created_at, payment_status').gte('created_at', sixMonthsAgo),
    supabase.from('orders').select('status'),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(8),
  ])

  const revenue = (revenueRes.data ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0)
  const currentMonthRevenue = (currentMonthRevenueRes.data ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0)
  const prevMonthRevenue = (prevMonthRevenueRes.data ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0)

  const monthlyMap = new Map<string, { revenue: number; orders: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, { revenue: 0, orders: 0 })
  }

  for (const order of chartOrdersRes.data ?? []) {
    const d = new Date(order.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyMap.has(key)) continue
    const entry = monthlyMap.get(key)!
    entry.orders += 1
    if (order.payment_status === 'approved') {
      entry.revenue += order.total ?? 0
    }
  }

  const chartData = Array.from(monthlyMap.entries()).map(([key, val]) => {
    const month = parseInt(key.split('-')[1], 10) - 1
    return { month: MONTH_LABELS[month], ...val }
  })

  const statusCounts = new Map<string, number>()
  for (const row of statusOrdersRes.data ?? []) {
    statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1)
  }

  const statusData = Array.from(statusCounts.entries())
    .map(([status, count]) => ({
      status,
      label: statusLabel(status, 'sq'),
      count,
      color: STATUS_COLORS[status] ?? '#94a3b8',
    }))
    .sort((a, b) => b.count - a.count)

  return {
    totalOrders: ordersRes.count ?? 0,
    pendingOrders: pendingOrdersRes.count ?? 0,
    totalProducts: productsRes.count ?? 0,
    totalCustomers: customersRes.count ?? 0,
    revenue,
    revenueChange: pctChange(currentMonthRevenue, prevMonthRevenue),
    ordersChange: pctChange(currentMonthOrdersRes.count ?? 0, prevMonthOrdersRes.count ?? 0),
    chartData,
    statusData,
    recentOrders: recentOrdersRes.data ?? [],
  }
}

export default async function AdminDashboard() {
  const {
    totalOrders, pendingOrders, totalProducts, totalCustomers,
    revenue, revenueChange, ordersChange,
    chartData, statusData, recentOrders,
  } = await getDashboardData()

  return (
    <div>
      <AdminHeader
        title="Paneli Kryesor"
        subtitle={new Date().toLocaleDateString('sq-AL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        actions={<AdminQuickActions />}
      />

      <div className="admin-page">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminKpiCard
            label="Të Ardhura Totale"
            value={formatPrice(revenue)}
            icon={TrendingUp}
            change={revenueChange ? `${revenueChange} krahasuar me muajin e kaluar` : undefined}
            changePositive={revenueChange ? !revenueChange.startsWith('-') : undefined}
            highlight
          />
          <AdminKpiCard
            label="Porosi Totale"
            value={totalOrders}
            icon={ShoppingBag}
            change={ordersChange ? `${ordersChange} krahasuar me muajin e kaluar` : undefined}
            changePositive={ordersChange ? !ordersChange.startsWith('-') : undefined}
            href="/admin/orders"
          />
          <AdminKpiCard
            label="Klientë"
            value={totalCustomers}
            icon={Users}
            href="/admin/customers"
          />
          <AdminKpiCard
            label="Produkte Aktive"
            value={totalProducts}
            icon={Package}
            href="/admin/products"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 admin-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="admin-card-title">Statistikat e Porosive</h2>
              <span className="text-xs text-text-muted">6 muajt e fundit</span>
            </div>
            <OrdersBarChart data={chartData} />
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title mb-2">Statuset e Porosive</h2>
            <OrderStatusDonut data={statusData} />
            <div className="mt-3 space-y-1.5">
              {statusData.slice(0, 5).map(s => (
                <Link
                  key={s.status}
                  href={`/admin/orders?status=${s.status}`}
                  className="flex items-center justify-between text-xs py-1 hover:opacity-80"
                >
                  <span className="flex items-center gap-2 text-text-secondary">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </span>
                  <span className="font-semibold text-text-primary">{s.count}</span>
                </Link>
              ))}
            </div>
            {pendingOrders > 0 && (
              <Link
                href="/admin/orders?status=pending"
                className="mt-3 block text-center text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                {pendingOrders} porosi në pritje
              </Link>
            )}
          </div>
        </div>

        <DashboardRecentOrders orders={recentOrders} />
      </div>
    </div>
  )
}
