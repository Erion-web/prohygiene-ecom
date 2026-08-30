import { z } from 'zod'

const uuid = z.string().uuid()

export const orderItemInputSchema = z.object({
  product_id: uuid,
  quantity: z.number().int().min(1).max(99),
})

export const createOrderSchema = z.object({
  customer_name: z.string().trim().min(1).max(200),
  customer_email: z.string().trim().email().max(320),
  customer_phone: z.string().trim().min(3).max(40),
  customer_type: z.enum(['individual', 'business']),
  business_name: z.string().trim().max(200).optional().nullable(),
  fiscal_number: z.string().trim().max(50).optional().nullable(),
  city: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(2000).optional().nullable(),
  payment_method: z.enum(['card', 'cash_on_delivery']),
  items: z.array(orderItemInputSchema).min(1).max(50),
})

export const createPaymentSchema = z.object({
  order_id: uuid,
  order_number: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(320).optional(),
  lang: z.string().max(10).optional(),
  customer_name: z.string().trim().max(200).optional(),
})

export const subscriptionItemSchema = z.object({
  productId: uuid,
  quantity: z.number().int().min(1).max(99),
})

export const createSubscriptionSchema = z.object({
  items: z.array(subscriptionItemSchema).min(1).max(50),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  next_order_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const contactFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
})

export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().email().max(320),
})

export const leaseInquirySchema = z.object({
  product_id: uuid.optional().nullable(),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional().nullable(),
  company: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().max(5000).optional().nullable(),
})

export const newsletterSendSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(20000),
  emails: z.array(z.string().trim().email()).min(1).max(2000),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type OrderItemInput = z.infer<typeof orderItemInputSchema>
