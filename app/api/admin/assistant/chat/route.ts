import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/require-admin'
import { runAssistant } from '@/lib/assistant/groq'
import { compactPostaExport, parsePostaExport } from '@/lib/assistant/compact-posta'
import { buildPostaPlan } from '@/lib/assistant/posta-plan'
import { apiError, handleApiError } from '@/lib/api/errors'

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(60000) }))
    .min(1)
    .max(30),
})

export async function POST(req: Request) {
  const { supabase, authorized } = await requireAdmin()
  if (!authorized) return apiError('Forbidden', 403)

  try {
    const { messages } = bodySchema.parse(await req.json())
    // A pasted Falcon list is handled deterministically (no AI): faster and no extraction mistakes.
    const last = messages[messages.length - 1]
    const postaRows = last.role === 'user' ? parsePostaExport(last.content) : null
    if (postaRows) return NextResponse.json(await buildPostaPlan(supabase, postaRows))

    const compacted = messages.map(m => (m.role === 'user' ? { ...m, content: compactPostaExport(m.content).slice(0, 12000) } : m))
    const { reply, plan } = await runAssistant(supabase, compacted)
    return NextResponse.json({ reply, plan })
  } catch (err) {
    if (err instanceof Error && !(err.name === 'ZodError')) {
      console.error('[assistant/chat]', err)
      return apiError(err.message.slice(0, 300), 502)
    }
    return handleApiError(err, '[assistant/chat]')
  }
}
