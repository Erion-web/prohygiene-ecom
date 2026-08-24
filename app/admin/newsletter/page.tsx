import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { NewsletterClient } from './NewsletterClient'

export default async function NewsletterAdminPage() {
  const supabase = await createClient()
  const { count } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  return (
    <div>
      <AdminHeader title="Newsletter" subtitle={`${count ?? 0} pajtues aktivë`} />
      <div className="p-4 max-w-2xl">
        <NewsletterClient subscriberCount={count ?? 0} />
      </div>
    </div>
  )
}
