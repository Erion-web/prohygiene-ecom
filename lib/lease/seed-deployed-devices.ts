import type { SupabaseClient } from '@supabase/supabase-js'

export async function seedDeployedDevices(
  supabase: SupabaseClient,
  params: {
    contractId: string
    clientId: string
    startsAt: string
    devices: Array<{ product_id: string; quantity: string; location?: string; city?: string; address?: string }>
  }
) {
  const valid = params.devices.filter(row => row.product_id)
  if (valid.length === 0) return null

  const [{ data: existing }, { data: client }] = await Promise.all([
    supabase
      .from('deployed_devices')
      .select('id, product_id')
      .eq('contract_id', params.contractId),
    supabase.from('lease_clients').select('city, address').eq('id', params.clientId).maybeSingle(),
  ])

  const haveByProduct = new Map<string, number>()
  for (const row of existing ?? []) {
    haveByProduct.set(row.product_id, (haveByProduct.get(row.product_id) ?? 0) + 1)
  }

  const toInsert: Array<{
    contract_id: string
    client_id: string
    product_id: string
    location_label: string
    city: string | null
    address: string | null
    installed_at: string
    status: 'active'
  }> = []

  for (const row of valid) {
    const qty = Math.max(1, parseInt(row.quantity, 10) || 1)
    const have = haveByProduct.get(row.product_id) ?? 0
    const missing = Math.max(0, qty - have)
    const base = row.location?.trim()
    for (let i = 0; i < missing; i++) {
      const n = have + i + 1
      toInsert.push({
        contract_id: params.contractId,
        client_id: params.clientId,
        product_id: row.product_id,
        location_label: base ? (qty > 1 ? `${base} ${n}` : base) : `Pajisje ${n}`,
        city: row.city || client?.city || null,
        address: row.address || client?.address || null,
        installed_at: params.startsAt,
        status: 'active',
      })
    }
  }

  if (toInsert.length === 0) return null

  const { data: created, error } = await supabase
    .from('deployed_devices')
    .insert(toInsert)
    .select('id, product_id')
  if (error) return error

  const createdRows = created ?? []
  const productIds = Array.from(new Set(createdRows.map(row => row.product_id)))
  if (productIds.length === 0) return null
  const { data: materials } = await supabase
    .from('device_materials')
    .select('product_id, material_id, capacity')
    .in('product_id', productIds)

  const levels = createdRows.flatMap(device =>
    (materials ?? [])
      .filter(m => m.product_id === device.product_id)
      .map(m => ({
        deployed_device_id: device.id,
        material_id: m.material_id,
        capacity: m.capacity,
        current_level: m.capacity,
        last_refilled_at: new Date().toISOString(),
      }))
  )

  if (levels.length > 0) {
    const { error: levelErr } = await supabase.from('device_consumable_levels').insert(levels)
    if (levelErr) return levelErr
  }

  return null
}
