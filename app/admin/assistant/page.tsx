import { AdminHeader } from '@/components/admin/AdminHeader'
import { AssistantClient } from './AssistantClient'

export default function AssistantPage() {
  return (
    <div>
      <AdminHeader
        title="Asistenti i produkteve"
        subtitle="Shkruaj çfarë të shtohet ose ndryshohet. Ti e konfirmon para se të ruhet."
      />
      <AssistantClient />
    </div>
  )
}
