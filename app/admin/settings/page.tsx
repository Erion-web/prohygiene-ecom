import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { Settings, Globe, CreditCard, Bell, Shield } from 'lucide-react'
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
      <div className="p-6 space-y-6 max-w-3xl">

        {/* Payment methods — real toggles */}
        <PaymentToggleCard initialMethods={paymentMethods} />

        {/* Static info cards */}
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
          <div key={title} className="admin-card p-6">
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

        <div className="admin-card p-6 bg-gradient-to-br from-brand-50 to-white border-brand-100">
          <div className="flex items-center gap-3 mb-3">
            <Settings size={20} className="text-brand-600" />
            <h3 className="font-bold text-text-primary">Variablat e Mjedisit</h3>
          </div>
          <p className="text-text-secondary text-sm mb-4">
            Konfiguro variablat e mëposhtme në skedarin <code className="bg-brand-100 px-1.5 py-0.5 rounded font-mono text-brand-700">.env.local</code>:
          </p>
          <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-1">
            {[
              'NEXT_PUBLIC_SUPABASE_URL=...',
              'NEXT_PUBLIC_SUPABASE_ANON_KEY=...',
              'SUPABASE_SERVICE_ROLE_KEY=...',
              'PAYSERA_PROJECT_ID=...',
              'PAYSERA_SIGN_PASSWORD=...',
              'NEXT_PUBLIC_APP_URL=https://yourdomain.com',
            ].map(line => (
              <p key={line} className="text-emerald-400">{line}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
