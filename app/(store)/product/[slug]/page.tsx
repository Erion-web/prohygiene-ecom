import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { mockProducts } from '@/lib/data/mock'
import { ProductPageClient } from './ProductPageClient'
import type { Product } from '@/types'

interface Props {
  params: { slug: string }
}

async function getProduct(slug: string): Promise<Product | null> {
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
}

async function getRelatedProducts(product: Product): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .eq('category_id', product.category_id ?? '')
      .neq('id', product.id)
      .limit(4)
    if (data && data.length > 0) return data
  } catch {}
  return mockProducts.filter(p => p.category_id === product.category_id && p.id !== product.id).slice(0, 4)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug)
  if (!product) return { title: 'Produkt i Pagjendur' }
  return {
    title: `${product.name_sq} | ProHygiene`,
    description: product.description_sq?.slice(0, 160) ?? undefined,
  }
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug)
  if (!product) notFound()

  const related = await getRelatedProducts(product)

  return <ProductPageClient product={product} relatedProducts={related} />
}
