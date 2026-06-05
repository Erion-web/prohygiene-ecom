import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminBottomNav } from '@/components/admin/AdminBottomNav'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function isAdminRole(role: unknown): boolean {
  return typeof role === 'string' && ['admin', 'manager'].includes(role)
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/admin')

  // Primary check: app_metadata role (embedded in JWT, set via SQL below)
  // This works even if the profiles table doesn't exist yet.
  const jwtRole = (user.app_metadata as Record<string, unknown>)?.role
  if (isAdminRole(jwtRole)) {
    return (
      <div className="flex h-screen overflow-hidden bg-surface-soft">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div id="admin-main" className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</div>
        </div>
        <AdminBottomNav />
      </div>
    )
  }

  // Fallback: profiles table check (for compatibility if profiles table exists)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !isAdminRole(profile.role)) {
    redirect('/')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-soft">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div id="admin-main" className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
