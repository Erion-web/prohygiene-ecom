import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { NewOrderForm } from './NewOrderForm'

export default function NewOrderPage() {
  return (
    <div>
      <AdminHeader
        title="Porosi e Re"
        subtitle="Krijoni një porosi manualisht (p.sh. porosi telefonike)"
        actions={
          <Link href="/admin/orders" className="btn-ghost gap-1.5 text-sm">
            <ArrowLeft size={15} />
            Kthehu
          </Link>
        }
      />
      <div className="admin-page max-w-3xl">
        <NewOrderForm />
      </div>
    </div>
  )
}
