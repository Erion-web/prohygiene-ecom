import type { OrderStatus } from '@/types'

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'completed']

export function normalizeOrderStatus(status: string): OrderStatus {
  if (status === 'completed' || status === 'delivered') return 'completed'
  if (status === 'pending' || status === 'cancelled') return 'pending'
  return 'processing'
}

export function orderStatusMessage(status: string, lang: 'sq' | 'en' = 'sq'): string {
  const key = normalizeOrderStatus(status)
  const messages = {
    pending: {
      sq: 'Porosia juaj është marrë dhe është në pritje.',
      en: 'Your order has been received and is pending.',
    },
    processing: {
      sq: 'Porosia është në përpunim.',
      en: 'Your order is being processed.',
    },
    completed: {
      sq: 'Porosia u përfundua.',
      en: 'Your order is completed.',
    },
  }
  return messages[key][lang]
}
