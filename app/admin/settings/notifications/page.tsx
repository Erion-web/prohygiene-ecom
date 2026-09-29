import { AdminHeader } from '@/components/admin/AdminHeader'
import { Bell } from 'lucide-react'
import { StaticSettingsSection } from '../StaticSettingsSection'

export default function SettingsNotificationsPage() {
  return (
    <>
      <AdminHeader title="Cilësimet" subtitle="Njoftimet" />
      <StaticSettingsSection
        icon={Bell}
        title="Njoftime"
        desc="Konfigurimet e njoftimeve me email"
        items={[
          { label: 'Email njoftimesh', value: 'info@prohygiene.shop' },
          { label: 'Njoftim porosi të reja', value: 'Aktivuar' },
          { label: 'Njoftim gjendje të ulët', value: 'Aktivuar' },
          { label: 'Prag i ulët stoku', value: '10 cope' },
        ]}
      />
    </>
  )
}
