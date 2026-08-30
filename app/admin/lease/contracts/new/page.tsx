import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { loadContractFormOptions } from '@/lib/lease/contract-form-data'
import { ContractForm } from '../ContractForm'

export default async function NewContractPage() {
  const { clients, leaseDevices, materials } = await loadContractFormOptions()

  return (
    <div>
      <AdminHeader
        title="Kontratë e Re"
        subtitle="Krijoni një marrëveshje të re me klientin"
        actions={
          <Link href="/admin/lease/contracts" className="btn-ghost gap-1.5 text-sm">
            <ArrowLeft size={15} />
            Kthehu
          </Link>
        }
      />
      <div className="admin-page">
        <ContractForm clients={clients} leaseDevices={leaseDevices} materials={materials} />
      </div>
    </div>
  )
}
