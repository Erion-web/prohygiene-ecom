'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, FolderOpen, Tag, ShoppingBag,
  Users, Settings, LogOut, ChevronLeft, Menu, Award, PercentCircle, RefreshCw, Image
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin',            label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { href: '/admin/products',   label: 'Produktet',  icon: Package },
  { href: '/admin/categories', label: 'Kategoritë', icon: FolderOpen },
  { href: '/admin/brands',     label: 'Brendet',    icon: Award },
  { href: '/admin/sales',      label: 'Zbritjet',   icon: PercentCircle },
  { href: '/admin/campaigns',  label: 'Kampanjat',  icon: Tag },
  { href: '/admin/banners',    label: 'Banerat',    icon: Image },
  { href: '/admin/orders',     label: 'Porositë',   icon: ShoppingBag },
  { href: '/admin/customers',  label: 'Klientët',   icon: Users },
  { href: '/admin/subscriptions', label: 'Abonimi', icon: RefreshCw },
  { href: '/admin/settings',   label: 'Cilësimet',  icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
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
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        {!collapsed && (
          <Link href="/" className="font-black text-lg tracking-tight">
            Pro<span className="text-brand-400">Hygiene</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 ml-auto"
        >
          {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1 px-2">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive(href, exact)
                  ? 'bg-brand-600 text-white shadow-brand-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-800 p-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 w-full"
          title={collapsed ? 'Dil' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Dil</span>}
        </button>
      </div>
    </aside>
  )
}
