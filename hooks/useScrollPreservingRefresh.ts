'use client'

import { useRouter } from 'next/navigation'

export function useScrollPreservingRefresh() {
  const router = useRouter()

  return () => {
    const y = window.scrollY
    router.refresh()
    // Restore scroll after Next.js re-renders (try at 50 / 150 / 400ms)
    setTimeout(() => window.scrollTo(0, y), 50)
    setTimeout(() => window.scrollTo(0, y), 150)
    setTimeout(() => window.scrollTo(0, y), 400)
  }
}
