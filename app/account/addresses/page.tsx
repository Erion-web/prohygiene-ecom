import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { AddressManager } from './AddressManager'

export default async function AddressesPage() {
  const supabase = await createClient()
  const user = await getAuthUser()
  if (!user) redirect('/auth/login?redirect=/account/addresses')

  const { data: addresses } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-text-primary">Adresat e Mia</h1>
        <p className="text-text-muted text-sm mt-0.5">
          Ruani adresa të shumta. Gjatë blerjes mund të zgjidhni adresën ose të fusni një tjetër.
        </p>
      </div>
      <AddressManager addresses={addresses ?? []} userId={user.id} />
    </div>
  )
}
