'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ComparisonMessage, ComparisonThread } from '@/types'

interface Props {
  threads: ComparisonThread[]
  activeThreadId: string | null
  messages: ComparisonMessage[]
  hasOlderMessages: boolean
  page: number
}

export function ComparisonChatClient({
  threads,
  activeThreadId,
  messages,
  hasOlderMessages,
  page,
}: Props) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/comparisons/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: activeThreadId ?? undefined, message: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Dështoi')
      setInput('')
      router.push(`/admin/comparisons/chat?thread=${data.threadId}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gabim')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="admin-page grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 min-h-[520px]">
      <aside className="admin-card p-3 flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
        <button
          type="button"
          className="btn-secondary text-sm w-full"
          onClick={() => router.push('/admin/comparisons/chat')}
        >
          Bisedë e re
        </button>
        {threads.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => router.push(`/admin/comparisons/chat?thread=${t.id}`)}
            className={`text-left text-sm px-2 py-2 rounded-lg truncate ${
              activeThreadId === t.id ? 'bg-brand-50 text-brand-800' : 'hover:bg-surface-soft text-text-secondary'
            }`}
          >
            {t.title}
          </button>
        ))}
        {page > 1 && (
          <button
            type="button"
            className="text-xs text-brand-600 hover:underline mt-2"
            onClick={() => router.push(`/admin/comparisons/chat?page=${page - 1}${activeThreadId ? `&thread=${activeThreadId}` : ''}`)}
          >
            Biseda më të vjetra
          </button>
        )}
      </aside>

      <div className="admin-card flex flex-col min-h-[520px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {hasOlderMessages && activeThreadId && (
            <button
              type="button"
              className="text-xs text-brand-600 hover:underline"
              onClick={() =>
                router.push(`/admin/comparisons/chat?thread=${activeThreadId}&before=${messages[0]?.created_at}`)
              }
            >
              Ngarko mesazhe më të vjetra
            </button>
          )}
          {!messages.length && (
            <p className="text-sm text-text-muted">
              Pyet për çmimin e një produkti te një konkurrent. Përgjigja vjen vetëm nga katalogu i skrapuar.
            </p>
          )}
          {messages.map(m => (
            <div
              key={m.id}
              className={`max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'ml-auto bg-brand-600 text-white'
                  : 'bg-surface-soft text-text-primary border border-surface-border'
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>
        <div className="border-t border-surface-border p-3 flex gap-2">
          <input
            className="input flex-1"
            placeholder="p.sh. Sa kushton detergjenti X te konkurrenti Y?"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button type="button" className="btn-primary px-4" disabled={sending} onClick={send}>
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
