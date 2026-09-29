'use client'

import { Printer } from 'lucide-react'

export function PrintContractButton({
  contractId,
  className,
  iconOnly = false,
}: {
  contractId: string
  className?: string
  iconOnly?: boolean
}) {
  const handlePrint = () => {
    const url = `/admin/lease/contracts/${contractId}/print`
    const win = window.open(url, '_blank')
    if (!win) window.location.assign(url)
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={className ?? (iconOnly ? 'p-1.5 hover:bg-brand-50 rounded-lg' : 'btn-ghost gap-1.5 text-sm')}
      title="Printo"
    >
      <Printer size={iconOnly ? 14 : 15} />
      {iconOnly ? null : 'Printo'}
    </button>
  )
}
