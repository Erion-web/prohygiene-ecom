'use client'

import { useRouter } from 'next/navigation'

function getScrollContainer(): Element | null {
  if (typeof document === 'undefined') return null
  return document.getElementById('admin-main')
}

function getScrollY(): number {
  const el = getScrollContainer()
  return el ? el.scrollTop : window.scrollY
}

function setScrollY(y: number) {
  const el = getScrollContainer()
  if (el) el.scrollTop = y
  else window.scrollTo(0, y)
}

export function useScrollPreservingRefresh() {
  const router = useRouter()

  return () => {
    const y = getScrollY()
    router.refresh()
    setTimeout(() => setScrollY(y), 50)
    setTimeout(() => setScrollY(y), 200)
    setTimeout(() => setScrollY(y), 400)
  }
}
