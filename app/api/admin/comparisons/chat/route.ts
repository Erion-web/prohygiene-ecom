import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/require-admin'
import { runComparisonChat } from '@/lib/comparisons/deepseek'
import { apiError, handleApiError } from '@/lib/api/errors'

const bodySchema = z.object({
  threadId: z.string().uuid().optional(),
  message: z.string().min(1).max(4000),
})

export async function POST(req: Request) {
  const { supabase, user, authorized } = await requireAdmin()
  if (!authorized || !user) return apiError('Forbidden', 403)

  try {
    const { threadId: inputThreadId, message } = bodySchema.parse(await req.json())

    let threadId = inputThreadId
    if (!threadId) {
      const title = message.slice(0, 60)
      const { data: thread, error } = await supabase
        .from('comparison_threads')
        .insert({ user_id: user.id, title })
        .select('id')
        .single()
      if (error || !thread) return apiError('Nuk u krijua biseda', 500)
      threadId = thread.id
    } else {
      const { data: owned } = await supabase
        .from('comparison_threads')
        .select('id')
        .eq('id', threadId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!owned) return apiError('Biseda nuk u gjet', 404)
    }

    await supabase.from('comparison_messages').insert({
      thread_id: threadId,
      role: 'user',
      content: message,
    })

    const { data: history } = await supabase
      .from('comparison_messages')
      .select('role, content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(40)

    const assistantText = await runComparisonChat(
      (history ?? []).map(m => ({
        role: m.role as 'user' | 'assistant' | 'tool',
        content: m.content,
      }))
    )

    await supabase.from('comparison_messages').insert({
      thread_id: threadId,
      role: 'assistant',
      content: assistantText,
    })

    await supabase
      .from('comparison_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId)

    return NextResponse.json({ threadId, reply: assistantText })
  } catch (err) {
    return handleApiError(err, '[comparisons/chat]')
  }
}
