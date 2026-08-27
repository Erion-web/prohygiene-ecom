import { AdminHeader } from '@/components/admin/AdminHeader'
import { BrandForm } from '../BrandForm'

export default function NewBrandPage() {
  return (
    <div>
      <AdminHeader title="Shto Brend të Ri" subtitle="Krijo një brend të ri për produktet" />
      <div className="admin-page max-w-2xl">
        <BrandForm />
      </div>
    </div>
  )
}
