export type NewsletterRecipientSource = 'customer' | 'lease' | 'guest' | 'subscriber'

export type NewsletterRecipient = {
  email: string
  name: string
  city: string | null
  source: NewsletterRecipientSource
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isEmail(value: string) {
  return value.includes('@')
}

export function buildNewsletterRecipients(input: {
  profiles: Array<{ email: string; full_name: string | null; city: string | null }>
  leaseClients: Array<{ email: string; company_name: string; contact_name: string; city: string | null }>
  orders: Array<{ customer_email: string; customer_name?: string | null; city?: string | null; created_at: string }>
  subscribers: Array<{ email: string }>
}): NewsletterRecipient[] {
  const map = new Map<string, NewsletterRecipient>()

  for (const profile of input.profiles) {
    const email = normalizeEmail(profile.email)
    if (!isEmail(email)) continue
    map.set(email, {
      email,
      name: profile.full_name?.trim() || email,
      city: profile.city?.trim() || null,
      source: 'customer',
    })
  }

  for (const client of input.leaseClients) {
    const email = normalizeEmail(client.email)
    if (!isEmail(email)) continue
    const existing = map.get(email)
    if (existing) {
      if (!existing.city && client.city) existing.city = client.city.trim()
      continue
    }
    map.set(email, {
      email,
      name: client.company_name?.trim() || client.contact_name?.trim() || email,
      city: client.city?.trim() || null,
      source: 'lease',
    })
  }

  const firstOrder = new Map<string, (typeof input.orders)[number]>()
  for (const order of input.orders) {
    const email = normalizeEmail(order.customer_email ?? '')
    if (!isEmail(email)) continue
    const current = firstOrder.get(email)
    if (!current || order.created_at < current.created_at) firstOrder.set(email, order)
  }

  for (const [email, order] of firstOrder) {
    const existing = map.get(email)
    const city = order.city?.trim() || null
    if (existing) {
      if (!existing.city && city) existing.city = city
      continue
    }
    map.set(email, {
      email,
      name: order.customer_name?.trim() || email,
      city,
      source: 'guest',
    })
  }

  for (const subscriber of input.subscribers) {
    const email = normalizeEmail(subscriber.email)
    if (!isEmail(email) || map.has(email)) continue
    map.set(email, {
      email,
      name: email,
      city: null,
      source: 'subscriber',
    })
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'sq'))
}

export const RECIPIENT_SOURCE_LABELS: Record<NewsletterRecipientSource, string> = {
  customer: 'Klient',
  lease: 'Shfrytëzues',
  guest: 'Vizitor',
  subscriber: 'Pajtues',
}
