import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { loadContract, loadContractFormOptions } from '@/lib/lease/contract-form-data'
import { loadContractActivity } from '@/lib/lease/load-contract-activity'
import { ContractForm } from '../../ContractForm'
import { PrintContractButton } from '../../PrintContractButton'
import { ContractTimelineButton } from '../../ContractTimelineButton'
import { ContractRefillCard } from '../../ContractRefillCard'

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ clients, leaseDevices, materials, nextContractNumber }, contract, activity] = await Promise.all([
    loadContractFormOptions(),
    loadContract(id),
    loadContractActivity(id),
  ])

  if (!contract) notFound()

  return (
    <div>
      <AdminHeader
        title={contract.contract_number ? `Kontrata #${contract.contract_number}` : 'Modifiko Kontratën'}
        subtitle={contract.client?.company_name ?? 'Marrëveshja me klientin'}
        actions={
          <div className="flex items-center gap-1.5">
            <ContractTimelineButton activity={activity} />
            <PrintContractButton contractId={contract.id} />
            <Link href="/admin/lease/contracts" className="btn-ghost gap-1.5 text-sm">
              <ArrowLeft size={15} />
              Kthehu
            </Link>
          </div>
        }
      />
      <div className="admin-page space-y-5">
        <ContractRefillCard devices={activity.devices} materials={materials} />
        <ContractForm
          clients={clients}
          leaseDevices={leaseDevices}
          materials={materials}
          nextContractNumber={nextContractNumber}
          contract={contract}
        />
      </div>
    </div>
  )
}
