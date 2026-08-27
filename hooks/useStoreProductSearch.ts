'use client'

import { useEffect, useState } from 'react'
import { useDebouncedValue } from '@tanstack/react-pacer'
import { createClient } from '@/lib/supabase/client'
import { searchStoreProducts, type StoreSearchProductRow } from '@/lib/search/store-products'

const MIN_QUERY_LENGTH = 2
const DEFAULT_LIMIT = 8

export function useStoreProductSearch(query: string, limit = DEFAULT_LIMIT) {
  const [debouncedQuery] = useDebouncedValue(query.trim(), { wait: 320 })
  const [results, setResults] = useState<StoreSearchProductRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      setResults([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    let cancelled = false
    setLoading(true)

    searchStoreProducts(supabase, debouncedQuery, limit)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setResults([])
        else setResults(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, limit])

  return {
    results,
    loading,
    debouncedQuery,
    hasQuery: debouncedQuery.length >= MIN_QUERY_LENGTH,
  }
}
