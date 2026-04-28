'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Lang } from '@/types'

interface LanguageState {
  lang: Lang
  setLang: (lang: Lang) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: 'sq' as Lang,
      setLang: (lang: Lang) => set({ lang }),
    }),
    {
      name: 'prohygiene-lang',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
