'use client'

import { useState } from 'react'
import { Loader2, Printer } from 'lucide-react'

export function PrintContractButton({
  contractId,
  className,
  iconOnly = false,
}: {
  contractId: string
  className?: string
  iconOnly?: boolean
}) {
  const [loading, setLoading] = useState(false)

  const handlePrint = () => {
    setLoading(true)
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.position = 'fixed'
    iframe.style.left = '-10000px'
    iframe.style.top = '0'
    iframe.style.width = '210mm'
    iframe.style.height = '297mm'
    iframe.style.border = '0'
    iframe.src = `/admin/lease/contracts/${contractId}/print`

    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      iframe.remove()
      setLoading(false)
    }

    iframe.onload = () => {
      const win = iframe.contentWindow
      if (!win) {
        finish()
        return
      }
      win.addEventListener('afterprint', finish, { once: true })
      window.setTimeout(() => {
        win.focus()
        win.print()
      }, 250)
      window.setTimeout(finish, 120000)
    }
    document.body.appendChild(iframe)
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={loading}
      className={className ?? (iconOnly ? 'p-1.5 hover:bg-brand-50 rounded-lg' : 'btn-ghost gap-1.5 text-sm')}
      title="Printo"
    >
      {loading ? (
        <Loader2 size={iconOnly ? 14 : 15} className="animate-spin" />
      ) : (
        <Printer size={iconOnly ? 14 : 15} />
      )}
      {iconOnly ? null : 'Printo'}
    </button>
  )
}
