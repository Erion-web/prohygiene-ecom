'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowRight, TrendingUp, Loader2, Package } from 'lucide-react'
import { cn, formatPrice, getProductName } from '@/lib/utils'
import { useLanguageStore } from '@/store/language'
import { useStoreProductSearch } from '@/hooks/useStoreProductSearch'

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
  const { lang } = useLanguageStore()
  const { results, loading, hasQuery, debouncedQuery } = useStoreProductSearch(query, 8)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
      const t = setTimeout(() => setQuery(''), 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

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

  const openProduct = (slug: string) => {
    router.push(`/product/${slug}`)
    onClose()
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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative bg-slate-900/75 backdrop-blur-2xl shadow-2xl border-b border-white/10 text-white',
          'transition-transform duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
          isOpen && visible ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="container-custom py-5 pb-6 max-h-[min(85vh,720px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <Search size={22} className="text-brand-300 flex-shrink-0" strokeWidth={2.2} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Kërko produktin, kategorinë..."
              className="flex-1 text-xl md:text-2xl font-semibold text-white placeholder:text-white/45 bg-transparent outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            {loading && (
              <Loader2 size={20} className="text-brand-300 animate-spin flex-shrink-0" />
            )}
            {query && (
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors duration-200 flex-shrink-0"
              >
                Kërko
                <ArrowRight size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Mbyll kërkimin"
              className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 flex-shrink-0"
            >
              <X size={20} />
            </button>
          </form>

          {hasQuery && (
            <div className="mt-5 pt-4 border-t border-white/10">
              {!loading && results.length === 0 && (
                <p className="text-sm text-white/60 py-6 text-center">
                  Nuk u gjet asnjë produkt për &ldquo;{debouncedQuery}&rdquo;
                </p>
              )}

              {results.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                      Produktet
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(debouncedQuery)}
                      className="text-xs font-semibold text-brand-300 hover:text-brand-200 flex items-center gap-1"
                    >
                      Shiko të gjitha
                      <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    {results.map(product => {
                      const name = getProductName(product, lang)
                      const price = product.sale_price != null ? Number(product.sale_price) : Number(product.price)

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => openProduct(product.slug)}
                          className="w-full flex items-center gap-3 px-2 py-2.5 -mx-2 rounded-xl hover:bg-white/10 transition-colors text-left group"
                        >
                          <div className="relative w-11 h-11 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={name}
                                fill
                                className="object-contain p-1"
                                sizes="44px"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Package size={16} className="text-white/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate group-hover:text-brand-200">
                              {name}
                            </p>
                            <p className="text-xs text-white/45 font-mono truncate">{product.sku}</p>
                          </div>
                          <span className="text-sm font-semibold text-brand-300 flex-shrink-0">
                            {formatPrice(price)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {!hasQuery && (
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={13} className="text-white/45" />
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Kërko shpejt
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_SEARCHES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => navigate(s)}
                    className="text-sm font-medium px-4 py-1.5 bg-white/10 text-white border border-white/15 rounded-full hover:bg-white/15 hover:border-white/25 transition-all duration-150"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
