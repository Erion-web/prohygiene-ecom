import { LeaseSubNav } from '@/components/admin/LeaseSubNav'

export default function LeaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="px-6 pt-6">
        <LeaseSubNav />
      </div>
      {children}
    </div>
  )
}
