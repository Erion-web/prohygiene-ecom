import type { OrderStatus } from '@/types'

// Falcon status names are free text ("Sukses", "E regjistruar", "Në shpërndarje"...).
export function isFalconSuccess(name: string | null | undefined): boolean {
  return !!name && /^\s*(sukses|success)\b/i.test(name)
}

/**
 * Which order status (if any) a Falcon status should move the order to.
 * - "Sukses" → completed
 * - any other known in-progress status → processing, but ONLY from pending
 * - never downgrades (completed stays completed), unknown/returned statuses do nothing
 */
export function targetOrderStatus(falconName: string, current: OrderStatus): OrderStatus | null {
  if (isFalconSuccess(falconName)) return current === 'completed' ? null : 'completed'
  if (/regjistruar|shp[eë]rndarje|n[eë] proces|n[eë] depo|marr|registered|in transit|processing/i.test(falconName)) {
    return current === 'pending' ? 'processing' : null
  }
  return null
}
