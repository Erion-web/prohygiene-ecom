'use client'

import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminBottomNav } from '@/components/admin/AdminBottomNav'
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton'
import { AdminNavProvider, useAdminNav } from '@/components/admin/AdminNavContext'

function AdminChrome({ children }: { children: ReactNode }) {
  const { pending } = useAdminNav()

  return (
    <>
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div id="admin-main" className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {pending ? <AdminPageSkeleton /> : children}
        </div>
      </div>
      <AdminBottomNav />
    </>
  )
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminNavProvider>
      <div className="flex h-screen overflow-hidden bg-surface-soft">
        <AdminChrome>{children}</AdminChrome>
      </div>
    </AdminNavProvider>
  )
}
