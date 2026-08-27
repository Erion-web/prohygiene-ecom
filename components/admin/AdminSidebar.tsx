'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, FolderOpen, Tag, ShoppingBag,
  Users, Settings, LogOut, ChevronLeft, Menu, Award, PercentCircle,
  RefreshCw, Image, Mail, Handshake, ChevronDown,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { isNavActive, shouldStartNav, useAdminNav } from '@/components/admin/AdminNavContext'

const leaseChildren = [
  { href: '/admin/lease', label: 'Dashboard', exact: true },
  { href: '/admin/lease/inquiries', label: 'Kërkesat' },
  { href: '/admin/lease/contracts', label: 'Kontratat' },
  { href: '/admin/lease/devices', label: 'Pajisjet' },
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
  const { displayPath, startNav } = useAdminNav()
  const [collapsed, setCollapsed] = useState(false)
  const [leaseOpen, setLeaseOpen] = useState(() => pathname.startsWith('/admin/lease'))
  const router = useRouter()

  const isActive = (href: string, exact = false) => isNavActive(displayPath, href, exact)

  useEffect(() => {
    for (const item of navItems) {
      router.prefetch(item.href)
      item.children?.forEach(child => router.prefetch(child.href))
    }
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className={cn(
      'hidden md:flex flex-col bg-white border-r border-surface-border transition-all duration-300 flex-shrink-0',
      collapsed ? 'w-[4.5rem]' : 'w-52'
    )}>
      <div className="flex items-center justify-between h-14 px-4 border-b border-surface-border">
        {!collapsed && (
          <Link href="/" className="font-bold text-[15px] tracking-tight text-text-primary">
            Pro<span className="text-brand-600">Hygiene</span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors ml-auto"
        >
          {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="space-y-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon, exact, children }) => {
            if (children) {
              const groupActive = isNavActive(displayPath, href)
              return (
                <div key={href}>
                  <button
                    type="button"
                    onClick={() => {
                      if (collapsed) {
                        startNav(href)
                        router.push(href)
                        return
                      }
                      setLeaseOpen(v => !v)
                    }}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors w-full',
                      groupActive
                        ? 'bg-brand-600 text-white shadow-brand-sm'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-soft'
                    )}
                  >
                    <Icon size={17} className="flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{label}</span>
                        <ChevronDown size={14} className={cn('transition-transform opacity-70', leaseOpen && 'rotate-180')} />
                      </>
                    )}
                  </button>
                  {!collapsed && leaseOpen && (
                    <div className="mt-1 ml-3 pl-3 border-l border-surface-border space-y-0.5">
                      {!collapsed && (
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                          Shfrytëzimi
                        </p>
                      )}
                      {children.map(child => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={(e) => {
                            if (shouldStartNav(e, child.href, displayPath)) startNav(child.href)
                          }}
                          className={cn(
                            'block px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
                            isActive(child.href, child.exact)
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'
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
                onClick={(e) => {
                  if (shouldStartNav(e, href, displayPath)) startNav(href)
                }}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors',
                  isActive(href, exact)
                    ? 'bg-brand-600 text-white shadow-brand-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-soft'
                )}
              >
                <Icon size={17} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-surface-border p-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors w-full"
          title={collapsed ? 'Dil' : undefined}
        >
          <LogOut size={17} className="flex-shrink-0" />
          {!collapsed && <span>Dil</span>}
        </button>
      </div>
    </aside>
  )
}
