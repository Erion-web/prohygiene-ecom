import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'
import type { Lang } from '@/types'

interface CategoryCardProps {
  category: Category
  lang: Lang
  className?: string
}

const categoryEmojis: Record<string, string> = {
  'pastrimi-shtepia': '🏠',
  'higjiena-personale': '🧼',
  'detergjente': '🧺',
  'pastrimi-industrial': '🏭',
  'dezinfektues': '🦠',
  'leter-tissue': '🧻',
  'furnitura-hoteli': '🏨',
  'pajiset-pastrimit': '🧹',
}

export function CategoryCard({ category, lang, className }: CategoryCardProps) {
  const name = lang === 'sq' ? category.name_sq : category.name_en

  return (
    <Link href={`/shop?category=${category.slug}`} className="group block">
      <div className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 to-white border border-brand-100',
        'hover:border-brand-200 hover:shadow-soft transition-all duration-300 hover:-translate-y-0.5',
        className
      )}>
        {category.image_url ? (
          <div className="aspect-[4/3] relative overflow-hidden">
            <Image
              src={category.image_url}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-sm">{name}</h3>
            </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-2xl">
              {categoryEmojis[category.slug] ?? '📦'}
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary group-hover:text-brand-600 transition-colors duration-200">
                {name}
              </h3>
              {category.products_count != null && (
                <p className="text-xs text-text-muted mt-0.5">
                  {category.products_count} {lang === 'sq' ? 'produkte' : 'products'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 text-brand-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span>{lang === 'sq' ? 'Shiko' : 'View'}</span>
              <ArrowRight size={12} />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
