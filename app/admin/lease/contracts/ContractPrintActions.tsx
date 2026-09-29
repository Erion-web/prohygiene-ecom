'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Printer } from 'lucide-react'

export function ContractPrintActions() {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 400)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="print:hidden sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-surface-border bg-white px-4 py-3">
      <Link href="/admin/lease/contracts" className="btn-ghost text-sm">
        Kthehu
      </Link>
      <button type="button" onClick={() => window.print()} className="btn-primary gap-1.5 text-sm">
        <Printer size={15} />
        Printo
      </button>
    </div>
  )
}
