import type { LeaseClientAddress } from '@/types'

export function formatClientAddress(a: Pick<LeaseClientAddress, 'label' | 'city' | 'address'>) {
  const line = [a.city, a.address].filter(Boolean).join(', ')
  return a.label ? `${a.label} — ${line}` : line
}

export function primaryClientAddress(addresses: LeaseClientAddress[] | undefined | null) {
  if (!addresses?.length) return null
  return addresses.find(a => a.is_primary) ?? addresses[0]
}
