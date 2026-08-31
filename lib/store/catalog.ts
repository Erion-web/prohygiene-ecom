import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { mockBestSellers, mockCategories, mockFeaturedProducts } from '@/lib/data/mock'
import type { Category, HomepagePackage, Product } from '@/types'

export const getActiveCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const { data } = await createPublicClient()
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    return (data ?? []) as Category[]
  },
  ['store-active-categories'],
  { revalidate: 120, tags: ['categories'] }
)

export const getHomeCatalog = unstable_cache(
  async () => {
    const supabase = createPublicClient()
    const [productsRes, categoriesRes, bannersRes, packagesRes] = await Promise.all([
      supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_active', true)
        .eq('listing_type', 'sale')
        .order('created_at', { ascending: false })
        .limit(24),
      supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('banners')
        .select('id, image_url, campaign:campaigns(slug, title_sq, title_en, ends_at)')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('homepage_packages')
        .select('id, audience, image_url, is_active, created_at')
        .eq('is_active', true),
    ])
    const categories = (categoriesRes.data ?? []) as Category[]

    const products = (productsRes.data ?? []) as Product[]
    const featured = products.filter(p => p.is_featured).slice(0, 8)
    const bestSellers = products.filter(p => p.is_best_seller).slice(0, 8)

    return {
      featured: featured.length > 0 ? featured : mockFeaturedProducts,
      bestSellers: bestSellers.length > 0 ? bestSellers : mockBestSellers,
      categories: categories.length > 0 ? categories : mockCategories,
      banners: (bannersRes.data ?? []).map(b => ({
        ...b,
        campaign: Array.isArray(b.campaign) ? (b.campaign[0] ?? null) : (b.campaign ?? null),
      })),
      packages: ((packagesRes.error ? [] : packagesRes.data) ?? []) as HomepagePackage[],
    }
  },
  ['store-home-catalog'],
  { revalidate: 60, tags: ['catalog', 'categories'] }
)

export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<Product | null> => {
    const { data } = await createPublicClient()
      .from('products')
      .select('*, category:categories(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()
    return (data as Product | null) ?? null
  },
  ['store-product-by-slug'],
  { revalidate: 60, tags: ['catalog'] }
)
