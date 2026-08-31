export type Lang = 'sq' | 'en'

export type AudienceType = 'home' | 'business' | 'both'

export type PackageAudience = 'home' | 'office' | 'horeca'

export type OrderStatus = 'pending' | 'processing' | 'completed'

export type PaymentStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'needs_clarification'

export type PaymentMethod = 'card' | 'cash_on_delivery'

export type DiscountType = 'percentage' | 'fixed'

export type UserRole = 'customer' | 'admin' | 'manager'

export type CustomerType = 'individual' | 'business'

export type ListingType = 'sale' | 'lease'

export type MaterialUnit = 'ml' | 'cope' | 'pako'

export type LeasePaymentStatus = 'paid' | 'unpaid' | 'danger'

export type LeaseContractStatus = 'draft' | 'active' | 'expired' | 'cancelled'

export type ReminderPeriod = 'week' | 'month'

export type DeployedDeviceStatus = 'active' | 'maintenance' | 'retired'

export type LeaseInquiryStatus = 'new' | 'contacted' | 'closed'

export type LeaseNotificationType = 'consumption' | 'contract_expiry'

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
  listing_type: ListingType
  available_for_lease: boolean
  price: number
  sale_price: number | null
  stock: number
  unit: string
  image_url: string | null
  gallery_urls: string[]
  is_featured: boolean
  is_best_seller: boolean
  is_active: boolean
  is_material: boolean
  vat_rate: number
  meta_title_sq: string | null
  meta_title_en: string | null
  meta_description_sq: string | null
  meta_description_en: string | null
  created_at: string
  updated_at: string
  category?: Category | null
  brand?: Brand | null
  device_materials?: DeviceMaterial[]
  campaign_id?: string | null
  campaign_title_sq?: string | null
  campaign_title_en?: string | null
  discount_type?: DiscountType | null
  discount_value?: number | null
  effective_price?: number | null
}

export interface Material {
  id: string
  product_id: string | null
  category_id: string
  name_sq: string
  name_en: string
  material_type: string | null
  description_sq: string | null
  description_en: string | null
  unit: MaterialUnit
  is_active: boolean
  created_at: string
  updated_at: string
  category?: Category | null
}

export interface DeviceMaterial {
  id: string
  product_id: string
  material_id: string
  capacity: number
  created_at: string
  material?: Material | null
}

export interface LeaseClientAddress {
  id: string
  client_id: string
  label: string
  city: string
  address: string
  is_primary: boolean
  created_at: string
}

export interface LeaseClient {
  id: string
  profile_id: string | null
  company_name: string
  contact_name: string
  email: string
  phone: string | null
  city: string | null
  address: string | null
  employee_count: number
  payment_status: LeasePaymentStatus
  notes: string | null
  created_at: string
  updated_at: string
  addresses?: LeaseClientAddress[]
}

export interface LeaseContract {
  id: string
  contract_number: number | null
  client_id: string
  duration_months: number
  starts_at: string
  ends_at: string
  device_count: number
  employee_count: number
  monthly_fee: number
  reminder_period: ReminderPeriod
  surplus_days: number
  expected_consumption: number
  consumption_unit: MaterialUnit
  consumption_period: ReminderPeriod
  status: LeaseContractStatus
  notes: string | null
  created_at: string
  updated_at: string
  client?: LeaseClient | null
  contract_devices?: ContractDevice[]
  contract_materials?: ContractMaterial[]
}

export interface ContractDevice {
  id: string
  contract_id: string
  product_id: string
  quantity: number
  created_at: string
  product?: Product | null
}

export interface ContractMaterial {
  id: string
  contract_id: string
  material_id: string
  quantity: number
  created_at: string
  material?: Material | null
}

export interface DeployedDevice {
  id: string
  contract_id: string
  client_id: string
  product_id: string
  location_label: string
  city: string | null
  address: string | null
  installed_at: string
  status: DeployedDeviceStatus
  created_at: string
  updated_at: string
  contract?: LeaseContract | null
  client?: LeaseClient | null
  product?: Product | null
  consumable_levels?: DeviceConsumableLevel[]
}

export interface DeviceConsumableLevel {
  id: string
  deployed_device_id: string
  material_id: string
  capacity: number
  current_level: number
  last_refilled_at: string
  created_at: string
  updated_at: string
  material?: Material | null
}

export interface RefillEvent {
  id: string
  deployed_device_id: string
  material_id: string
  amount: number
  notes: string | null
  refilled_by: string | null
  created_at: string
}

export interface LeaseInquiry {
  id: string
  product_id: string | null
  name: string
  email: string
  phone: string | null
  company: string | null
  message: string | null
  status: LeaseInquiryStatus
  created_at: string
  updated_at: string
  product?: Product | null
}

export interface LeaseNotification {
  id: string
  notification_type: LeaseNotificationType
  deployed_device_id: string | null
  contract_id: string | null
  material_id: string | null
  client_id: string | null
  title: string
  message: string
  due_date: string | null
  email_sent: boolean
  created_at: string
  client?: LeaseClient | null
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

export interface HomepagePackage {
  id: string
  audience: PackageAudience
  image_url: string
  is_active: boolean
  created_at: string
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
  listing_type?: ListingType
  min_price?: number
  max_price?: number
  on_sale?: boolean
  in_stock?: boolean
  search?: string
  featured?: boolean
  best_seller?: boolean
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'best_sellers' | 'featured'
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
