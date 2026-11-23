export const STALE_HOURS = 48

export type AttentionOrder = {
  id: string
  order_number: string
  customer_name: string
  total: number
  created_at: string
  updated_at: string
  status: 'pending' | 'processing' | 'completed'
  payment_method: 'card' | 'cash_on_delivery'
  payment_status: 'pending' | 'approved' | 'declined' | 'cancelled' | 'needs_clarification'
  falcon_order_id: string | null
  falcon_status_name: string | null
}

export type AttentionGroupKey = 'new' | 'stale' | 'unsent' | 'payment' | 'shipping'

export type AttentionGroup = {
  key: AttentionGroupKey
  label: string
  hint: string
  count: number
  orders: Array<Pick<AttentionOrder, 'id' | 'order_number' | 'customer_name' | 'total' | 'created_at'> & { note?: string }>
}

// Falcon status names are free text; "delivered" is matched heuristically.
export function isFalconDelivered(name: string | null): boolean {
  return !!name && /dor[eë]z|deliver|^\s*sukses/i.test(name) && !/pa dor[eë]z|jo dor[eë]z|undeliver/i.test(name)
}

export function computeAttention(orders: AttentionOrder[], now = Date.now()): AttentionGroup[] {
  const cutoff = now - STALE_HOURS * 3600_000
  const groups: Record<AttentionGroupKey, AttentionGroup['orders']> = {
    new: [], stale: [], unsent: [], payment: [], shipping: [],
  }
  const slim = (o: AttentionOrder, note?: string) => ({
    id: o.id, order_number: o.order_number, customer_name: o.customer_name,
    total: Number(o.total), created_at: o.created_at, note,
  })

  for (const o of orders) {
    const paymentDead = o.payment_status === 'declined' || o.payment_status === 'cancelled'
    const delivered = isFalconDelivered(o.falcon_status_name)
    const created = new Date(o.created_at).getTime()
    const updated = new Date(o.updated_at).getTime()

    if (o.status === 'pending' && !paymentDead) {
      if (created < cutoff) groups.stale.push(slim(o))
      else groups.new.push(slim(o))
    }
    if (o.status === 'processing' && !o.falcon_order_id && updated < cutoff) {
      groups.unsent.push(slim(o, 'Në përpunim, pa u dërguar te posta'))
    }
    if (delivered && o.status !== 'completed') {
      groups.shipping.push(slim(o, `Posta: ${o.falcon_status_name}, porosia nuk është e përfunduar`))
    }
    const payOpen = o.payment_status === 'pending' || o.payment_status === 'needs_clarification'
    if (
      (payOpen && (o.status === 'completed' || delivered)) ||
      o.payment_status === 'needs_clarification'
    ) {
      groups.payment.push(slim(o, o.payment_status === 'needs_clarification' ? 'Pagesa kërkon sqarim' : 'Dorëzuar, pagesa ende në pritje'))
    }
  }

  const def: Array<Omit<AttentionGroup, 'count' | 'orders'>> = [
    { key: 'new', label: 'Të reja, pa u përpunuar', hint: 'Statusi: Në pritje' },
    { key: 'stale', label: `Pa u marrë ${STALE_HOURS}h+`, hint: 'Në pritje më shumë se 48 orë' },
    { key: 'unsent', label: 'Pa u dërguar te posta', hint: 'Në përpunim 48h+ pa Falcon' },
    { key: 'shipping', label: 'Statusi i porosisë i harruar', hint: 'Posta e ka dorëzuar, porosia jo e përfunduar' },
    { key: 'payment', label: 'Statusi i pagesës i harruar', hint: 'Dorëzuar ose për sqarim, pagesa jo e përditësuar' },
  ]
  return def
    .map(d => {
      const list = groups[d.key].sort((a, b) => a.created_at.localeCompare(b.created_at))
      return { ...d, count: list.length, orders: list.slice(0, 6) }
    })
    .filter(g => g.count > 0)
}
