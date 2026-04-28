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

const makeProduct = (
  id: string, sku: string, nameSq: string, nameEn: string, slug: string,
  categoryId: string, categorySlug: string, price: number, salePrice: number | null,
  stock: number, featured: boolean, bestSeller: boolean, audience: 'home' | 'business' | 'both' = 'both'
): Product => {
  const cat = mockCategories.find(c => c.id === categoryId)!
  return {
    id, sku, name_sq: nameSq, name_en: nameEn, slug,
    description_sq: `${nameSq} — produkt i cilësisë së lartë për pastrim dhe higjienë profesionale.`,
    description_en: `${nameEn} — high quality product for professional cleaning and hygiene.`,
    category_id: categoryId,
    brand_id: null,
    category: cat,
    audience_type: audience,
    price, sale_price: salePrice,
    stock, unit: 'copë',
    image_url: null,
    gallery_urls: [],
    is_featured: featured,
    is_best_seller: bestSeller,
    is_active: true,
    vat_rate: 18,
    meta_title_sq: null, meta_title_en: null,
    meta_description_sq: null, meta_description_en: null,
    created_at: now, updated_at: now,
  }
}

export const mockProducts: Product[] = [
  makeProduct('p-1',  'DET-001', 'Detergjent Universal 5L',          'Universal Detergent 5L',        'detergjent-universal-5l',          'cat-1', 'detergjente',        4.50, 3.80, 150, true,  true),
  makeProduct('p-2',  'DET-002', 'Detergjent Enësh Lemon 1L',        'Lemon Dish Soap 1L',            'detergjent-enesh-lemon-1l',        'cat-1', 'detergjente',        1.80, null,  200, false, true),
  makeProduct('p-3',  'DEZ-001', 'Dezinfektues Sipërfaqesh 1L',      'Surface Disinfectant 1L',       'dezinfektues-siperfaqesh-1l',      'cat-2', 'dezinfektues',       3.20, 2.70, 180, true,  false),
  makeProduct('p-4',  'DEZ-002', 'Gel Dezinfektues Duarsh 500ml',    'Hand Sanitizer Gel 500ml',      'gel-dezinfektues-duarsh-500ml',    'cat-2', 'dezinfektues',       2.50, null,  300, false, true),
  makeProduct('p-5',  'HIG-001', 'Sapun i Lëngshëm Lulëborë 500ml', 'Snowflower Liquid Soap 500ml',  'sapun-lengshem-luleborë-500ml',    'cat-3', 'higjiena-personale', 2.20, 1.90, 250, true,  false, 'home'),
  makeProduct('p-6',  'HIG-002', 'Shampo Shtëpiake Familjar 1L',     'Family Home Shampoo 1L',        'shampo-shtepiake-familjar-1l',     'cat-3', 'higjiena-personale', 3.50, null,  120, false, false, 'home'),
  makeProduct('p-7',  'PSH-001', 'Pastrues Banjës Klorin 750ml',     'Bathroom Cleaner Chlorine 750ml','pastrues-banjes-klorin-750ml',    'cat-4', 'pastrimi-shtepia',   1.90, null,  220, false, true, 'home'),
  makeProduct('p-8',  'PSH-002', 'Cera Dyshemeje Parket 1L',        'Parquet Floor Wax 1L',          'cera-dyshemeje-parket-1l',         'cat-4', 'pastrimi-shtepia',   5.80, 4.90, 80,  true,  false, 'home'),
  makeProduct('p-9',  'HOR-001', 'Detergjent Industrial Makinë 10L', 'Industrial Machine Detergent 10L','detergjent-industrial-makine-10l','cat-5', 'horeca-profesional', 18.00,14.50, 60,  true,  false, 'business'),
  makeProduct('p-10', 'HOR-002', 'Dezinfektues Profesional HACCP 5L','HACCP Professional Disinfectant 5L','dezinfektues-profesional-haccp-5l','cat-5','horeca-profesional',24.00,null, 40,  false, true,  'business'),
  makeProduct('p-11', 'LET-001', 'Letër Tualeti Jumbo 6 copë',       'Jumbo Toilet Paper 6pcs',       'leter-tualeti-jumbo-6-cope',       'cat-6', 'letra-higjienike',   3.90, 3.20, 400, false, true),
  makeProduct('p-12', 'ARO-001', 'Parfum Ajri Lavandë 300ml',        'Lavender Air Freshener 300ml',  'parfum-ajri-lavande-300ml',        'cat-7', 'arome-ajri',         2.80, null,  160, true,  false),
]

export const mockFeaturedProducts = mockProducts.filter(p => p.is_featured)
export const mockBestSellers = mockProducts.filter(p => p.is_best_seller)
