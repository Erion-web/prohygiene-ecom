export const PRODUCTS_PAGE_SIZE = 20

export type ProductListFilters = {
  q: string
  categoryId: string
  brandId: string
  audience: string
  status: string
  stock: string
  listingType: string
  material: string
  onSale: boolean
  featured: boolean
  bestSeller: boolean
  page: number
}

function first(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key]
  return (Array.isArray(value) ? value[0] : value) ?? ""
}

export function parseProductListParams(
  sp: Record<string, string | string[] | undefined>
): ProductListFilters {
  const page = Math.max(1, parseInt(first(sp, "page"), 10) || 1)
  return {
    q: first(sp, "q").trim(),
    categoryId: first(sp, "category"),
    brandId: first(sp, "brand"),
    audience: first(sp, "audience"),
    status: first(sp, "status"),
    stock: first(sp, "stock"),
    listingType: first(sp, "listing"),
    material: first(sp, "material"),
    onSale: first(sp, "sale") === "1",
    featured: first(sp, "featured") === "1",
    bestSeller: first(sp, "bestseller") === "1",
    page,
  }
}

export function productListSearchParams(filters: ProductListFilters) {
  const params = new URLSearchParams()
  if (filters.q) params.set("q", filters.q)
  if (filters.categoryId) params.set("category", filters.categoryId)
  if (filters.brandId) params.set("brand", filters.brandId)
  if (filters.audience) params.set("audience", filters.audience)
  if (filters.status) params.set("status", filters.status)
  if (filters.stock) params.set("stock", filters.stock)
  if (filters.listingType) params.set("listing", filters.listingType)
  if (filters.material) params.set("material", filters.material)
  if (filters.onSale) params.set("sale", "1")
  if (filters.featured) params.set("featured", "1")
  if (filters.bestSeller) params.set("bestseller", "1")
  if (filters.page > 1) params.set("page", String(filters.page))
  return params.toString()
}

export function sanitizeProductSearch(q: string) {
  return q.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80)
}

export function hasProductListFilters(filters: ProductListFilters) {
  return Boolean(
    filters.q ||
      filters.categoryId ||
      filters.brandId ||
      filters.audience ||
      filters.status ||
      filters.stock ||
      filters.listingType ||
      filters.material ||
      filters.onSale ||
      filters.featured ||
      filters.bestSeller
  )
}
