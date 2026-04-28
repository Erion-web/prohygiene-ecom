'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Search, User, Menu, X, ChevronDown, LogOut, Settings } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { Logo } from '@/components/ui/Logo'
import { SearchModal } from '@/components/store/SearchModal'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'

interface NavbarProps {
  categories?: Category[]
}

export function Navbar({ categories = [] }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const pathname = usePathname()
  const { lang } = useLanguageStore()
  const { getItemCount } = useCartStore()
  const tr = t(lang)
  const itemCount = getItemCount()
  const catRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setCatOpen(false)
  }, [pathname])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = (user.user_metadata?.full_name as string | undefined) ?? user.email?.split('@')[0] ?? null
        setUserName(name)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const name = (session.user.user_metadata?.full_name as string | undefined) ?? session.user.email?.split('@')[0] ?? null
        setUserName(name)
      } else {
        setUserName(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const navLinks = [
    { href: '/shop',          label: tr.nav.shop },
    { href: '/home-products', label: lang === 'sq' ? 'Shtëpi' : 'Home' },
    { href: '/business',      label: lang === 'sq' ? 'Biznese' : 'Business' },
  ]

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href + '/'))

  return (
    <>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <header className={cn(
        'sticky top-0 z-50 bg-white transition-shadow duration-300',
        scrolled ? 'shadow-soft border-b border-surface-border' : 'border-b border-surface-border/60'
      )}>
        <div className="container-custom">

          {/* ─── DESKTOP: 3-column grid keeps logo perfectly centered ─── */}
          <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center h-16">

            {/* LEFT — nav links */}
            <nav className="flex items-center gap-0.5">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap',
                    isActive(link.href)
                      ? 'text-brand-600 bg-brand-50'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {/* Categories dropdown */}
              <div className="relative" ref={catRef}>
                <button
                  onClick={() => setCatOpen(v => !v)}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-all duration-200"
                >
                  {tr.nav.categories}
                  <ChevronDown size={13} strokeWidth={2.5} className={cn('transition-transform duration-200', catOpen && 'rotate-180')} />
                </button>

                {catOpen && (
                  <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-2xl border border-surface-border shadow-elevated py-2 animate-slide-down">
                    <Link href="/shop" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-brand-600 hover:bg-brand-50 transition-colors">
                      <span className="text-base">🛒</span>
                      {lang === 'sq' ? 'Të Gjitha Produktet' : 'All Products'}
                    </Link>
                    <div className="h-px bg-surface-border mx-4 my-1" />
                    {categories.map(cat => (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${cat.slug}`}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-300 flex-shrink-0" />
                        {lang === 'sq' ? cat.name_sq : cat.name_en}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* CENTER — logo */}
            <Link href="/" className="flex justify-center px-6">
              <Logo size="md" />
            </Link>

            {/* RIGHT — actions */}
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label={tr.nav.search}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-all duration-200"
              >
                <Search size={17} strokeWidth={2.2} />
                <span className="hidden xl:inline text-text-muted text-sm font-normal">
                  {tr.nav.search}
                </span>
              </button>

              <LanguageSwitcher />

              <Link
                href="/cart"
                aria-label={tr.nav.cart}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-all duration-200"
              >
                <ShoppingCart size={18} strokeWidth={2} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {userName ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-all duration-200"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden xl:inline max-w-[100px] truncate">{userName.split(' ')[0]}</span>
                    <ChevronDown size={12} strokeWidth={2.5} className={cn('transition-transform duration-200', userMenuOpen && 'rotate-180')} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl border border-surface-border shadow-elevated py-2 animate-slide-down z-50">
                      <div className="px-4 py-2 border-b border-surface-border mb-1">
                        <p className="text-xs font-bold text-text-primary truncate">{userName}</p>
                      </div>
                      <Link href="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-brand-600 hover:bg-brand-50 transition-colors">
                        <User size={14} /> {tr.nav.myAccount}
                      </Link>
                      <Link href="/account/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-brand-600 hover:bg-brand-50 transition-colors">
                        <Settings size={14} /> {tr.nav.orders}
                      </Link>
                      <div className="h-px bg-surface-border mx-4 my-1" />
                      <form action="/auth/signout" method="post">
                        <button type="submit" className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut size={14} /> {tr.nav.logout}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  aria-label={tr.nav.account}
                  className="flex items-center justify-center w-9 h-9 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-all duration-200"
                >
                  <User size={17} strokeWidth={2} />
                </Link>
              )}
            </div>
          </div>

          {/* ─── MOBILE: hamburger | logo(center) | search+cart ─── */}
          <div className="flex lg:hidden items-center h-14 gap-2">
            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Menu"
              className="flex items-center justify-center w-9 h-9 rounded-xl text-text-secondary hover:bg-surface-muted transition-all duration-200 flex-shrink-0"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="flex-1 flex justify-center">
              <Link href="/">
                <Logo size="sm" />
              </Link>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="flex items-center justify-center w-9 h-9 rounded-xl text-text-secondary hover:bg-surface-muted transition-all duration-200"
              >
                <Search size={17} strokeWidth={2.2} />
              </button>

              <Link
                href="/cart"
                className="relative flex items-center justify-center w-9 h-9 rounded-xl text-text-secondary hover:bg-surface-muted transition-all duration-200"
              >
                <ShoppingCart size={18} strokeWidth={2} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* ─── MOBILE MENU DRAWER ─── */}
        <div className={cn(
          'lg:hidden fixed inset-0 z-40 bg-white pt-14 overflow-y-auto',
          'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none -translate-y-2'
        )}>
          <div className="container-custom py-4 space-y-1">
            <button
              onClick={() => { setMobileOpen(false); setSearchOpen(true) }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-soft border border-surface-border text-text-muted text-sm mb-3"
            >
              <Search size={15} />
              {tr.nav.search}
            </button>

            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                  isActive(link.href) ? 'text-brand-600 bg-brand-50' : 'text-text-primary hover:bg-surface-muted'
                )}
              >
                {link.label}
              </Link>
            ))}

            {categories.length > 0 && (
              <div className="pt-3">
                <p className="px-4 text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2">
                  {tr.nav.categories}
                </p>
                {categories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-300" />
                    {lang === 'sq' ? cat.name_sq : cat.name_en}
                  </Link>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-surface-border flex items-center justify-between px-4 py-3">
              {userName ? (
                <Link
                  href="/account"
                  className="flex items-center gap-2 text-sm font-semibold text-text-primary"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  {userName.split(' ')[0]}
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 text-sm font-semibold text-text-primary"
                >
                  <User size={16} /> {tr.nav.account}
                </Link>
              )}
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
