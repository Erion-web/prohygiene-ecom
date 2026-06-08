import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/store/ProductCard'
import { Badge } from '@/components/ui/Badge'
import { Clock, Tag } from 'lucide-react'

interface Props { params: { slug: string } }

async function getCampaign(slug: string) {
  const supabase = await createClient()
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  if (!campaign) return null

  const { data: cp } = await supabase
    .from('campaign_products')
    .select('product:products(*, category:categories(*))')
    .eq('campaign_id', campaign.id)

  const products = cp?.map(r => r.product).filter(Boolean) ?? []
  return { campaign, products }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getCampaign(params.slug)
  if (!data) return { title: 'Kampanjë | ProHygiene' }
  return { title: `${data.campaign.title_sq} | ProHygiene` }
}

export default async function CampaignPage({ params }: Props) {
  const data = await getCampaign(params.slug)
  if (!data) notFound()
  const { campaign, products } = data

  const endsAt = new Date(campaign.ends_at)
  const now = new Date()
  const hoursLeft = Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60)))
  const discountLabel = campaign.discount_type === 'percentage'
    ? `-${campaign.discount_value}%`
    : `-€${campaign.discount_value}`

  return (
    <div className="animate-fade-in">
      {/* Campaign Hero */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-900 py-16">
        <div className="container-custom text-center">
          <Badge variant="sale" className="mb-4 text-base px-4 py-1.5">{discountLabel}</Badge>
          <h1 className="text-4xl font-extrabold text-white mb-3">{campaign.title_sq}</h1>
          {campaign.description_sq && (
            <p className="text-brand-100 text-lg max-w-xl mx-auto mb-6">{campaign.description_sq}</p>
          )}
          <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-xl px-4 py-2.5 text-white text-sm">
            <Clock size={16} />
            {hoursLeft > 0
              ? `${hoursLeft} orë të mbetura`
              : `Skadon ${endsAt.toLocaleDateString('sq-AL')}`}
          </div>
        </div>
      </section>

      <div className="container-custom py-10">
        <div className="flex items-center gap-3 mb-6">
          <Tag size={20} className="text-text-muted" />
          <h2 className="text-xl font-bold text-text-primary">
            Produktet e Ofertës ({products.length})
          </h2>
        </div>

        {products.length === 0 ? (
          <p className="text-text-muted text-center py-16">Nuk ka produkte në këtë kampanjë.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
