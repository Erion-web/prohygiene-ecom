import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { mockProducts } from '@/lib/data/mock'
import { createPublicClient } from '@/lib/supabase/public'
import { getProductBySlug } from '@/lib/store/catalog'
import { applyPriceGate, getGatedBrandIds } from '@/lib/store/price-gate'
import { getAuthUser } from '@/lib/supabase/auth'
import { ProductPageClient } from './ProductPageClient'
import type { Product } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

// getAuthUser is React.cache()-wrapped and getProductBySlug/getGatedBrandIds
// are unstable_cache-wrapped, so calling this from both generateMetadata and
// the page component costs nothing extra — but the gating itself must happen
// out here, per-request, never inside those caches (which are shared across
// all visitors regardless of who's logged in).
async function getProduct(slug: string): Promise<Product | null> {
  let product: Product | null = null
  try {
    product = await getProductBySlug(slug)
  } catch {}
  if (!product) product = mockProducts.find(p => p.slug === slug) ?? null
  if (!product) return null

  const [user, gatedBrandIds] = await Promise.all([getAuthUser(), getGatedBrandIds()])
  return applyPriceGate([product], gatedBrandIds, !!user)[0]
}

async function getRelatedProducts(product: Product): Promise<Product[]> {
  let related: Product[] = []
  try {
    const { data } = await createPublicClient()
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .eq('category_id', product.category_id ?? '')
      .neq('id', product.id)
      .eq('listing_type', (product.listing_type ?? 'sale') === 'sale' ? 'sale' : 'lease')
      .limit(4)
    if (data && data.length > 0) related = data as Product[]
  } catch {}
  if (related.length === 0) {
    related = mockProducts.filter(p => p.category_id === product.category_id && p.id !== product.id).slice(0, 4)
  }

  const [user, gatedBrandIds] = await Promise.all([getAuthUser(), getGatedBrandIds()])
  return applyPriceGate(related, gatedBrandIds, !!user)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Produkt i Pagjendur' }

  const url = `https://prohygiene.shop/product/${product.slug}`
  const title = `${product.name_sq} — Bli Online | ProHygiene`
  const description = product.description_sq
    ? product.description_sq.slice(0, 155)
    : product.price_hidden
      ? `${product.name_sq} — dërgim 24h në tërë Kosovën. Kyçuni për të parë çmimin. Produkte origjinale, cilësi e garantuar.`
      : `Bli ${product.name_sq} online — dërgim 24h në tërë Kosovën. ${product.sale_price ? `Çmimi special: €${product.sale_price}` : `Çmimi: €${product.price}`}. Produkte origjinale, cilësi e garantuar.`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: product.image_url ? [{ url: product.image_url, alt: product.name_sq }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.image_url ? [product.image_url] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const related = await getRelatedProducts(product)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name_sq,
    description: product.description_sq ?? product.name_sq,
    image: product.image_url ?? undefined,
    sku: product.sku,
    brand: product.brand ? { '@type': 'Brand', name: (product.brand as { name: string }).name } : undefined,
    // Omit pricing entirely from structured data for gated products — a price
    // shouldn't leak into Google rich snippets when the page itself won't show one.
    offers: product.price_hidden ? undefined : {
      '@type': 'Offer',
      url: `https://prohygiene.shop/product/${product.slug}`,
      priceCurrency: 'EUR',
      price: product.sale_price ?? product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'ProHygiene' },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: product.price >= 30 ? '0' : '3', currency: 'EUR' },
        deliveryTime: { '@type': 'ShippingDeliveryTime', businessDays: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2 } },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'XK' },
      },
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductPageClient product={product} relatedProducts={related} />
    </>
  )
}
