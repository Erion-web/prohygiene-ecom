import { AdminHeader } from '@/components/admin/AdminHeader'
import { Globe } from 'lucide-react'
import { StaticSettingsSection } from '../StaticSettingsSection'

export default function SettingsLanguagePage() {
  return (
    <>
      <AdminHeader title="Cilësimet" subtitle="Gjuha dhe lokalizimi" />
      <StaticSettingsSection
        icon={Globe}
        title="Gjuha & Lokalizimi"
        desc="Konfiguro gjuhën dhe rajonin e platformës"
        items={[
          { label: 'Gjuha kryesore', value: 'Shqip (sq-AL)' },
          { label: 'Gjuha dytësore', value: 'English (en)' },
          { label: 'Monedha', value: 'EUR (€)' },
          { label: 'Zona kohore', value: 'Europe/Pristina (UTC+1)' },
        ]}
      />
    </>
  )
}
