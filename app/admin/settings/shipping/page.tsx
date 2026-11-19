import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { parseShippingSettings } from '@/lib/settings/shipping'
import { ShippingCard } from '../ShippingCard'

export default async function SettingsShippingPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'shipping')
    .maybeSingle()

  return (
    <>
      <AdminHeader title="Cilësimet" subtitle="Çmimi i transportit" />
      <ShippingCard initial={parseShippingSettings(data?.value)} />
    </>
  )
}
