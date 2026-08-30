import { NextResponse } from 'next/server'
import { requireAdmin, sanitizeSearch } from '@/lib/admin/require-admin'
import { CITIES } from '@/lib/cities'
import { LEASE_DEVICE_QUERY, toLeaseDeviceOptions, type LeaseDeviceRow } from '@/lib/lease/device-select'

const TYPES = ['clients', 'devices', 'materials', 'contracts', 'cities', 'categories', 'brands', 'products'] as const
type OptionType = (typeof TYPES)[number]

export async function GET(req: Request) {
  const { supabase, authorized } = await requireAdmin()
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const type = url.searchParams.get('type') as OptionType | null
  const q = sanitizeSearch(url.searchParams.get('q') ?? '')
  if (!type || !TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  if (type === 'cities') {
    const options = CITIES
      .filter(city => !q || city.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 40)
      .map(city => ({ value: city, label: city }))
    return NextResponse.json({ options })
  }

  if (type === 'clients') {
    let query = supabase.from('lease_clients').select('id, company_name').order('company_name').limit(40)
    if (q) query = query.ilike('company_name', `%${q}%`)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      options: (data ?? []).map(row => ({ value: row.id, label: row.company_name })),
    })
  }

  if (type === 'devices') {
    let query = supabase
      .from('products')
      .select(LEASE_DEVICE_QUERY)
      .eq('available_for_lease', true)
      .eq('is_active', true)
      .order('name_sq')
      .limit(40)
    if (q) query = query.or(`name_sq.ilike.%${q}%,sku.ilike.%${q}%`)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      options: toLeaseDeviceOptions((data ?? []) as LeaseDeviceRow[]).map(d => ({
        value: d.id,
        label: `${d.name_sq} (${d.sku})`,
        group: d.group,
      })),
    })
  }

  if (type === 'materials') {
    let query = supabase
      .from('products')
      .select('id, name_sq, unit, material:materials!product_id(id)')
      .eq('is_material', true)
      .eq('is_active', true)
      .order('name_sq')
      .limit(40)
    if (q) query = query.or(`name_sq.ilike.%${q}%,sku.ilike.%${q}%`)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      options: (data ?? []).flatMap(row => {
        const material = Array.isArray(row.material) ? row.material[0] : row.material
        if (!material?.id) return []
        return [{ value: material.id as string, label: `${row.name_sq} (${row.unit})` }]
      }),
    })
  }

  if (type === 'contracts') {
    let clientIds: string[] | null = null
    if (q) {
      const { data: matches } = await supabase
        .from('lease_clients')
        .select('id')
        .ilike('company_name', `%${q}%`)
        .limit(40)
      clientIds = (matches ?? []).map(row => row.id)
      if (clientIds.length === 0) return NextResponse.json({ options: [] })
    }
    let query = supabase
      .from('lease_contracts')
      .select('id, status, client:lease_clients(company_name)')
      .order('created_at', { ascending: false })
      .limit(40)
    if (clientIds) query = query.in('client_id', clientIds)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      options: (data ?? []).map(row => {
        const client = Array.isArray(row.client) ? row.client[0] : row.client
        const name = (client as { company_name?: string } | null)?.company_name ?? `Kontratë ${row.id.slice(0, 8)}`
        return { value: row.id, label: `${name} · ${row.status}` }
      }),
    })
  }

  if (type === 'products') {
    let query = supabase
      .from('products')
      .select('id, sku, name_sq')
      .eq('is_active', true)
      .order('name_sq')
      .limit(40)
    if (q) query = query.or(`name_sq.ilike.%${q}%,sku.ilike.%${q}%`)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      options: (data ?? []).map(row => ({ value: row.id, label: `${row.name_sq} (${row.sku})` })),
    })
  }

  if (type === 'categories') {
    let query = supabase.from('categories').select('id, name_sq').eq('is_active', true).order('name_sq').limit(40)
    if (q) query = query.ilike('name_sq', `%${q}%`)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      options: (data ?? []).map(row => ({ value: row.id, label: row.name_sq })),
    })
  }

  let query = supabase.from('brands').select('id, name').eq('is_active', true).order('name').limit(40)
  if (q) query = query.ilike('name', `%${q}%`)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    options: (data ?? []).map(row => ({ value: row.id, label: row.name })),
  })
}
