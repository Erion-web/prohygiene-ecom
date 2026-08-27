import { AdminHeader } from '@/components/admin/AdminHeader'
import { ImportProductsClient } from './ImportProductsClient'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ImportProductsPage() {
  return (
    <div>
      <AdminHeader
        title="Importo Produkte"
        subtitle="Ngarko Excel ose CSV me produkte"
        actions={
          <Link href="/admin/products" className="btn-ghost gap-1.5 text-sm">
            <ArrowLeft size={15} />
            Kthehu
          </Link>
        }
      />
      <div className="admin-page">
        <ImportProductsClient />
      </div>
    </div>
  )
}
