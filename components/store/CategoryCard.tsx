import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCategoryIcon } from '@/lib/store/category-icons'
import { t } from '@/lib/i18n'
import type { Category } from '@/types'
import type { Lang } from '@/types'

interface CategoryCardProps {
  category: Category
  lang: Lang
  className?: string
}

export function CategoryCard({ category, lang, className }: CategoryCardProps) {
  const tr = t(lang)
  const name = lang === 'sq' ? category.name_sq : category.name_en
  const Icon = getCategoryIcon(category)

  return (
    <Link href={`/shop?category=${category.slug}`} className="group block">
      <div className={cn(
        'relative overflow-hidden rounded-2xl bg-white border border-surface-border',
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
          <div className="p-5 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
              <Icon size={22} strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-text-primary group-hover:text-brand-600 transition-colors duration-200 leading-snug">
                {name}
              </h3>
              {category.products_count != null && (
                <p className="text-xs text-text-muted mt-0.5">
                  {category.products_count} {tr.shop.products}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 text-brand-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span>{tr.common.view}</span>
              <ArrowRight size={12} />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
