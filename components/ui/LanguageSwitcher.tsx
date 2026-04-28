'use client'

import { useLanguageStore } from '@/store/language'
import { langs } from '@/lib/i18n'
import type { Lang } from '@/types'

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguageStore()

  return (
    <div className="flex items-center gap-0.5 bg-surface-muted rounded-lg p-0.5">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code as Lang)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200 ${
            lang === l.code
              ? 'bg-white text-text-primary shadow-soft'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
