import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadContract } from '@/lib/lease/contract-form-data'
import { ContractPrintDocument } from '../../ContractPrintDocument'

export default async function PrintContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const contract = await loadContract(id)
  if (!contract) notFound()

  let fiscalNumber: string | null = null
  if (contract.client?.profile_id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('fiscal_number')
      .eq('id', contract.client.profile_id)
      .maybeSingle()
    fiscalNumber = data?.fiscal_number ?? null
  }

  return <ContractPrintDocument contract={contract} fiscalNumber={fiscalNumber} />
}
