'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Droplets, ShieldCheck, Sparkles, Home, ChefHat,
  ScrollText, Wind, Brush, Box, ShoppingBag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category, Lang } from '@/types'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'detergjente':        Droplets,
  'dezinfektues':       ShieldCheck,
  'higjiena-personale': Sparkles,
  'pastrimi-shtepia':   Home,
  'horeca-profesional': ChefHat,
  'letra-higjienike':   ScrollText,
  'arome-ajri':         Wind,
  'aksesore-pastrimi':  Brush,
}

interface CategorySidebarNavProps {
  categories: Category[]
  lang: Lang
}

export function CategorySidebarNav({ categories, lang }: CategorySidebarNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSlug = searchParams.get('category')

  const isAllActive = pathname === '/shop' && !activeSlug

  return (
    <nav className="w-full">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-3 mb-2">
        {lang === 'sq' ? 'Kategoritë' : 'Categories'}
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
        <span className="flex-1 truncate">{lang === 'sq' ? 'Të Gjitha' : 'All Products'}</span>
      </Link>

      {categories.map(cat => {
        const name = lang === 'sq' ? cat.name_sq : cat.name_en
        const Icon = CATEGORY_ICONS[cat.slug] ?? Box
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
