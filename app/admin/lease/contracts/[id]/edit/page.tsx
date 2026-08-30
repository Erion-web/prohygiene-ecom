import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { loadContract, loadContractFormOptions } from '@/lib/lease/contract-form-data'
import { ContractForm } from '../../ContractForm'

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ clients, leaseDevices, materials }, contract] = await Promise.all([
    loadContractFormOptions(),
    loadContract(id),
  ])

  if (!contract) notFound()

  return (
    <div>
      <AdminHeader
        title="Modifiko Kontratën"
        subtitle={contract.client?.company_name ?? 'Marrëveshja me klientin'}
        actions={
          <Link href="/admin/lease/contracts" className="btn-ghost gap-1.5 text-sm">
            <ArrowLeft size={15} />
            Kthehu
          </Link>
        }
      />
      <div className="admin-page">
        <ContractForm
          clients={clients}
          leaseDevices={leaseDevices}
          materials={materials}
          contract={contract}
        />
      </div>
    </div>
  )
}
