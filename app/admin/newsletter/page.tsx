import { createClient } from '@/lib/supabase/server'
import { NewsletterClient } from './NewsletterClient'
import { buildNewsletterRecipients, type NewsletterCampaign } from '@/lib/admin/newsletter-recipients'

export default async function NewsletterAdminPage() {
  const supabase = await createClient()
  const [profilesRes, leaseRes, ordersRes, subscribersRes, historyRes] = await Promise.all([
    supabase.from('profiles').select('email, full_name, city').order('created_at', { ascending: false }),
    supabase.from('lease_clients').select('email, company_name, contact_name, city').order('company_name'),
    supabase
      .from('orders')
      .select('customer_email, customer_name, city, created_at')
      .order('created_at', { ascending: false })
      .limit(2000),
    supabase.from('newsletter_subscribers').select('email').eq('is_active', true),
    supabase
      .from('newsletter_campaigns')
      .select('id, subject, message, audience_count, sent_at')
      .order('sent_at', { ascending: false }),
  ])

  const recipients = buildNewsletterRecipients({
    profiles: profilesRes.data ?? [],
    leaseClients: leaseRes.data ?? [],
    orders: ordersRes.data ?? [],
    subscribers: subscribersRes.data ?? [],
  })

  return (
    <NewsletterClient
      recipients={recipients}
      history={(historyRes.data as NewsletterCampaign[] | null) ?? []}
    />
  )
}
