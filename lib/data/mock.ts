import type { Product, Category } from '@/types'

const now = new Date().toISOString()

export const mockCategories: Category[] = [
  {
    id: 'cat-1', name_sq: 'Detergjentë', name_en: 'Detergents', slug: 'detergjente',
    description_sq: null, description_en: null, image_url: null,
    parent_id: null, audience_type: 'both', sort_order: 1, is_active: true,
    created_at: now, updated_at: now,
  },
  {
    id: 'cat-2', name_sq: 'Dezinfektues', name_en: 'Disinfectants', slug: 'dezinfektues',
    description_sq: null, description_en: null, image_url: null,
    parent_id: null, audience_type: 'both', sort_order: 2, is_active: true,
    created_at: now, updated_at: now,
  },
  {
    id: 'cat-3', name_sq: 'Higjiena Personale', name_en: 'Personal Hygiene', slug: 'higjiena-personale',
    description_sq: null, description_en: null, image_url: null,
    parent_id: null, audience_type: 'home', sort_order: 3, is_active: true,
    created_at: now, updated_at: now,
  },
  {
    id: 'cat-4', name_sq: 'Pastrimi i Shtëpisë', name_en: 'Home Cleaning', slug: 'pastrimi-shtepia',
    description_sq: null, description_en: null, image_url: null,
    parent_id: null, audience_type: 'home', sort_order: 4, is_active: true,
    created_at: now, updated_at: now,
  },
  {
    id: 'cat-5', name_sq: 'HORECA & Profesional', name_en: 'HORECA & Professional', slug: 'horeca-profesional',
    description_sq: null, description_en: null, image_url: null,
    parent_id: null, audience_type: 'business', sort_order: 5, is_active: true,
    created_at: now, updated_at: now,
  },
  {
    id: 'cat-6', name_sq: 'Letra Higjienike', name_en: 'Hygiene Paper', slug: 'letra-higjienike',
    description_sq: null, description_en: null, image_url: null,
    parent_id: null, audience_type: 'both', sort_order: 6, is_active: true,
    created_at: now, updated_at: now,
  },
  {
    id: 'cat-7', name_sq: 'Aromë & Ajri', name_en: 'Fragrance & Air', slug: 'arome-ajri',
    description_sq: null, description_en: null, image_url: null,
    parent_id: null, audience_type: 'both', sort_order: 7, is_active: true,
    created_at: now, updated_at: now,
  },
  {
    id: 'cat-8', name_sq: 'Aksesorë Pastrimi', name_en: 'Cleaning Accessories', slug: 'aksesore-pastrimi',
    description_sq: null, description_en: null, image_url: null,
    parent_id: null, audience_type: 'both', sort_order: 8, is_active: true,
    created_at: now, updated_at: now,
  },
]

export const mockProducts: Product[] = []

export const mockFeaturedProducts = mockProducts.filter(p => p.is_featured)
export const mockBestSellers = mockProducts.filter(p => p.is_best_seller)
