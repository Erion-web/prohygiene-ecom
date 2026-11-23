import { AdminHeader } from '@/components/admin/AdminHeader'
import { AssistantClient } from './AssistantClient'

export default function AssistantPage() {
  return (
    <div>
      <AdminHeader
        title="Asistenti AI"
        subtitle="Produkte dhe porosi: shkruaj çfarë duhet bërë. Ti e konfirmon para se të ruhet."
      />
      <AssistantClient />
    </div>
  )
}
