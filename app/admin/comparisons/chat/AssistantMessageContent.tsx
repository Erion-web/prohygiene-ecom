'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { cn } from '@/lib/utils'
import { normalizeAssistantMarkdown } from '@/lib/comparisons/normalize-chat-markdown'

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-600 hover:underline"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-3 w-full overflow-x-auto rounded-lg border border-surface-border">
      <table className="w-full min-w-[520px] border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-soft text-text-muted">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-surface-border bg-white">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-surface-soft/40">{children}</tr>,
  th: ({ children, style }) => (
    <th
      style={style}
      className={cn(
        'border-b border-surface-border px-3 py-2 text-left font-medium',
        style?.textAlign === 'right' && 'text-right tabular-nums',
        style?.textAlign === 'center' && 'text-center'
      )}
    >
      {children}
    </th>
  ),
  td: ({ children, style }) => (
    <td
      style={style}
      className={cn(
        'px-3 py-2 align-top text-text-primary',
        style?.textAlign === 'right' && 'text-right tabular-nums font-medium',
        style?.textAlign === 'center' && 'text-center'
      )}
    >
      {children}
    </td>
  ),
}

export function AssistantMessageContent({ content }: { content: string }) {
  const markdown = normalizeAssistantMarkdown(content)

  return (
    <div className="comparison-chat-md max-w-none text-sm leading-relaxed text-text-primary [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
