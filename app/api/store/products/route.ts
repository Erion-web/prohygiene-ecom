import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchShopProductsPage } from '@/lib/shop/products'
import { parseShopListParams, SHOP_PAGE_SIZE } from '@/lib/shop/query'

export async function GET(request: NextRequest) {
  const sp = Object.fromEntries(request.nextUrl.searchParams.entries())
  const filters = parseShopListParams(sp)
  const pageSize = Math.min(
    Math.max(parseInt(sp.pageSize ?? '', 10) || SHOP_PAGE_SIZE, 1),
    48,
  )

  const supabase = await createClient()
  const { products, total, error } = await fetchShopProductsPage(supabase, filters, pageSize)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    products,
    total,
    page: filters.page,
    pageSize,
    hasMore: filters.page * pageSize < total,
  })
}
