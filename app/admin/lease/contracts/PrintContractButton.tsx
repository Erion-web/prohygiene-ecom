'use client'

import { useState } from 'react'
import { Loader2, Printer } from 'lucide-react'

const PRINT_PAGE_CSS = `
  @page { size: A4; margin: 0; }
  @media print {
    html, body { margin: 0 !important; background: #fff !important; }
  }
`

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

  const handlePrint = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/admin/lease/contracts/${contractId}/print`)
      if (!res.ok) throw new Error('print failed')
      const html = await res.text()
      const iframe = document.createElement('iframe')
      iframe.setAttribute('aria-hidden', 'true')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.srcdoc = html.includes('</head>')
        ? html.replace('</head>', `<style>${PRINT_PAGE_CSS}</style></head>`)
        : `${html}<style>${PRINT_PAGE_CSS}</style>`

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
    } catch {
      setLoading(false)
    }
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
