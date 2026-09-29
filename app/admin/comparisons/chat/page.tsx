import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { ComparisonChatClient } from './ComparisonChatClient'
import type { ComparisonMessage, ComparisonThread } from '@/types'

const THREADS_PAGE_SIZE = 25
const MESSAGES_PAGE_SIZE = 30

export default async function ComparisonChatPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string; page?: string; before?: string }>
}) {
  const params = await searchParams
  const user = await getAuthUser()
  const supabase = await createClient()

  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const offset = (page - 1) * THREADS_PAGE_SIZE

  const { data: threadsRaw } = user
    ? await supabase
        .from('comparison_threads')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .range(offset, offset + THREADS_PAGE_SIZE - 1)
    : { data: [] }

  const threads = (threadsRaw ?? []) as ComparisonThread[]
  const activeThreadId = params.thread ?? null

  let messages: ComparisonMessage[] = []
  let hasOlderMessages = false

  if (activeThreadId && user) {
    let msgQuery = supabase
      .from('comparison_messages')
      .select('*')
      .eq('thread_id', activeThreadId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
      .limit(MESSAGES_PAGE_SIZE + 1)

    if (params.before) {
      msgQuery = msgQuery.lt('created_at', params.before)
    }

    const { data: msgRows } = await msgQuery
    const list = (msgRows ?? []) as ComparisonMessage[]
    hasOlderMessages = list.length > MESSAGES_PAGE_SIZE
    messages = list.slice(0, MESSAGES_PAGE_SIZE).reverse()
  }

  return (
    <div>
      <AdminHeader
        title="Asistenti AI"
        subtitle="Pyetje mbi çmimet e ruajtura. AI nuk skrapon faqe."
      />
      <ComparisonChatClient
        threads={threads}
        activeThreadId={activeThreadId}
        messages={messages}
        hasOlderMessages={hasOlderMessages}
        page={page}
      />
    </div>
  )
}
