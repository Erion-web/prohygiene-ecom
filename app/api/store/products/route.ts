import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchShopProductsPage } from '@/lib/shop/products'
import { parseShopListParams, SHOP_PAGE_SIZE } from '@/lib/shop/query'
import { applyPriceGate, getGatedBrandIds } from '@/lib/store/price-gate'
import { getAuthUser } from '@/lib/supabase/auth'

export async function GET(request: NextRequest) {
  const sp = Object.fromEntries(request.nextUrl.searchParams.entries())
  const filters = parseShopListParams(sp)
  const pageSize = Math.min(
    Math.max(parseInt(sp.pageSize ?? '', 10) || SHOP_PAGE_SIZE, 1),
    48,
  )

  const supabase = await createClient()
  const [{ products, total, error }, user, gatedBrandIds] = await Promise.all([
    fetchShopProductsPage(supabase, filters, pageSize),
    getAuthUser(),
    getGatedBrandIds(),
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    products: applyPriceGate(products, gatedBrandIds, !!user),
    total,
    page: filters.page,
    pageSize,
    hasMore: filters.page * pageSize < total,
  })
}
