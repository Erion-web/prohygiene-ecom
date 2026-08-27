import {
  Bug,
  Building2,
  Brush,
  Droplets,
  Factory,
  Home,
  ScrollText,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Wind,
  type LucideIcon,
} from 'lucide-react'

const BY_SLUG: Record<string, LucideIcon> = {
  'pastrimi-shtepia': Home,
  'higjiena-personale': Sparkles,
  'detergjente': Droplets,
  'dezinfektues': ShieldCheck,
  'leter-tissue': ScrollText,
  'letra-higjienike': ScrollText,
  'pajiset-pastrimit': Brush,
  'pajisjet-pastrimit': Brush,
  'aksesore-pastrimi': Brush,
  'aromatizim': Wind,
  'arome-ajri': Wind,
  'pastrimi-industrial': Factory,
  'furnitura-hoteli': Building2,
  'horeca-profesional': Building2,
}

const BY_KEYWORD: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /\bddd\b|deratiz|dezinsekt/, icon: Bug },
  { match: /aromat|arome|ajri|fragrance|air[- ]?care/, icon: Wind },
  { match: /pajis|aksesor|vegla|equipment|brush/, icon: Brush },
  { match: /leter|letra|tissue|paper/, icon: ScrollText },
  { match: /higjien|personal/, icon: Sparkles },
  { match: /detergjen|lar[eë]s/, icon: Droplets },
  { match: /dezinfekt/, icon: ShieldCheck },
  { match: /sht[eë]pi|home/, icon: Home },
  { match: /industrial/, icon: Factory },
  { match: /hotel|horeca|furnitur/, icon: Building2 },
  { match: /dezinfektim/, icon: SprayCan },
]

export function getCategoryIcon(category: {
  slug?: string | null
  name_sq?: string | null
  name_en?: string | null
}): LucideIcon {
  const slug = category.slug?.toLowerCase().trim() ?? ''
  if (slug && BY_SLUG[slug]) return BY_SLUG[slug]

  const haystack = [slug, category.name_sq, category.name_en]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  for (const rule of BY_KEYWORD) {
    if (rule.match.test(haystack)) return rule.icon
  }

  return SprayCan
}
