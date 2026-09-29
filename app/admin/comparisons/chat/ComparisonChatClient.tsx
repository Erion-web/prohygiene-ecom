'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import type { ComparisonMessage, ComparisonThread } from '@/types'
import { AssistantMessageContent } from './AssistantMessageContent'

interface Props {
  threads: ComparisonThread[]
  activeThreadId: string | null
  messages: ComparisonMessage[]
  hasOlderMessages: boolean
  page: number
}

type LiveTurn = {
  userMessage: string
  status: 'thinking' | 'typing'
  assistantPreview: string
}

async function revealTypewriter(text: string, onUpdate: (value: string) => void, signal: AbortSignal) {
  const step = text.length > 800 ? 8 : text.length > 400 ? 5 : 3
  const delay = text.length > 800 ? 8 : 14

  for (let i = 0; i <= text.length; i += step) {
    if (signal.aborted) return
    onUpdate(text.slice(0, Math.min(i, text.length)))
    await new Promise<void>(resolve => {
      window.setTimeout(resolve, delay)
    })
  }
  onUpdate(text)
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-md border border-surface-border bg-white px-4 py-3 shadow-soft">
        <div className="flex items-center gap-1.5" aria-label="Duke shkruar">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-text-muted animate-bounce"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.9s' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user'
  const hasTable = !isUser && /^\|.+\|$/m.test(content)
  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          hasTable ? 'max-w-full sm:max-w-[min(100%,56rem)]' : 'max-w-[85%] sm:max-w-[75%]',
          isUser
            ? 'rounded-br-md bg-brand-600 text-white whitespace-pre-wrap'
            : 'rounded-bl-md border border-surface-border bg-white text-text-primary shadow-soft'
        )}
      >
        {isUser ? content : <AssistantMessageContent content={content} />}
      </div>
    </div>
  )
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
  const [liveTurn, setLiveTurn] = useState<LiveTurn | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  useEffect(() => {
    scrollToBottom(liveTurn ? 'auto' : 'smooth')
  }, [messages, liveTurn, scrollToBottom])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const send = async () => {
    const text = input.trim()
    if (!text || sending || liveTurn) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setSending(true)
    setInput('')
    setLiveTurn({ userMessage: text, status: 'thinking', assistantPreview: '' })

    try {
      const res = await fetch('/api/admin/comparisons/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: activeThreadId ?? undefined, message: text }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Dështoi')

      const reply = String(data.reply ?? '')
      setLiveTurn({ userMessage: text, status: 'typing', assistantPreview: '' })

      await revealTypewriter(
        reply,
        assistantPreview => {
          setLiveTurn(prev =>
            prev ? { ...prev, status: 'typing', assistantPreview } : prev
          )
        },
        controller.signal
      )

      if (controller.signal.aborted) return

      setLiveTurn(null)
      router.push(`/admin/comparisons/chat?thread=${data.threadId}`)
      router.refresh()
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setLiveTurn(null)
      setInput(text)
      toast.error(err instanceof Error ? err.message : 'Gabim')
    } finally {
      setSending(false)
    }
  }

  const busy = sending || liveTurn != null

  return (
    <div className="admin-page grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 min-h-[520px]">
      <aside className="admin-card p-3 flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
        <button
          type="button"
          className="btn-secondary text-sm w-full"
          onClick={() => router.push('/admin/comparisons/chat')}
          disabled={busy}
        >
          Bisedë e re
        </button>
        {threads.map(t => (
          <button
            key={t.id}
            type="button"
            disabled={busy}
            onClick={() => router.push(`/admin/comparisons/chat?thread=${t.id}`)}
            className={cn(
              'text-left text-sm px-2 py-2 rounded-lg truncate transition-colors',
              activeThreadId === t.id
                ? 'bg-brand-50 text-brand-800'
                : 'hover:bg-surface-soft text-text-secondary'
            )}
          >
            {t.title}
          </button>
        ))}
        {page > 1 && (
          <button
            type="button"
            className="text-xs text-brand-600 hover:underline mt-2"
            onClick={() =>
              router.push(
                `/admin/comparisons/chat?page=${page - 1}${activeThreadId ? `&thread=${activeThreadId}` : ''}`
              )
            }
          >
            Biseda më të vjetra
          </button>
        )}
      </aside>

      <div className="admin-card flex flex-col min-h-[520px] max-h-[calc(100vh-10rem)]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {hasOlderMessages && activeThreadId && !liveTurn && (
            <button
              type="button"
              className="text-xs text-brand-600 hover:underline"
              onClick={() =>
                router.push(
                  `/admin/comparisons/chat?thread=${activeThreadId}&before=${messages[0]?.created_at}`
                )
              }
            >
              Ngarko mesazhe më të vjetra
            </button>
          )}
          {!messages.length && !liveTurn && (
            <p className="text-sm text-text-muted max-w-md">
              Pyet për çmimin e një produkti te një konkurrent. Përgjigja vjen vetëm nga katalogu i skrapuar.
            </p>
          )}
          {messages.map(m => (
            <MessageBubble key={m.id} role={m.role === 'user' ? 'user' : 'assistant'} content={m.content} />
          ))}

          {liveTurn && (
            <>
              <MessageBubble role="user" content={liveTurn.userMessage} />
              {liveTurn.status === 'thinking' && <TypingIndicator />}
              {liveTurn.status === 'typing' && (
                <MessageBubble role="assistant" content={liveTurn.assistantPreview || ' '} />
              )}
            </>
          )}
        </div>

        <div className="border-t border-surface-border p-3 flex gap-2 bg-surface-soft/30">
          <input
            className="input flex-1 bg-white"
            placeholder="p.sh. Sa kushton detergjenti X te konkurrenti Y?"
            value={input}
            disabled={busy}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
          />
          <button
            type="button"
            className="btn-primary px-4 min-w-[3rem]"
            disabled={busy || !input.trim()}
            onClick={() => void send()}
            aria-label="Dërgo"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
