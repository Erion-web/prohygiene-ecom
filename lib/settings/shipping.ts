export interface ShippingSettings {
  cost: number
  free_threshold: number
}

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = { cost: 3, free_threshold: 30 }

export function parseShippingSettings(value: unknown): ShippingSettings {
  const v = (value ?? {}) as Partial<Record<keyof ShippingSettings, unknown>>
  const cost = Number(v.cost)
  const threshold = Number(v.free_threshold)
  return {
    cost: Number.isFinite(cost) && cost >= 0 ? cost : DEFAULT_SHIPPING_SETTINGS.cost,
    free_threshold:
      Number.isFinite(threshold) && threshold >= 0 ? threshold : DEFAULT_SHIPPING_SETTINGS.free_threshold,
  }
}

export function calcShipping(amount: number, s: ShippingSettings): number {
  return amount >= s.free_threshold ? 0 : s.cost
}
