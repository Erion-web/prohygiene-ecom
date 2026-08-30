import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin/require-admin'
import { applyOrderStockChange } from '@/lib/orders/apply-stock'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { authorized } = await requireAdmin()
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const service = serviceClient()
  const { data: order, error: fetchError } = await service
    .from('orders')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!order) return NextResponse.json({ error: 'Porosia nuk u gjet' }, { status: 404 })

  const stock = await applyOrderStockChange(service, id, order.status, 'pending')
  if (stock.error) return NextResponse.json({ error: stock.error }, { status: 500 })

  const { error } = await service.from('orders').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
