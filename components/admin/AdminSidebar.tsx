'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, FolderOpen, Tag, ShoppingBag,
  Users, Settings, LogOut, ChevronLeft, Menu, Award, PercentCircle,
  RefreshCw, Image, Mail, Handshake, ChevronDown,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const leaseChildren = [
  { href: '/admin/lease', label: 'Dashboard', exact: true },
  { href: '/admin/lease/inquiries', label: 'Kërkesat' },
  { href: '/admin/lease/clients', label: 'Klientët' },
  { href: '/admin/lease/contracts', label: 'Kontratat' },
  { href: '/admin/lease/devices', label: 'Pajisjet' },
  { href: '/admin/lease/categories', label: 'Kategoritë' },
  { href: '/admin/lease/materials', label: 'Lëndët' },
]

const navItems: Array<{
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact?: boolean
  children?: typeof leaseChildren
}> = [
  { href: '/admin',            label: 'Dashboard',   icon: LayoutDashboard, exact: true },
  { href: '/admin/products',   label: 'Produktet',   icon: Package },
  { href: '/admin/categories', label: 'Kategoritë',  icon: FolderOpen },
  { href: '/admin/brands',     label: 'Brendet',     icon: Award },
  { href: '/admin/sales',      label: 'Zbritjet',    icon: PercentCircle },
  { href: '/admin/campaigns',  label: 'Kampanjat',   icon: Tag },
  { href: '/admin/banners',    label: 'Banerat',     icon: Image },
  { href: '/admin/orders',     label: 'Porositë',    icon: ShoppingBag },
  { href: '/admin/customers',  label: 'Klientët',    icon: Users },
  { href: '/admin/lease',      label: 'Shfrytëzimi', icon: Handshake, children: leaseChildren },
  { href: '/admin/subscriptions', label: 'Abonimi',  icon: RefreshCw },
  { href: '/admin/newsletter', label: 'Newsletter',  icon: Mail },
  { href: '/admin/settings',   label: 'Cilësimet',   icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [leaseOpen, setLeaseOpen] = useState(() => pathname.startsWith('/admin/lease'))
  const router = useRouter()

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className={cn(
      'hidden md:flex flex-col bg-slate-950 text-white transition-all duration-300 flex-shrink-0',
      collapsed ? 'w-14' : 'w-52'
    )}>
      <div className="flex items-center justify-between h-12 px-3 border-b border-slate-800">
        {!collapsed && (
          <Link href="/" className="font-black text-[15px] tracking-tight">
            Pro<span className="text-brand-400">Hygiene</span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
        >
          {collapsed ? <Menu size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        <div className="space-y-0.5 px-1.5">
          {navItems.map(({ href, label, icon: Icon, exact, children }) => {
            if (children) {
              const groupActive = pathname.startsWith(href)
              return (
                <div key={href}>
                  <button
                    type="button"
                    onClick={() => {
                      if (collapsed) {
                        router.push(href)
                        return
                      }
                      setLeaseOpen(v => !v)
                    }}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors w-full',
                      groupActive
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{label}</span>
                        <ChevronDown size={13} className={cn('transition-transform', leaseOpen && 'rotate-180')} />
                      </>
                    )}
                  </button>
                  {!collapsed && leaseOpen && (
                    <div className="mt-0.5 ml-3 pl-2 border-l border-slate-800 space-y-0.5">
                      {children.map(child => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'block px-2 py-1 rounded-md text-[12px] font-medium transition-colors',
                            isActive(child.href, child.exact)
                              ? 'text-white bg-slate-800'
                              : 'text-slate-500 hover:text-white hover:bg-slate-800/70'
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors',
                  isActive(href, exact)
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-slate-800 p-1.5">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors w-full"
          title={collapsed ? 'Dil' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Dil</span>}
        </button>
      </div>
    </aside>
  )
}
