import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Campaign } from '@/types'
import type { Lang } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface CampaignBannerProps {
  campaign: Campaign
  lang: Lang
  variant?: 'hero' | 'card' | 'mini'
  className?: string
}

export function CampaignBanner({ campaign, lang, variant = 'card', className }: CampaignBannerProps) {
  const title = lang === 'sq' ? campaign.title_sq : campaign.title_en
  const description = lang === 'sq' ? campaign.description_sq : campaign.description_en
  const discountLabel = campaign.discount_type === 'percentage'
    ? `-${campaign.discount_value}%`
    : `-€${campaign.discount_value}`

  if (variant === 'mini') {
    return (
      <Link href={`/campaigns/${campaign.slug}`} className="group flex items-center gap-3 p-3 bg-gradient-to-r from-brand-50 to-white rounded-xl border border-brand-100 hover:border-brand-300 transition-all duration-200">
        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
          <Tag size={18} className="text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{title}</p>
          <p className="text-xs text-text-muted">{lang === 'sq' ? 'Deri' : 'Until'} {new Date(campaign.ends_at).toLocaleDateString(lang === 'sq' ? 'sq-AL' : 'en-GB')}</p>
        </div>
        <Badge variant="sale">{discountLabel}</Badge>
      </Link>
    )
  }

  if (variant === 'hero') {
    return (
      <div className={cn(
        'relative overflow-hidden rounded-3xl',
        'bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900',
        className
      )}>
        {campaign.banner_url && (
          <Image src={campaign.banner_url} alt={title} fill className="object-cover opacity-20" />
        )}
        <div className="relative z-10 p-8 md:p-12">
          <Badge variant="sale" className="mb-4 text-sm px-3 py-1">
            {lang === 'sq' ? 'Kampanjë Aktive' : 'Active Campaign'}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">{title}</h2>
          {description && (
            <p className="text-brand-100 text-lg mb-6 max-w-lg">{description}</p>
          )}
          <Link
            href={`/campaigns/${campaign.slug}`}
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors duration-200"
          >
            {lang === 'sq' ? 'Shiko Ofertën' : 'View Offer'}
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="absolute right-8 top-8 md:right-12 md:top-12 text-right">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30">
            <p className="text-white/70 text-sm font-medium">{lang === 'sq' ? 'Zbritje deri në' : 'Discount up to'}</p>
            <p className="text-white text-5xl font-black">{discountLabel}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link href={`/campaigns/${campaign.slug}`} className="group block">
      <div className={cn(
        'relative overflow-hidden rounded-2xl border border-surface-border',
        'hover:shadow-elevated transition-all duration-300 hover:-translate-y-0.5',
        className
      )}>
        {campaign.banner_url ? (
          <div className="aspect-[16/7] relative">
            <Image src={campaign.banner_url} alt={title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <Badge variant="sale" className="mb-2 w-fit">{discountLabel}</Badge>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              {description && <p className="text-white/80 text-sm mt-1 line-clamp-1">{description}</p>}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-gradient-to-br from-brand-50 to-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="sale" className="mb-3">{discountLabel}</Badge>
                <h3 className="text-lg font-bold text-text-primary">{title}</h3>
                {description && (
                  <p className="text-text-secondary text-sm mt-1 line-clamp-2">{description}</p>
                )}
              </div>
              <ArrowRight size={20} className="text-brand-500 flex-shrink-0 mt-1 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
