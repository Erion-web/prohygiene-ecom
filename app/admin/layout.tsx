import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AdminShell } from '@/components/admin/AdminNav'
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton'
import { requireAdmin } from '@/lib/admin/require-admin'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { authorized } = await requireAdmin()
  if (!authorized) redirect('/auth/login?redirect=/admin')

  return (
    <AdminShell>
      <Suspense fallback={<AdminPageSkeleton />}>
        {children}
      </Suspense>
    </AdminShell>
  )
}
