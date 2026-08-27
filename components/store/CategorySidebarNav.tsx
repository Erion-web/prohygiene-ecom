'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCategoryIcon } from '@/lib/store/category-icons'
import { t } from '@/lib/i18n'
import type { Category, Lang } from '@/types'

interface CategorySidebarNavProps {
  categories: Category[]
  lang: Lang
}

export function CategorySidebarNav({ categories, lang }: CategorySidebarNavProps) {
  const tr = t(lang)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSlug = searchParams.get('category')

  const isAllActive = pathname === '/shop' && !activeSlug

  return (
    <nav className="w-full">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-3 mb-2">
        {tr.nav.categories}
      </p>

      <Link
        href="/shop"
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5',
          isAllActive
            ? 'bg-brand-600 text-white'
            : 'text-text-secondary hover:bg-brand-50 hover:text-brand-700'
        )}
      >
        <ShoppingBag size={16} className="flex-shrink-0" />
        <span className="flex-1 truncate">{tr.shop.allCategories}</span>
      </Link>

      {categories.map(cat => {
        const name = lang === 'sq' ? cat.name_sq : cat.name_en
        const Icon = getCategoryIcon(cat)
        const isActive = activeSlug === cat.slug

        return (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5',
              isActive
                ? 'bg-brand-600 text-white'
                : 'text-text-secondary hover:bg-brand-50 hover:text-brand-700'
            )}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="flex-1 truncate">{name}</span>
            {cat.products_count !== undefined && cat.products_count > 0 && (
              <span className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0',
                isActive ? 'bg-white/20 text-white' : 'bg-surface-muted text-text-muted'
              )}>
                {cat.products_count}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
