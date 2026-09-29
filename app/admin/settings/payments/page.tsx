import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { PaymentToggleCard } from '../PaymentToggleCard'

export default async function SettingsPaymentsPage() {
  const supabase = await createClient()
  const { data: pmRow } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'payment_methods')
    .single()

  const paymentMethods = (pmRow?.value ?? { card: true, cash_on_delivery: true }) as {
    card: boolean
    cash_on_delivery: boolean
  }

  return (
    <>
      <AdminHeader title="Cilësimet" subtitle="Pagesa dhe metodat e checkout" />
      <PaymentToggleCard initialMethods={paymentMethods} />
    </>
  )
}
