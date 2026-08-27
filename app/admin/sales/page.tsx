import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { SalesClient } from './SalesClient'

export default async function SalesPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, sku, name_sq, price, sale_price, image_url, is_active, category:categories(name_sq), brand:brands(name)')
    .eq('is_active', true)
    .order('name_sq', { ascending: true })

  return (
    <div>
      <AdminHeader
        title="Menaxhimi i Zbritjeve"
        subtitle="Vendosni ose hiqni çmimet e zbritura për produkte individualisht ose në grup"
      />
      <div className="admin-page">
        <SalesClient products={products ?? []} />
      </div>
    </div>
  )
}
