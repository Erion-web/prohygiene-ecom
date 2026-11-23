import { z } from 'zod'

const unit = z.enum(['cope', 'pako', 'ml'])
const audience = z.enum(['home', 'business', 'both'])

export const createProductItem = z.object({
  type: z.literal('create_product'),
  name_sq: z.string().trim().min(1).max(200),
  name_en: z.string().trim().max(200).optional(),
  sku: z.string().trim().max(60).optional(),
  description_sq: z.string().trim().max(5000).optional(),
  description_en: z.string().trim().max(5000).optional(),
  price: z.number().finite().nonnegative(),
  sale_price: z.number().finite().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative().default(0),
  unit: unit.default('cope'),
  audience_type: audience.default('both'),
  category_name: z.string().trim().max(120).optional(),
  brand_name: z.string().trim().max(120).optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
})

export const updateProductItem = z.object({
  type: z.literal('update_product'),
  sku: z.string().trim().min(1).max(60),
  name_sq: z.string().trim().min(1).max(200).optional(),
  description_sq: z.string().trim().max(5000).optional(),
  price: z.number().finite().nonnegative().optional(),
  sale_price: z.number().finite().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative().optional(),
  audience_type: audience.optional(),
  category_name: z.string().trim().max(120).optional(),
  brand_name: z.string().trim().max(120).optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_best_seller: z.boolean().optional(),
})

export const updateOrderItem = z.object({
  type: z.literal('update_order'),
  order_number: z.string().trim().min(1).max(80),
  status: z.enum(['pending', 'processing', 'completed']).optional(),
  payment_status: z.enum(['pending', 'approved', 'declined', 'cancelled', 'needs_clarification']).optional(),
}).refine(o => o.status !== undefined || o.payment_status !== undefined, { message: 'Asnjë ndryshim' })

export const planItem = z.discriminatedUnion('type', [createProductItem, updateProductItem, updateOrderItem])
export const planSchema = z.array(planItem).min(1).max(100)

export type PlanItem = z.infer<typeof planItem>
export type CreateProductItem = z.infer<typeof createProductItem>
export type UpdateOrderItem = z.infer<typeof updateOrderItem>
export type UpdateProductItem = z.infer<typeof updateProductItem>
