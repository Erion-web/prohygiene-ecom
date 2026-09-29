import { AdminHeader } from '@/components/admin/AdminHeader'
import { Shield } from 'lucide-react'
import { StaticSettingsSection } from '../StaticSettingsSection'

export default function SettingsSecurityPage() {
  return (
    <>
      <AdminHeader title="Cilësimet" subtitle="Siguria" />
      <StaticSettingsSection
        icon={Shield}
        title="Siguria"
        desc="Cilësimet e sigurisë dhe aksesit"
        items={[
          { label: 'Row Level Security', value: 'Aktivuar' },
          { label: 'JWT Expiry', value: '1 orë' },
          { label: 'Autentikimi 2FA', value: 'Opsional' },
        ]}
      />
    </>
  )
}
