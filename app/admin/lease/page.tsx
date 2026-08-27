import Link from 'next/link'
import { ArrowRight, FileText, MonitorSmartphone, Inbox } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { createClient } from '@/lib/supabase/server'
import { LeaseDashboardClient } from './LeaseDashboardClient'
import type { DeployedDevice, LeaseClient, LeaseContract, LeaseInquiry } from '@/types'

async function getDashboardData() {
  const supabase = await createClient()

  const [
    contractsRes,
    deployedRes,
    clientsRes,
    inquiriesRes,
  ] = await Promise.all([
    supabase.from('lease_contracts').select('*, client:lease_clients(*)'),
    supabase
      .from('deployed_devices')
      .select(`
        *,
        client:lease_clients(*),
        contract:lease_contracts(*),
        product:products(name_sq),
        consumable_levels:device_consumable_levels(*, material:materials(name_sq, unit))
      `)
      .eq('status', 'active'),
    supabase.from('lease_clients').select('*'),
    supabase.from('lease_inquiries').select('*').order('created_at', { ascending: false }).limit(50),
  ])

  return {
    contracts: (contractsRes.data as LeaseContract[]) ?? [],
    deployedDevices: (deployedRes.data as DeployedDevice[]) ?? [],
    clients: (clientsRes.data as LeaseClient[]) ?? [],
    inquiries: (inquiriesRes.data as LeaseInquiry[]) ?? [],
  }
}

export default async function LeaseDashboardPage() {
  const data = await getDashboardData()

  return (
    <div>
      <AdminHeader
        title="Shfrytëzimi"
        subtitle={new Date().toLocaleDateString('sq-AL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        actions={
          <div className="hidden sm:flex flex-wrap gap-2">
            {[
              { href: '/admin/lease/contracts', label: 'Kontratat', icon: FileText },
              { href: '/admin/lease/devices', label: 'Pajisjet', icon: MonitorSmartphone },
              { href: '/admin/lease/inquiries', label: 'Kërkesat', icon: Inbox },
            ].map(action => (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-surface-border text-xs font-semibold text-text-secondary hover:text-brand-700 hover:border-brand-200 hover:bg-brand-50 transition-colors"
              >
                <action.icon size={14} />
                {action.label}
                <ArrowRight size={12} className="opacity-50" />
              </Link>
            ))}
          </div>
        }
      />
      <div className="admin-page">
        <LeaseDashboardClient {...data} />
      </div>
    </div>
  )
}
