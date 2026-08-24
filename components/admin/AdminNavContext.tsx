'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'

type AdminNavContextValue = {
  displayPath: string
  pending: boolean
  startNav: (href: string) => void
}

const AdminNavContext = createContext<AdminNavContextValue>({
  displayPath: '/admin',
  pending: false,
  startNav: () => {},
})

export function useAdminNav() {
  return useContext(AdminNavContext)
}

export function isNavActive(pathname: string, href: string, exact = false) {
  return exact ? pathname === href : pathname.startsWith(href)
}

export function shouldStartNav(e: MouseEvent, href: string, current: string) {
  if (e.defaultPrevented) return false
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return false
  return href !== current
}

export function AdminNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  useEffect(() => {
    if (!pendingHref) return
    const id = window.setTimeout(() => setPendingHref(null), 10000)
    return () => window.clearTimeout(id)
  }, [pendingHref])

  const startNav = useCallback((href: string) => {
    if (href === pathname) return
    setPendingHref(href)
  }, [pathname])

  return (
    <AdminNavContext.Provider
      value={{
        displayPath: pendingHref ?? pathname,
        pending: pendingHref !== null && pendingHref !== pathname,
        startNav,
      }}
    >
      {children}
    </AdminNavContext.Provider>
  )
}
