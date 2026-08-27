export type LeaseDeviceOption = {
  id: string
  name_sq: string
  sku: string
  group: string
}

export type LeaseDeviceRow = {
  id: string
  name_sq: string
  sku: string
  category?: { name_sq: string } | { name_sq: string }[] | null
}

export const LEASE_DEVICE_QUERY = `
  id, name_sq, sku,
  category:categories(name_sq)
`

function one<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export function toLeaseDeviceOptions(rows: LeaseDeviceRow[]): LeaseDeviceOption[] {
  return rows.map(p => ({
    id: p.id,
    name_sq: p.name_sq,
    sku: p.sku,
    group: one(p.category)?.name_sq ?? 'Pa kategori',
  }))
}

export function groupLeaseDevices(devices: LeaseDeviceOption[]): [string, LeaseDeviceOption[]][] {
  const map = new Map<string, LeaseDeviceOption[]>()
  for (const d of devices) {
    const list = map.get(d.group) ?? []
    list.push(d)
    map.set(d.group, list)
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, 'sq'))
}
