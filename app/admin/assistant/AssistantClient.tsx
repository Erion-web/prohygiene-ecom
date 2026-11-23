'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { PlanItem } from '@/lib/assistant/schemas'

type Result = { label: string; ok: boolean; message: string }
type Msg = {
  role: 'user' | 'assistant'
  content: string
  plan?: PlanItem[]
  status?: 'pending' | 'running' | 'done' | 'discarded'
  results?: Result[]
}

function describe(item: PlanItem): string {
  if (item.type === 'create_product') {
    return [
      `+ ${item.name_sq}`,
      `€${item.price}`,
      item.sale_price != null ? `ofertë €${item.sale_price}` : null,
      `stok ${item.stock}`,
      item.category_name,
      item.brand_name,
      item.is_active ? null : 'jo aktiv',
    ].filter(Boolean).join(' · ')
  }
  const { type: _t, sku, ...rest } = item
  void _t
  const changes = Object.entries(rest).map(([k, v]) => `${k}=${v === null ? 'null' : String(v)}`)
  return `~ ${sku}: ${changes.join(', ')}`
}

export function AssistantClient() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return
    const next: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const res = await fetch('/api/admin/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.slice(-20).map(m => ({
            role: m.role,
            content: m.plan?.length
              ? `${m.content}\n[Propozim me ${m.plan.length} ndryshime: ${m.status === 'done' ? 'u konfirmua' : m.status === 'discarded' ? 'u anulua' : 'në pritje'}]`
              : m.content,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gabim')
      setMessages(m => [
        ...m,
        { role: 'assistant', content: json.reply, plan: json.plan?.length ? json.plan : undefined, status: 'pending' },
      ])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gabim')
      setMessages(next.slice(0, -1))
      setInput(text)
    } finally {
      setBusy(false)
    }
  }

  const update = (i: number, patch: Partial<Msg>) =>
    setMessages(ms => ms.map((m, idx) => (idx === i ? { ...m, ...patch } : m)))

  const confirm = async (i: number) => {
    const plan = messages[i].plan
    if (!plan) return
    update(i, { status: 'running' })
    try {
      const res = await fetch('/api/admin/assistant/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gabim')
      update(i, { status: 'done', results: json.results })
      const failed = (json.results as Result[]).filter(r => !r.ok).length
      if (failed) toast.error(`${failed} dështuan`)
      else toast.success('U ruajt')
    } catch (e) {
      update(i, { status: 'pending' })
      toast.error(e instanceof Error ? e.message : 'Gabim')
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-card max-w-3xl flex flex-col" style={{ minHeight: '60vh' }}>
        <div className="flex-1 space-y-4 mb-4">
          {messages.length === 0 && (
            <p className="text-sm text-text-muted">
              Shembull: “Shto këto 12 produkte: Sapun duarsh 5L, çmimi 6.50, stok 20, kategoria Sapunë...” ose
              “Ngrit çmimin e të gjitha produkteve me SKU PH-123 në 4.90”.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 text-white px-4 py-2.5 text-sm whitespace-pre-wrap'
                    : 'max-w-[90%] rounded-2xl rounded-bl-md border border-surface-border bg-white px-4 py-2.5 text-sm shadow-soft'
                }
              >
                <p className="whitespace-pre-wrap">{m.content}</p>

                {m.plan && (
                  <div className="mt-3 border-t border-surface-border pt-3">
                    <ul className="space-y-1 text-xs text-text-secondary">
                      {m.plan.map((p, k) => (
                        <li key={k}>{describe(p)}</li>
                      ))}
                    </ul>

                    {m.status === 'pending' && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => confirm(i)} className="btn-primary inline-flex items-center gap-1.5 text-sm">
                          <Check size={14} /> Konfirmo ({m.plan.length})
                        </button>
                        <button onClick={() => update(i, { status: 'discarded' })} className="btn-secondary inline-flex items-center gap-1.5 text-sm">
                          <X size={14} /> Anulo
                        </button>
                      </div>
                    )}
                    {m.status === 'running' && (
                      <p className="mt-3 text-xs text-text-muted inline-flex items-center gap-1.5">
                        <Loader2 size={14} className="animate-spin" /> Duke ruajtur...
                      </p>
                    )}
                    {m.status === 'discarded' && <p className="mt-3 text-xs text-text-muted">Anuluar.</p>}
                    {m.status === 'done' && m.results && (
                      <ul className="mt-3 space-y-0.5 text-xs">
                        {m.results.map((r, k) => (
                          <li key={k} className={r.ok ? 'text-emerald-600' : 'text-red-600'}>
                            {r.ok ? '✓' : '✗'} {r.label}: {r.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <p className="text-xs text-text-muted inline-flex items-center gap-1.5">
              <Loader2 size={14} className="animate-spin" /> Duke menduar...
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={e => {
            e.preventDefault()
            send()
          }}
          className="flex gap-2 items-end"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            rows={3}
            placeholder="Shkruaj ose ngjit listën e produkteve..."
            className="input flex-1 resize-y"
          />
          <button type="submit" disabled={busy || !input.trim()} className="btn-primary h-10 px-4">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
