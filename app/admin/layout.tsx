import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminBottomNav } from '@/components/admin/AdminBottomNav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
