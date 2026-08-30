import { z } from 'zod'

const uuid = z.string().uuid()

export const newsletterFormSchema = z.object({
  subject: z.string().trim().min(1, 'Subjekti është i detyrueshëm').max(200),
  message: z.string().trim().min(1, 'Mesazhi është i detyrueshëm').max(20000),
})

export const deviceMaterialRowSchema = z.object({
  material_id: uuid,
  capacity: z.number().positive('Kapaciteti duhet të jetë më i madh se 0'),
})

export const saveProductSchema = z.object({
  id: uuid.optional(),
  sku: z.string().trim().min(1, 'SKU mungon'),
  name_sq: z.string().trim().min(1, 'Emri mungon'),
  name_en: z.string().trim().optional().default(''),
  slug: z.string().trim().min(1, 'Slug mungon'),
  description_sq: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  audience_type: z.enum(['home', 'business', 'both']),
  for_sale: z.boolean(),
  for_lease: z.boolean(),
  price: z.number().finite().nonnegative('Çmimi invalid'),
  sale_price: z.number().finite().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative(),
  unit: z.enum(['cope', 'pako', 'ml']),
  vat_rate: z.number().finite().min(0).max(100),
  brand_id: z.string().uuid().optional().nullable(),
  is_featured: z.boolean(),
  is_best_seller: z.boolean(),
  is_active: z.boolean(),
  is_material: z.boolean(),
  images: z.array(z.string()).max(5),
  device_materials: z.array(deviceMaterialRowSchema).optional().default([]),
}).superRefine((data, ctx) => {
  if (!data.for_sale && !data.for_lease && !data.is_material) {
    ctx.addIssue({ code: 'custom', message: 'Zgjidhni Shitje, Shfrytëzim, Lëndë e parë, ose një kombinim' })
  }
  if (data.is_material && !data.category_id) {
    ctx.addIssue({ code: 'custom', message: 'Zgjidhni kategorinë për lëndën e parë', path: ['category_id'] })
  }
})

export const contractDeviceRowSchema = z.object({
  product_id: uuid,
  quantity: z.number().int().min(1),
  location: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
})

export const contractMaterialRowSchema = z.object({
  material_id: uuid,
  quantity: z.number().finite().nonnegative(),
})

export const saveContractSchema = z.object({
  id: uuid.optional(),
  contract_number: z.number().int().min(1).optional(),
  client_id: uuid,
  duration_months: z.number().int().min(1),
  starts_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ends_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  device_count: z.number().int().min(1),
  employee_count: z.number().int().nonnegative(),
  monthly_fee: z.number().finite().nonnegative(),
  reminder_period: z.enum(['week', 'month']),
  surplus_days: z.number().int().nonnegative(),
  expected_consumption: z.number().finite().nonnegative(),
  consumption_unit: z.enum(['cope', 'pako', 'ml']),
  consumption_period: z.enum(['week', 'month']),
  status: z.enum(['draft', 'active', 'expired', 'cancelled']),
  notes: z.string().optional().nullable(),
  devices: z.array(contractDeviceRowSchema).default([]),
  materials: z.array(contractMaterialRowSchema).default([]),
}).superRefine((data, ctx) => {
  if (data.ends_at <= data.starts_at) {
    ctx.addIssue({ code: 'custom', message: 'Data e mbarimit duhet të jetë pas fillimit', path: ['ends_at'] })
  }
})

export const saveCampaignSchema = z.object({
  id: uuid.optional(),
  title_sq: z.string().trim().min(1),
  title_en: z.string().trim().optional().default(''),
  description_sq: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  slug: z.string().trim().min(1),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().finite().positive(),
  audience_type: z.enum(['home', 'business', 'both']),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  is_active: z.boolean(),
  show_on_homepage: z.boolean(),
  product_ids: z.array(uuid).default([]),
}).superRefine((data, ctx) => {
  if (new Date(data.ends_at) <= new Date(data.starts_at)) {
    ctx.addIssue({ code: 'custom', message: 'Data e mbarimit duhet të jetë pas fillimit', path: ['ends_at'] })
  }
})

export const recordRefillSchema = z.object({
  deployed_device_id: uuid,
  material_id: uuid,
  amount: z.number().finite().positive(),
  capacity: z.number().finite().positive().optional().nullable(),
})

export const customerFormSchema = z.object({
  full_name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().optional().default(''),
  city: z.string().trim().min(1),
  address: z.string().trim().optional().default(''),
  customer_type: z.enum(['individual', 'business']),
  business_name: z.string().trim().optional().default(''),
  fiscal_number: z.string().trim().optional().default(''),
  is_lease: z.boolean().optional().default(false),
})

export type SaveProductInput = z.infer<typeof saveProductSchema>
export type SaveContractInput = z.infer<typeof saveContractSchema>
export type SaveCampaignInput = z.infer<typeof saveCampaignSchema>
export type RecordRefillInput = z.infer<typeof recordRefillSchema>
export type CustomerFormInput = z.infer<typeof customerFormSchema>
