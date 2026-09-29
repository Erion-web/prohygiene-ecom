import { AdminHeader } from '@/components/admin/AdminHeader'
import { CompetitorForm } from '../CompetitorForm'

export default function NewCompetitorPage() {
  return (
    <div>
      <AdminHeader title="Shto konkurrent" subtitle="Katalogu publik që do të skrapohet" />
      <div className="admin-page max-w-2xl">
        <CompetitorForm />
      </div>
    </div>
  )
}
