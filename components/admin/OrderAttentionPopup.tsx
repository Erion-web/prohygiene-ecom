'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, X } from 'lucide-react'
import type { AttentionGroup } from '@/lib/orders/attention'
import { formatPrice } from '@/lib/utils'

const POLL_MS = 5 * 60_000
const SNOOZE_MS = 60 * 60_000
const KEY = 'orderAttentionSnoozeUntil'

function readSnooze(): number {
  try { return Number(localStorage.getItem(KEY)) || 0 } catch { return 0 }
}

function ago(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600_000)
  return h < 1 ? 'tani' : h < 48 ? `${h}h` : `${Math.floor(h / 24)}d`
}

export function OrderAttentionPopup() {
  const [groups, setGroups] = useState<AttentionGroup[]>([])
  const [open, setOpen] = useState(false)
  const lastNew = useRef(-1)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders/attention', { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      const list = json.groups as AttentionGroup[]
      setGroups(list)
      const newCount = list.find(g => g.key === 'new')?.count ?? 0
      const hasNewer = lastNew.current >= 0 && newCount > lastNew.current
      lastNew.current = newCount
      if (json.total > 0 && (hasNewer || Date.now() > readSnooze())) setOpen(true)
    } catch {}
  }, [])

  useEffect(() => {
    load()
    const id = window.setInterval(load, POLL_MS)
    return () => window.clearInterval(id)
  }, [load])

  const total = groups.reduce((s, g) => s + g.count, 0)
  if (total === 0) return null

  const close = () => {
    try { localStorage.setItem(KEY, String(Date.now() + SNOOZE_MS)) } catch {}
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-amber-500 text-white text-sm font-semibold px-4 py-2 shadow-lg print:hidden"
      >
        <AlertTriangle size={16} /> {total} për t&apos;u parë
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden" onClick={close}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h2 className="font-bold text-text-primary">Porosi që kërkojnë vëmendje</h2>
              </div>
              <button onClick={close} aria-label="Mbyll"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-5">
              {groups.map(g => (
                <section key={g.key}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-semibold text-sm text-text-primary">{g.label}</h3>
                    <span className="text-sm font-bold text-amber-600">{g.count}</span>
                  </div>
                  <p className="text-xs text-text-muted mb-2">{g.hint}</p>
                  <ul className="space-y-1">
                    {g.orders.map(o => (
                      <li key={o.id}>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          onClick={close}
                          className="flex items-center justify-between gap-3 rounded-lg border border-surface-border px-3 py-2 text-sm hover:bg-surface-soft"
                        >
                          <span className="min-w-0 truncate">
                            <span className="font-medium">{o.customer_name}</span>
                            <span className="text-text-muted"> · {o.order_number}</span>
                          </span>
                          <span className="shrink-0 text-xs text-text-muted">{formatPrice(o.total)} · {ago(o.created_at)}</span>
                        </Link>
                      </li>
                    ))}
                    {g.count > g.orders.length && (
                      <li className="text-xs text-text-muted px-1">+ edhe {g.count - g.orders.length}</li>
                    )}
                  </ul>
                </section>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-surface-border">
              <p className="text-xs text-text-muted">Rishfaqet pas 1 ore ose kur ka të reja.</p>
              <Link href="/admin/orders" onClick={close} className="btn-primary text-sm py-2">Hap porositë</Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
