export type ContractActivityKind = 'created' | 'updated' | 'started' | 'ending' | 'device' | 'refill' | 'order'

export type ContractActivityEvent = {
  id: string
  kind: ContractActivityKind
  at: string
  title: string
  detail: string
  meta?: string
}

export type ContractRefillMonth = {
  key: string
  label: string
  count: number
  liters: number
  ml: number
}

export type ContractDeviceChoice = {
  id: string
  label: string
  materials: Array<{ id: string; name_sq: string; unit: string; sku?: string; capacity?: number }>
}

export type ContractActivity = {
  events: ContractActivityEvent[]
  months: ContractRefillMonth[]
  devices: ContractDeviceChoice[]
  totalCount: number
  totalLiters: number
  totalMl: number
  orderCount: number
}

export function formatRefillAmount(amount: number, unit: string) {
  if (unit === 'ml') {
    const liters = amount / 1000
    return `${liters.toLocaleString('sq-AL', { maximumFractionDigits: 3 })} L (${amount.toLocaleString('sq-AL')} ml)`
  }
  return `${amount.toLocaleString('sq-AL')} ${unit}`
}

export function formatLiters(value: number) {
  return `${value.toLocaleString('sq-AL', { maximumFractionDigits: 3 })} L`
}

export const ACTIVITY_KIND_LABELS: Record<ContractActivityKind, string> = {
  created: 'Kontratë',
  updated: 'Përditësim',
  started: 'Fillim',
  ending: 'Mbarim',
  device: 'Pajisje',
  refill: 'Rimbushje',
  order: 'Porosi web',
}
