import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Lang, Product, AudienceType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency = '€'): string {
  return `${currency}${amount.toFixed(2)}`
}

export function getProductName(product: { name_sq: string; name_en: string }, lang: Lang): string {
  return lang === 'sq' ? product.name_sq : product.name_en
}

export function getProductDescription(
  product: { description_sq: string | null; description_en: string | null },
  lang: Lang
): string {
  return (lang === 'sq' ? product.description_sq : product.description_en) ?? ''
}

export function getCategoryName(
  category: { name_sq: string; name_en: string },
  lang: Lang
): string {
  return lang === 'sq' ? category.name_sq : category.name_en
}

export function getEffectivePrice(product: Product): number {
  if (product.effective_price != null) return product.effective_price
  if (product.sale_price != null) return product.sale_price
  return product.price
}

export function getDiscountPercent(product: Product): number | null {
  const effective = getEffectivePrice(product)
  if (effective >= product.price) return null
  return Math.round(((product.price - effective) / product.price) * 100)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function audienceLabel(type: AudienceType, lang: Lang): string {
  const labels: Record<AudienceType, { sq: string; en: string }> = {
    home: { sq: 'Shtëpi', en: 'Home' },
    business: { sq: 'Biznes', en: 'Business' },
    both: { sq: 'Të gjithë', en: 'All' },
  }
  return labels[type][lang]
}

export function statusLabel(status: string, lang: Lang): string {
  const labels: Record<string, { sq: string; en: string }> = {
    pending: { sq: 'Në pritje', en: 'Pending' },
    confirmed: { sq: 'Konfirmuar', en: 'Confirmed' },
    processing: { sq: 'Në përpunim', en: 'Processing' },
    shipped: { sq: 'Dërguar', en: 'Shipped' },
    delivered: { sq: 'Dorëzuar', en: 'Delivered' },
    cancelled: { sq: 'Anuluar', en: 'Cancelled' },
    approved: { sq: 'Aprovuar', en: 'Approved' },
    declined: { sq: 'Refuzuar', en: 'Declined' },
    needs_clarification: { sq: 'Kërkon sqarim', en: 'Needs clarification' },
  }
  return labels[status]?.[lang] ?? status
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-amber-600 bg-amber-50 border-amber-200',
    confirmed: 'text-blue-600 bg-blue-50 border-blue-200',
    processing: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    shipped: 'text-purple-600 bg-purple-50 border-purple-200',
    delivered: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    cancelled: 'text-red-600 bg-red-50 border-red-200',
    approved: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    declined: 'text-red-600 bg-red-50 border-red-200',
    needs_clarification: 'text-orange-600 bg-orange-50 border-orange-200',
  }
  return colors[status] ?? 'text-slate-600 bg-slate-50 border-slate-200'
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD-${date}-${rand}`
}

export function isProductInStock(product: Product): boolean {
  return product.stock > 0
}

export function getLowStockThreshold(): number {
  return 10
}

export function isLowStock(product: Product): boolean {
  return product.stock > 0 && product.stock <= getLowStockThreshold()
}
