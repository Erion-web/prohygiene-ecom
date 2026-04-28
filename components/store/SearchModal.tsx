'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowRight, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUICK_SEARCHES = ['Detergjent', 'Dezinfektues', 'Sapun', 'Pastrues', 'Letër tualeti', 'Gel duarsh']

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Drive a two-phase mount so CSS transitions fire
  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      // Small delay lets the element mount before we start the transition
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
      const t = setTimeout(() => setQuery(''), 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // ESC to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const navigate = (term: string) => {
    router.push(`/shop?search=${encodeURIComponent(term.trim())}`)
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) navigate(query.trim())
  }

  if (!isOpen && !visible) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] transition-all duration-300',
        isOpen && visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Kërko produkte"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Search panel — slides down from top */}
      <div
        className={cn(
          'relative bg-white/98 backdrop-blur-2xl shadow-2xl border-b border-surface-border',
          'transition-transform duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
          isOpen && visible ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="container-custom py-5 pb-6">
          {/* Input row */}
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <Search size={22} className="text-brand-500 flex-shrink-0" strokeWidth={2.2} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Kërko produktin, kategorinë..."
              className="flex-1 text-xl md:text-2xl font-semibold text-text-primary placeholder:text-text-muted/60 bg-transparent outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors duration-200 flex-shrink-0"
              >
                Kërko
                <ArrowRight size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Mbyll kërkimin"
              className="p-2.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-muted transition-all duration-200 flex-shrink-0"
            >
              <X size={20} />
            </button>
          </form>

          {/* Quick search suggestions */}
          <div className="mt-5 pt-4 border-t border-surface-border">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} className="text-text-muted" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Kërko shpejt
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_SEARCHES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => navigate(s)}
                  className="text-sm font-medium px-4 py-1.5 bg-brand-50 text-brand-700 border border-brand-100 rounded-full hover:bg-brand-100 hover:border-brand-200 transition-all duration-150"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
