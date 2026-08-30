import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendLeaseReminderEmail } from '@/lib/email'
import {
  shouldAlertConsumption,
  shouldAlertContractExpiry,
  daysUntilContractEnd,
  daysUntilEmpty,
  dailyConsumptionRate,
} from '@/lib/lease/utils'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const today = new Date().toISOString().slice(0, 10)
  let created = 0
  let emailsSent = 0

  const { data: deployedDevices } = await supabase
    .from('deployed_devices')
    .select(`
      id,
      location_label,
      client:lease_clients(id, company_name, email),
      product:products(name_sq),
      contract:lease_contracts(
        id, expected_consumption, consumption_period, surplus_days, ends_at, status
      ),
      consumable_levels:device_consumable_levels(
        id, material_id, capacity, current_level, last_refilled_at,
        material:materials(name_sq, unit)
      )
    `)
    .eq('status', 'active')

  for (const device of deployedDevices ?? []) {
    const contract = Array.isArray(device.contract) ? device.contract[0] : device.contract
    const client = Array.isArray(device.client) ? device.client[0] : device.client
    const product = Array.isArray(device.product) ? device.product[0] : device.product

    if (!contract || contract.status !== 'active') continue

    const levels = device.consumable_levels ?? []
    for (const level of levels) {
      const material = Array.isArray(level.material) ? level.material[0] : level.material
      if (!material) continue

      const needsAlert = shouldAlertConsumption({
        currentLevel: level.current_level,
        expectedConsumption: contract.expected_consumption,
        consumptionPeriod: contract.consumption_period,
        surplusDays: contract.surplus_days,
        lastRefilledAt: level.last_refilled_at,
      })

      if (!needsAlert) continue

      const dailyRate = dailyConsumptionRate(contract.expected_consumption, contract.consumption_period)
      const daysLeft = daysUntilEmpty(level.current_level, dailyRate)
      const dueDate = today
      const title = `Rimbushje e nevojshme — ${product?.name_sq ?? 'Pajisje'}`
      const message = `${client?.company_name ?? 'Klient'} · ${device.location_label}\nMateriali: ${material.name_sq}\nNiveli: ${level.current_level}/${level.capacity} ${material.unit}${daysLeft !== null ? `\n~${Math.round(daysLeft)} ditë të mbetura` : ''}`

      const { data: inserted, error } = await supabase
        .from('lease_notifications')
        .insert({
          notification_type: 'consumption',
          deployed_device_id: device.id,
          contract_id: contract.id,
          material_id: level.material_id,
          client_id: client?.id ?? null,
          title,
          message,
          due_date: dueDate,
          email_sent: false,
        })
        .select('id')
        .maybeSingle()

      if (error?.code === '23505') continue
      if (error) {
        console.error('[cron/lease-reminders] insert error:', error)
        continue
      }

      if (inserted) {
        created++
        await sendLeaseReminderEmail({
          to: 'info@prohygiene.shop',
          subject: title,
          title,
          message,
        })
        if (client?.email) {
          await sendLeaseReminderEmail({
            to: client.email,
            subject: title,
            title,
            message,
          })
        }
        await supabase.from('lease_notifications').update({ email_sent: true }).eq('id', inserted.id)
        emailsSent++
      }
    }
  }

  const { data: expiringContracts } = await supabase
    .from('lease_contracts')
    .select('id, ends_at, client:lease_clients(id, company_name, contact_name, email, phone)')
    .eq('status', 'active')

  for (const contract of expiringContracts ?? []) {
    if (!shouldAlertContractExpiry(contract.ends_at)) continue

    const client = Array.isArray(contract.client) ? contract.client[0] : contract.client
    const daysLeft = daysUntilContractEnd(contract.ends_at)
    const title = `Kontrata po skadon — ${client?.company_name ?? 'Klient'}`
    const message = `Kontrata e shfrytëzimit për ${client?.company_name ?? 'klientin'} skadon më ${contract.ends_at} (mbeten ${daysLeft} ditë).${client?.contact_name ? `\nKontakti: ${client.contact_name}` : ''}${client?.email ? `\nEmail: ${client.email}` : ''}${client?.phone ? `\nTel: ${client.phone}` : ''}`

    const { data: inserted, error } = await supabase
      .from('lease_notifications')
      .insert({
        notification_type: 'contract_expiry',
        contract_id: contract.id,
        client_id: client?.id ?? null,
        title,
        message,
        due_date: contract.ends_at,
        email_sent: false,
      })
      .select('id')
      .maybeSingle()

    if (error?.code === '23505') continue
    if (error) {
      console.error('[cron/lease-reminders] expiry insert error:', error)
      continue
    }

    if (!inserted) continue

    created++
    await sendLeaseReminderEmail({
      to: 'info@prohygiene.shop',
      subject: title,
      title,
      message,
    })
    await supabase.from('lease_notifications').update({ email_sent: true }).eq('id', inserted.id)
    emailsSent++
  }

  return NextResponse.json({ ok: true, notifications_created: created, emails_sent: emailsSent })
}
