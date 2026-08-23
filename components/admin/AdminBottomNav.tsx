'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Package, ShoppingBag, Users, X, LogOut,
  FolderOpen, Tag, Award, PercentCircle, RefreshCw, Image,
  Settings, LayoutGrid, Mail,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const mainTabs = [
  { href: '/admin',          label: 'Home',      icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Produktet', icon: Package },
  { href: '/admin/orders',   label: 'Porositë',  icon: ShoppingBag },
  { href: '/admin/customers',label: 'Klientët',  icon: Users },
]

const allNav = [
  { href: '/admin',               label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { href: '/admin/products',      label: 'Produktet',  icon: Package },
  { href: '/admin/orders',        label: 'Porositë',   icon: ShoppingBag },
  { href: '/admin/customers',     label: 'Klientët',   icon: Users },
  { href: '/admin/categories',    label: 'Kategoritë', icon: FolderOpen },
  { href: '/admin/brands',        label: 'Brendet',    icon: Award },
  { href: '/admin/campaigns',     label: 'Kampanjat',  icon: Tag },
  { href: '/admin/sales',         label: 'Zbritjet',   icon: PercentCircle },
  { href: '/admin/banners',       label: 'Banerat',    icon: Image },
  { href: '/admin/subscriptions', label: 'Abonimi',    icon: RefreshCw },
  { href: '/admin/newsletter',    label: 'Newsletter', icon: Mail },
  { href: '/admin/settings',      label: 'Cilësimet',  icon: Settings },
]

export function AdminBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      {/* Full-menu drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-slate-950 rounded-t-3xl overflow-hidden">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60">
              <span className="font-black text-white text-base">
                Pro<span className="text-brand-400">Hygiene</span>
                <span className="ml-2 text-slate-500 font-normal text-xs">Admin</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav grid */}
            <div className="grid grid-cols-4 gap-1.5 p-4">
              {allNav.map(({ href, label, icon: Icon, exact }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl text-[11px] font-medium transition-all active:scale-95 ${
                    isActive(href, exact)
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
                  }`}
                >
                  <Icon size={20} strokeWidth={1.8} />
                  <span className="text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>

            {/* Logout */}
            <div className="px-4 pb-8">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all border border-slate-800 active:scale-[0.98]"
              >
                <LogOut size={16} />
                Dil nga sistemi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-md border-t border-slate-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      >
        <div className="flex items-center justify-around px-1 pt-1 pb-1">
          {mainTabs.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all active:scale-95 ${
                  active ? 'text-brand-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={`relative p-1 rounded-xl transition-all ${active ? 'bg-brand-400/15' : ''}`}>
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                </div>
                <span className={`text-[10px] font-medium leading-none ${active ? 'text-brand-400' : ''}`}>
                  {label}
                </span>
              </Link>
            )
          })}

          {/* More / Grid */}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl text-slate-500 transition-all active:scale-95"
          >
            <div className="p-1 rounded-xl">
              <LayoutGrid size={20} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-medium leading-none">Menuja</span>
          </button>
        </div>
      </nav>
    </>
  )
}
