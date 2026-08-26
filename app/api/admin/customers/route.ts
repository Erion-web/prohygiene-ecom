import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isCity } from '@/lib/cities'
import { requireAdmin } from '@/lib/admin/require-admin'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

type AddressInput = { id?: string; label?: string; city?: string; address?: string; is_primary?: boolean }

async function replaceLeaseAddresses(clientId: string, addresses: AddressInput[]) {
  const service = serviceClient()
  await service.from('lease_client_addresses').delete().eq('client_id', clientId)
  const rows = addresses
    .map((a, i) => ({
      client_id: clientId,
      label: String(a.label ?? '').trim() || (i === 0 ? 'Kryesore' : `Adresa ${i + 1}`),
      city: String(a.city ?? '').trim(),
      address: String(a.address ?? '').trim(),
      is_primary: a.is_primary === true || i === 0,
    }))
    .filter(a => a.city)
  if (rows.length === 0) return null
  const { error } = await service.from('lease_client_addresses').insert(rows)
  return error
}

export async function POST(req: Request) {
  const { authorized } = await requireAdmin()
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const full_name = String(body.full_name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const phone = String(body.phone ?? '').trim()
  const city = String(body.city ?? '').trim()
  const address = String(body.address ?? '').trim()
  const customer_type = body.customer_type === 'business' ? 'business' : 'individual'
  const business_name = String(body.business_name ?? '').trim()
  const fiscal_number = String(body.fiscal_number ?? '').trim()
  const is_lease = body.is_lease === true

  if (!full_name || !email || !city) {
    return NextResponse.json({ error: 'Emri, email dhe qyteti janë të detyrueshëm' }, { status: 400 })
  }
  if (!isCity(city)) {
    return NextResponse.json({ error: 'Zgjidhni një qytet nga lista' }, { status: 400 })
  }

  const service = serviceClient()
  const password = `${crypto.randomUUID()}${crypto.randomUUID()}`

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? 'Klienti nuk u krijua' }, { status: 400 })
  }

  const profileId = created.user.id
  const profilePayload = {
    id: profileId,
    email,
    full_name,
    phone: phone || null,
    city,
    address: address || null,
    customer_type,
    business_name: customer_type === 'business' ? (business_name || null) : null,
    fiscal_number: customer_type === 'business' ? (fiscal_number || null) : null,
    role: 'customer',
  }

  const { data: existing } = await service.from('profiles').select('id').eq('id', profileId).maybeSingle()
  const { error: profileError } = existing
    ? await service.from('profiles').update(profilePayload).eq('id', profileId)
    : await service.from('profiles').insert(profilePayload)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  if (is_lease) {
    const { data: lease, error: leaseError } = await service.from('lease_clients').insert({
      profile_id: profileId,
      company_name: business_name || full_name,
      contact_name: full_name,
      email,
      phone: phone || null,
      city,
      address: address || null,
      employee_count: 0,
      payment_status: 'paid',
    }).select('id').single()
    if (leaseError) {
      return NextResponse.json({ error: leaseError.message }, { status: 400 })
    }
    const addrErr = await replaceLeaseAddresses(lease.id, [{ label: 'Kryesore', city, address, is_primary: true }])
    if (addrErr) return NextResponse.json({ error: addrErr.message }, { status: 400 })
  }

  return NextResponse.json({ id: profileId })
}

export async function PATCH(req: Request) {
  const { authorized } = await requireAdmin()
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const kind = body.kind === 'lease' ? 'lease' : 'profile'
  const id = String(body.id ?? '')
  if (!id) return NextResponse.json({ error: 'ID mungon' }, { status: 400 })

  const full_name = String(body.full_name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const phone = String(body.phone ?? '').trim()
  const city = String(body.city ?? '').trim()
  const address = String(body.address ?? '').trim()
  const customer_type = body.customer_type === 'business' ? 'business' : 'individual'
  const business_name = String(body.business_name ?? '').trim()
  const fiscal_number = String(body.fiscal_number ?? '').trim()
  const addresses = Array.isArray(body.addresses) ? (body.addresses as AddressInput[]) : []

  if (!full_name || !email) {
    return NextResponse.json({ error: 'Emri dhe email janë të detyrueshëm' }, { status: 400 })
  }

  const service = serviceClient()

  if (kind === 'profile') {
    const { error } = await service.from('profiles').update({
      full_name,
      email,
      phone: phone || null,
      city: city || null,
      address: address || null,
      customer_type,
      business_name: customer_type === 'business' ? (business_name || null) : null,
      fiscal_number: customer_type === 'business' ? (fiscal_number || null) : null,
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const { data: lease } = await service.from('lease_clients').select('id').eq('profile_id', id).maybeSingle()
    if (lease) {
      const { error: leaseErr } = await service.from('lease_clients').update({
        company_name: business_name || full_name,
        contact_name: full_name,
        email,
        phone: phone || null,
        city: city || null,
        address: address || null,
      }).eq('id', lease.id)
      if (leaseErr) return NextResponse.json({ error: leaseErr.message }, { status: 400 })
      const addrErr = await replaceLeaseAddresses(lease.id, addresses.length ? addresses : [{ city, address, is_primary: true }])
      if (addrErr) return NextResponse.json({ error: addrErr.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  }

  const { error } = await service.from('lease_clients').update({
    company_name: business_name || full_name,
    contact_name: full_name,
    email,
    phone: phone || null,
    city: city || null,
    address: address || null,
  }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  const addrErr = await replaceLeaseAddresses(id, addresses.length ? addresses : [{ city, address, is_primary: true }])
  if (addrErr) return NextResponse.json({ error: addrErr.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { authorized } = await requireAdmin()
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const kind = url.searchParams.get('kind') === 'lease' ? 'lease' : 'profile'
  const id = url.searchParams.get('id') ?? ''
  if (!id) return NextResponse.json({ error: 'ID mungon' }, { status: 400 })

  const service = serviceClient()
  const leaseId = kind === 'lease'
    ? id
    : (await service.from('lease_clients').select('id').eq('profile_id', id).maybeSingle()).data?.id

  if (leaseId) {
    const { count } = await service
      .from('lease_contracts')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', leaseId)
    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'Ky klient ka kontrata. Fshini kontratat së pari.' }, { status: 400 })
    }
    const { error } = await service.from('lease_clients').delete().eq('id', leaseId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (kind === 'profile') {
    const { error: profileErr } = await service.from('profiles').delete().eq('id', id)
    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 400 })
    await service.auth.admin.deleteUser(id)
  }

  return NextResponse.json({ ok: true })
}
