import { Suspense } from 'react'
import { AdminShell } from '@/components/admin/AdminNav'
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminShell>
      <Suspense fallback={<AdminPageSkeleton />}>
        {children}
      </Suspense>
    </AdminShell>
  )
}
