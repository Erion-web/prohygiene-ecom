import sq from './translations/sq'
import en from './translations/en'
import type { Lang } from '@/types'

export const translations = { sq, en }

export function t(lang: Lang) {
  return translations[lang]
}

export function getTranslation(lang: Lang, key: string): string {
  const keys = key.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = translations[lang]
  for (const k of keys) {
    result = result?.[k]
  }
  return typeof result === 'string' ? result : key
}

export const defaultLang: Lang = 'sq'

export const langs: { code: Lang; label: string; flag: string }[] = [
  { code: 'sq', label: 'Shqip', flag: '🇽🇰' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]
