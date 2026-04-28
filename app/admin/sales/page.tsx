import { createClient } from '@/lib/supabase/server'
import { SalesClient } from './SalesClient'

export default async function SalesPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, sku, name_sq, price, sale_price, image_url, is_active, category:categories(name_sq), brand:brands(name)')
    .eq('is_active', true)
    .order('name_sq', { ascending: true })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text-primary">Menaxhimi i Zbritjeve</h1>
        <p className="text-text-muted text-sm mt-0.5">
          Vendosni ose hiqni çmimet e zbritura për produkte individualisht ose në grup
        </p>
      </div>
      <SalesClient products={products ?? []} />
    </div>
  )
}
