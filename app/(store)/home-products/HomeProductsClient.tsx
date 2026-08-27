'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { ProductCard } from '@/components/store/ProductCard'
import { shopListSearchParams, type ShopListFilters } from '@/lib/shop/query'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import type { Product } from '@/types'

interface HomeProductsClientProps {
  initialProducts: Product[]
  total: number
  pageSize: number
  filters: ShopListFilters
}

export function HomeProductsClient({
  initialProducts,
  total: initialTotal,
  pageSize,
  filters,
}: HomeProductsClientProps) {
  const { lang } = useLanguageStore()
  const tr = t(lang)
  const [products, setProducts] = useState(initialProducts)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialTotal)
  const [loadingMore, setLoadingMore] = useState(false)

  const hasMore = products.length < total

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    const qs = shopListSearchParams({ ...filters, page: nextPage })
    try {
      const res = await fetch(`/api/store/products?${qs}&pageSize=${pageSize}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json() as { products: Product[]; total: number }
      setProducts(prev => [...prev, ...data.products])
      setPage(nextPage)
      setTotal(data.total)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary">
          Të Gjitha Produktet ({total})
        </h2>
        <Link href="/shop?audience_type=home" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
          {lang === 'sq' ? 'Shiko në dyqan' : 'View in shop'}
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="btn-secondary px-8 py-3 gap-2"
          >
            {loadingMore && <Loader2 size={16} className="animate-spin" />}
            {tr.shop.loadMore}
          </button>
        </div>
      )}
    </div>
  )
}
