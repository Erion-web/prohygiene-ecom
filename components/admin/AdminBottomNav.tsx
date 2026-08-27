'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Package, ShoppingBag, Users, X, LogOut,
  FolderOpen, Tag, Award, PercentCircle, RefreshCw, Image,
  Settings, LayoutGrid, Mail, Handshake,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isNavActive, shouldStartNav, useAdminNav } from '@/components/admin/AdminNavContext'

const mainTabs = [
  { href: '/admin',          label: 'Home',      icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Produktet', icon: Package },
  { href: '/admin/orders',   label: 'Porositë',  icon: ShoppingBag },
  { href: '/admin/lease',    label: 'Shfrytëzim', icon: Handshake },
]

const allNav = [
  { href: '/admin',               label: 'Dashboard',   icon: LayoutDashboard, exact: true },
  { href: '/admin/products',      label: 'Produktet',   icon: Package },
  { href: '/admin/orders',        label: 'Porositë',    icon: ShoppingBag },
  { href: '/admin/customers',     label: 'Klientët',    icon: Users },
  { href: '/admin/lease',         label: 'Dashboard',   icon: Handshake },
  { href: '/admin/lease/inquiries', label: 'Kërkesat',  icon: Handshake },
  { href: '/admin/lease/contracts', label: 'Kontrata',  icon: Handshake },
  { href: '/admin/lease/devices', label: 'Pajisjet',    icon: Package },
  { href: '/admin/categories',    label: 'Kategoritë',  icon: FolderOpen },
  { href: '/admin/brands',        label: 'Brendet',     icon: Award },
  { href: '/admin/campaigns',     label: 'Kampanjat',   icon: Tag },
  { href: '/admin/sales',         label: 'Zbritjet',    icon: PercentCircle },
  { href: '/admin/banners',       label: 'Banerat',     icon: Image },
  { href: '/admin/subscriptions', label: 'Abonimi',     icon: RefreshCw },
  { href: '/admin/newsletter',    label: 'Newsletter',  icon: Mail },
  { href: '/admin/settings',      label: 'Cilësimet',   icon: Settings },
]

export function AdminBottomNav() {
  const { displayPath, startNav } = useAdminNav()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const isActive = (href: string, exact = false) => isNavActive(displayPath, href, exact)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl overflow-hidden border-t border-surface-border">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-surface-border rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-surface-border">
              <span className="font-bold text-text-primary text-base">
                Pro<span className="text-brand-600">Hygiene</span>
                <span className="ml-2 text-text-muted font-normal text-xs">Admin</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 p-3 max-h-[60vh] overflow-y-auto">
              {allNav.map(({ href, label, icon: Icon, exact }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={(e) => {
                    if (shouldStartNav(e, href, displayPath)) startNav(href)
                    setOpen(false)
                  }}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-2xl text-[11px] font-medium transition-all active:scale-95 ${
                    isActive(href, exact)
                      ? 'bg-brand-600 text-white'
                      : 'text-text-secondary hover:text-text-primary bg-surface-soft hover:bg-surface-muted'
                  }`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span className="text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>
            <div className="px-4 pb-8">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-text-muted hover:text-red-600 hover:bg-red-50 transition-all border border-surface-border active:scale-[0.98]"
              >
                <LogOut size={16} />
                Dil nga sistemi
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-surface-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      >
        <div className="flex items-center justify-around px-1 pt-1 pb-1">
          {mainTabs.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                onClick={(e) => {
                  if (shouldStartNav(e, href, displayPath)) startNav(href)
                }}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all active:scale-95 ${
                  active ? 'text-brand-600' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <div className={`relative p-1 rounded-xl transition-all ${active ? 'bg-brand-50' : ''}`}>
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                </div>
                <span className={`text-[10px] font-medium leading-none ${active ? 'text-brand-600' : ''}`}>
                  {label}
                </span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl text-text-muted transition-all active:scale-95"
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
