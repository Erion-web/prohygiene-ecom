import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import {
  formatRefillAmount,
  type ContractActivity,
  type ContractActivityEvent,
  type ContractDeviceChoice,
  type ContractRefillMonth,
} from '@/lib/lease/contract-activity'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  active: 'Aktive',
  expired: 'Skaduar',
  cancelled: 'Anuluar',
  pending: 'Në pritje',
  processing: 'Në proces',
  completed: 'Përfunduar',
}

function litersFromAmount(amount: number, unit: string) {
  return unit === 'ml' ? amount / 1000 : 0
}

function monthKey(iso: string) {
  const date = new Date(iso)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export async function loadContractActivity(contractId: string): Promise<ContractActivity> {
  const supabase = await createClient()
  const { data: contract } = await supabase
    .from('lease_contracts')
    .select('id, client_id, status, monthly_fee, duration_months, starts_at, ends_at, created_at, updated_at, notes, client:lease_clients(id, email, company_name, profile_id)')
    .eq('id', contractId)
    .maybeSingle()

  if (!contract) {
    return { events: [], months: [], devices: [], totalCount: 0, totalLiters: 0, totalMl: 0, orderCount: 0 }
  }

  const client = asOne(contract.client) as {
    id: string
    email: string
    company_name: string
    profile_id: string | null
  } | null

  const { data: deviceRows } = await supabase
    .from('deployed_devices')
    .select('id, location_label, installed_at, created_at, product:products(name_sq, sku), consumable_levels:device_consumable_levels(material_id, capacity, material:materials(id, name_sq, unit))')
    .eq('contract_id', contractId)
    .order('installed_at', { ascending: true })

  const devices: ContractDeviceChoice[] = (deviceRows ?? []).map(device => {
    const product = asOne(device.product) as { name_sq?: string; sku?: string } | null
    const levels = device.consumable_levels ?? []
    const materials = levels.flatMap(level => {
      const material = asOne(level.material) as { id?: string; name_sq?: string; unit?: string } | null
      if (!material?.id) return []
      return [{
        id: material.id,
        name_sq: material.name_sq || 'Material',
        unit: material.unit || 'ml',
        capacity: Number(level.capacity) || undefined,
      }]
    })
    return {
      id: device.id,
      label: `${product?.name_sq || 'Pajisje'} · ${device.location_label || '—'}`,
      materials,
    }
  })

  const deviceIds = devices.map(d => d.id)
  const { data: refills } = deviceIds.length > 0
    ? await supabase
        .from('refill_events')
        .select('id, created_at, amount, notes, deployed_device_id, material:materials(name_sq, unit)')
        .in('deployed_device_id', deviceIds)
        .order('created_at', { ascending: true })
    : { data: [] }

  const emails = new Set<string>()
  if (client?.email) emails.add(client.email.toLowerCase())
  if (client?.profile_id) {
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', client.profile_id).maybeSingle()
    if (profile?.email) emails.add(profile.email.toLowerCase())
  }

  const orderMap = new Map<string, { id: string; order_number: string; total: number; status: string; created_at: string; customer_name: string }>()
  if (emails.size > 0) {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, total, status, created_at, customer_name')
      .in('customer_email', [...emails])
      .order('created_at', { ascending: true })
      .limit(80)
    for (const row of data ?? []) {
      orderMap.set(row.id, { ...row, total: Number(row.total) })
    }
  }
  if (client?.profile_id) {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, total, status, created_at, customer_name')
      .eq('user_id', client.profile_id)
      .order('created_at', { ascending: true })
      .limit(80)
    for (const row of data ?? []) {
      orderMap.set(row.id, { ...row, total: Number(row.total) })
    }
  }
  const orders = Array.from(orderMap.values()).sort((a, b) => a.created_at.localeCompare(b.created_at))

  const events: ContractActivityEvent[] = []
  events.push({
    id: `created-${contract.id}`,
    kind: 'created',
    at: contract.created_at,
    title: 'Kontrata u krijua',
    detail: `${client?.company_name ?? 'Klienti'} · ${STATUS_LABELS[contract.status] ?? contract.status}`,
    meta: `${contract.duration_months} muaj · ${formatPrice(Number(contract.monthly_fee))} / muaj`,
  })

  if (contract.starts_at) {
    events.push({
      id: `started-${contract.id}`,
      kind: 'started',
      at: `${contract.starts_at}T08:00:00`,
      title: new Date(contract.starts_at) > new Date() ? 'Kontrata do të fillojë' : 'Kontrata filloi',
      detail: `Data e fillimit: ${new Date(contract.starts_at).toLocaleDateString('sq-AL')}`,
    })
  }

  const updatedMs = new Date(contract.updated_at).getTime()
  const createdMs = new Date(contract.created_at).getTime()
  if (updatedMs - createdMs > 4000) {
    events.push({
      id: `updated-${contract.id}-${contract.updated_at}`,
      kind: 'updated',
      at: contract.updated_at,
      title: 'Kontrata u përditësua',
      detail: `Statusi tani: ${STATUS_LABELS[contract.status] ?? contract.status}`,
      meta: `${formatPrice(Number(contract.monthly_fee))} / muaj · mbaron ${new Date(contract.ends_at).toLocaleDateString('sq-AL')}`,
    })
  }

  if (contract.ends_at) {
    const ended = new Date(contract.ends_at) <= new Date()
    events.push({
      id: `ending-${contract.id}`,
      kind: 'ending',
      at: `${contract.ends_at}T18:00:00`,
      title: ended ? 'Kontrata mbaroi' : 'Kontrata mbaron',
      detail: new Date(contract.ends_at).toLocaleDateString('sq-AL'),
    })
  }

  for (const device of deviceRows ?? []) {
    const product = asOne(device.product) as { name_sq?: string } | null
    events.push({
      id: `device-${device.id}`,
      kind: 'device',
      at: device.installed_at || device.created_at,
      title: 'Pajisja u vendos te klienti',
      detail: product?.name_sq || 'Pajisje',
      meta: device.location_label || undefined,
    })
  }

  const monthMap = new Map<string, ContractRefillMonth>()
  let totalLiters = 0
  let totalMl = 0

  for (const row of refills ?? []) {
    const material = asOne(row.material) as { name_sq?: string; unit?: string } | null
    const unit = material?.unit || 'ml'
    const amount = Number(row.amount)
    const device = devices.find(d => d.id === row.deployed_device_id)
    events.push({
      id: `refill-${row.id}`,
      kind: 'refill',
      at: row.created_at,
      title: 'Rimbushje e pajisjes',
      detail: `${material?.name_sq || 'Material'} · ${formatRefillAmount(amount, unit)}`,
      meta: device?.label,
    })

    const liters = litersFromAmount(amount, unit)
    const ml = unit === 'ml' ? amount : 0
    totalLiters += liters
    totalMl += ml
    const key = monthKey(row.created_at)
    const current = monthMap.get(key) ?? {
      key,
      label: new Date(row.created_at).toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' }),
      count: 0,
      liters: 0,
      ml: 0,
    }
    current.count += 1
    current.liters += liters
    current.ml += ml
    monthMap.set(key, current)
  }

  for (const order of orders) {
    events.push({
      id: `order-${order.id}`,
      kind: 'order',
      at: order.created_at,
      title: `Porosi nga web #${order.order_number}`,
      detail: `${order.customer_name} · ${formatPrice(order.total)}`,
      meta: STATUS_LABELS[order.status] ?? order.status,
    })
  }

  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  return {
    events,
    months: Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key)),
    devices,
    totalCount: (refills ?? []).length,
    totalLiters,
    totalMl,
    orderCount: orders.length,
  }
}
