import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { mockProducts } from '@/lib/data/mock'
import { ProductPageClient } from './ProductPageClient'
import type { Product } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

const getProduct = cache(async function getProduct(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    if (data) return data
  } catch {}
  return mockProducts.find(p => p.slug === slug) ?? null
})

async function getRelatedProducts(product: Product): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .eq('category_id', product.category_id ?? '')
      .neq('id', product.id)
      .eq('listing_type', (product.listing_type ?? 'sale') === 'sale' ? 'sale' : 'lease')
      .limit(4)
    if (data && data.length > 0) return data
  } catch {}
  return mockProducts.filter(p => p.category_id === product.category_id && p.id !== product.id).slice(0, 4)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Produkt i Pagjendur' }

  const url = `https://prohygiene.shop/product/${product.slug}`
  const title = `${product.name_sq} — Bli Online | ProHygiene`
  const description = product.description_sq
    ? product.description_sq.slice(0, 155)
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
    offers: {
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
