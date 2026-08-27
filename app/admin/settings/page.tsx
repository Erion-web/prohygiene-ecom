import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { Globe, CreditCard, Bell, Shield } from 'lucide-react'
import { PaymentToggleCard } from './PaymentToggleCard'

export default async function SettingsAdminPage() {
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
    <div>
      <AdminHeader title="Cilësimet" subtitle="Konfiguro platformën ProHygiene" />
      <div className="admin-page max-w-5xl space-y-4">

        <PaymentToggleCard initialMethods={paymentMethods} />

        {[
          {
            icon: Globe,
            title: 'Gjuha & Lokalizimi',
            desc: 'Konfiguro gjuhën dhe rajonin e platformës',
            items: [
              { label: 'Gjuha kryesore', value: 'Shqip (sq-AL)' },
              { label: 'Gjuha dytësore', value: 'English (en)' },
              { label: 'Monedha', value: 'EUR (€)' },
              { label: 'Zona kohore', value: 'Europe/Pristina (UTC+1)' },
            ],
          },
          {
            icon: Bell,
            title: 'Njoftime',
            desc: 'Konfigurimet e njoftimeve me email',
            items: [
              { label: 'Email njoftimesh', value: 'info@prohygiene.shop' },
              { label: 'Njoftim porosi të reja', value: '✓ Aktivuar' },
              { label: 'Njoftim gjendje të ulët', value: '✓ Aktivuar' },
              { label: 'Prag i ulët stoku', value: '10 cope' },
            ],
          },
          {
            icon: Shield,
            title: 'Siguria',
            desc: 'Cilësimet e sigurisë dhe aksesit',
            items: [
              { label: 'Row Level Security', value: '✓ Aktivuar' },
              { label: 'JWT Expiry', value: '1 orë' },
              { label: 'Autentikimi 2FA', value: 'Opsional' },
            ],
          },
        ].map(({ icon: Icon, title, desc, items }) => (
          <div key={title} className="admin-card">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-brand-600" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">{title}</h3>
                <p className="text-text-muted text-sm">{desc}</p>
              </div>
            </div>
            <div className="divide-y divide-surface-border">
              {items.map(item => (
                <div key={item.label} className="flex items-center justify-between py-3">
                  <span className="text-sm text-text-secondary">{item.label}</span>
                  <span className="text-sm font-semibold text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}
