import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubscriptionBuilder } from './SubscriptionBuilder'

export default async function NewSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/account/subscriptions/new')

  const { data: products } = await supabase
    .from('products')
    .select('id, sku, name_sq, price, sale_price, image_url, gallery_urls, unit, category:categories(name_sq), brand:brands(name)')
    .eq('is_active', true)
    .order('name_sq', { ascending: true })

  let editSub = null
  if (edit) {
    const { data } = await supabase
      .from('subscriptions')
      .select('*, items:subscription_items(id, product_id, quantity)')
      .eq('id', edit)
      .eq('user_id', user.id)
      .single()
    editSub = data
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-text-primary mb-2">
        {editSub ? 'Ndrysho Paketën' : 'Krijo Paketë të Re'}
      </h1>
      <p className="text-text-muted text-sm mb-8">
        Zgjidhni produktet dhe frekuencën e porosisë automatike
      </p>
      <SubscriptionBuilder products={products ?? []} editSub={editSub} />
    </div>
  )
}
