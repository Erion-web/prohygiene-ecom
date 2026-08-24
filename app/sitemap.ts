import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const APP_URL = 'https://prohygiene.shop'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const [productsRes, categoriesRes, campaignsRes] = await Promise.all([
    supabase.from('products').select('slug, updated_at').eq('is_active', true).eq('listing_type', 'sale'),
    supabase.from('categories').select('slug, updated_at').eq('is_active', true),
    supabase.from('campaigns').select('slug, updated_at').eq('is_active', true),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: APP_URL,                       lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${APP_URL}/shop`,             lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${APP_URL}/business`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${APP_URL}/campaigns`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${APP_URL}/home-products`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${APP_URL}/contact`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${APP_URL}/about`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const productPages: MetadataRoute.Sitemap = (productsRes.data ?? []).map(p => ({
    url: `${APP_URL}/product/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  const categoryPages: MetadataRoute.Sitemap = (categoriesRes.data ?? []).map(c => ({
    url: `${APP_URL}/shop?category=${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly',
    priority: 0.75,
  }))

  const campaignPages: MetadataRoute.Sitemap = (campaignsRes.data ?? []).map(c => ({
    url: `${APP_URL}/campaigns/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [...staticPages, ...productPages, ...categoryPages, ...campaignPages]
}
