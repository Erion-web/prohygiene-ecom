import type { ReminderPeriod } from '@/types'

export function periodDays(period: ReminderPeriod): number {
  return period === 'week' ? 7 : 30
}

export function dailyConsumptionRate(expectedConsumption: number, period: ReminderPeriod): number {
  const days = periodDays(period)
  if (days <= 0 || expectedConsumption <= 0) return 0
  return expectedConsumption / days
}

export function daysUntilEmpty(currentLevel: number, dailyRate: number): number | null {
  if (dailyRate <= 0) return null
  return currentLevel / dailyRate
}

export function shouldAlertConsumption(params: {
  currentLevel: number
  expectedConsumption: number
  consumptionPeriod: ReminderPeriod
  surplusDays: number
  lastRefilledAt: string
}): boolean {
  const dailyRate = dailyConsumptionRate(params.expectedConsumption, params.consumptionPeriod)
  const daysLeft = daysUntilEmpty(params.currentLevel, dailyRate)
  if (daysLeft !== null && daysLeft <= params.surplusDays) return true

  const periodDaysCount = periodDays(params.consumptionPeriod)
  const lastRefill = new Date(params.lastRefilledAt)
  const alertFrom = new Date(lastRefill)
  alertFrom.setDate(alertFrom.getDate() + periodDaysCount - params.surplusDays)
  return new Date() >= alertFrom
}

export function daysUntilContractEnd(endsAt: string): number {
  const end = new Date(endsAt)
  const now = new Date()
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function shouldAlertContractExpiry(endsAt: string, surplusDays: number): boolean {
  const daysLeft = daysUntilContractEnd(endsAt)
  return daysLeft <= surplusDays && daysLeft >= 0
}

export function formatMaterialUnit(unit: string, lang: 'sq' | 'en' = 'sq'): string {
  if (unit === 'ml') return 'ml'
  if (unit === 'pako') return lang === 'sq' ? 'pako' : 'pack'
  return lang === 'sq' ? 'copë' : 'pcs'
}

export const LEASE_PAYMENT_LABELS: Record<string, { sq: string; en: string; color: string }> = {
  paid: { sq: 'Paguar', en: 'Paid', color: 'bg-emerald-50 text-emerald-700' },
  unpaid: { sq: 'Pa paguar', en: 'Unpaid', color: 'bg-amber-50 text-amber-700' },
  danger: { sq: 'Rrezik', en: 'Danger', color: 'bg-red-50 text-red-700' },
}

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  active: 'Aktiv',
  expired: 'Skaduar',
  cancelled: 'Anuluar',
}
