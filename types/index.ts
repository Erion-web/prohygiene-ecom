export type Lang = 'sq' | 'en'

export type AudienceType = 'home' | 'business' | 'both'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export type PaymentStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'needs_clarification'

export type PaymentMethod = 'card' | 'cash_on_delivery'

export type DiscountType = 'percentage' | 'fixed'

export type UserRole = 'customer' | 'admin' | 'manager'

export type CustomerType = 'individual' | 'business'

// ============================================================
// DATABASE TYPES
// ============================================================

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  city: string | null
  address: string | null
  role: UserRole
  customer_type: CustomerType
  business_name: string | null
  fiscal_number: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name_sq: string
  name_en: string
  slug: string
  description_sq: string | null
  description_en: string | null
  image_url: string | null
  parent_id: string | null
  audience_type: AudienceType
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Relations
  parent?: Category | null
  children?: Category[]
  products_count?: number
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  sku: string
  name_sq: string
  name_en: string
  slug: string
  description_sq: string | null
  description_en: string | null
  category_id: string | null
  brand_id: string | null
  audience_type: AudienceType
  price: number
  sale_price: number | null
  stock: number
  unit: string
  image_url: string | null
  gallery_urls: string[]
  is_featured: boolean
  is_best_seller: boolean
  is_active: boolean
  vat_rate: number
  meta_title_sq: string | null
  meta_title_en: string | null
  meta_description_sq: string | null
  meta_description_en: string | null
  created_at: string
  updated_at: string
  // Relations
  category?: Category | null
  brand?: Brand | null
  // From view
  campaign_id?: string | null
  campaign_title_sq?: string | null
  campaign_title_en?: string | null
  discount_type?: DiscountType | null
  discount_value?: number | null
  effective_price?: number | null
}

export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly'

export interface SubscriptionItem {
  id: string
  subscription_id: string
  product_id: string
  quantity: number
  product?: Product
}

export interface Subscription {
  id: string
  user_id: string
  name: string
  frequency: SubscriptionFrequency
  next_order_date: string
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
  items?: SubscriptionItem[]
}

export interface Campaign {
  id: string
  title_sq: string
  title_en: string
  description_sq: string | null
  description_en: string | null
  slug: string
  banner_url: string | null
  discount_type: DiscountType
  discount_value: number
  audience_type: AudienceType
  starts_at: string
  ends_at: string
  is_active: boolean
  show_on_homepage: boolean
  created_at: string
  updated_at: string
  // Relations
  products?: Product[]
  categories?: Category[]
}

export interface Order {
  id: string
  order_number: string
  user_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_type: CustomerType
  business_name: string | null
  fiscal_number: string | null
  city: string
  address: string
  notes: string | null
  subtotal: number
  discount_amount: number
  shipping_cost: number
  vat_amount: number
  total: number
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
  // Relations
  items?: OrderItem[]
  payment?: Payment | null
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name_sq: string
  product_name_en: string
  product_sku: string
  product_image_url: string | null
  unit_price: number
  sale_price: number | null
  quantity: number
  subtotal: number
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  payment_provider: string
  provider_order_id: string | null
  provider_payment_id: string | null
  amount: number
  currency: string
  status: PaymentStatus
  callback_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// ============================================================
// CART TYPES
// ============================================================

export interface CartItem {
  product: Product
  quantity: number
  effectivePrice: number
}

export interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getItemCount: () => number
  getDiscount: () => number
  getTotal: () => number
}

// ============================================================
// FORM TYPES
// ============================================================

export interface CheckoutFormData {
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_type: CustomerType
  business_name?: string
  fiscal_number?: string
  city: string
  address: string
  notes?: string
  payment_method: PaymentMethod
}

export interface ProductFormData {
  sku: string
  name_sq: string
  name_en: string
  slug: string
  description_sq: string
  description_en: string
  category_id: string
  audience_type: AudienceType
  price: number
  sale_price?: number | null
  stock: number
  unit: string
  image_url?: string | null
  gallery_urls: string[]
  is_featured: boolean
  is_best_seller: boolean
  is_active: boolean
  vat_rate: number
}

export interface CategoryFormData {
  name_sq: string
  name_en: string
  slug: string
  description_sq?: string
  description_en?: string
  parent_id?: string | null
  audience_type: AudienceType
  sort_order: number
  is_active: boolean
}

export interface CampaignFormData {
  title_sq: string
  title_en: string
  description_sq?: string
  description_en?: string
  slug: string
  banner_url?: string | null
  discount_type: DiscountType
  discount_value: number
  audience_type: AudienceType
  starts_at: string
  ends_at: string
  is_active: boolean
  show_on_homepage: boolean
  product_ids: string[]
  category_ids: string[]
}

// ============================================================
// FILTER / QUERY TYPES
// ============================================================

export interface ProductFilters {
  category?: string
  audience_type?: AudienceType
  min_price?: number
  max_price?: number
  on_sale?: boolean
  in_stock?: boolean
  search?: string
  featured?: boolean
  best_seller?: boolean
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'best_sellers'
  page?: number
  per_page?: number
}

// ============================================================
// IMPORT TYPES
// ============================================================

export interface ImportProductRow {
  sku: string
  name_sq: string
  name_en: string
  description_sq?: string
  description_en?: string
  category: string
  audience_type: AudienceType
  price: number
  stock: number
  unit: string
  image_url?: string
}

export interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; sku: string; error: string }>
}

// ============================================================
// PAYMENT TYPES
// ============================================================

export interface PayseraPaymentData {
  projectid: string
  orderid: string
  lang: string
  amount: string
  currency: string
  country: string
  accepturl: string
  cancelurl: string
  callbackurl: string
  payment: string
  version: string
  sign: string
  data: string
}
