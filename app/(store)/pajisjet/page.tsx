import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PajisjetClient } from './PajisjetClient'
import type { Product } from '@/types'

export const metadata: Metadata = {
  title: 'Pajisjet në Shfrytëzim — ProHygiene',
  description: 'Pajisje profesionale higjiene në shfrytëzim për biznese dhe HORECA. Rezervoni pajisjen tuaj dhe na kontaktoni për ofertë.',
  alternates: { canonical: 'https://prohygiene.shop/pajisjet' },
}

async function getLeaseProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .eq('available_for_lease', true)
    .order('created_at', { ascending: false })
  return (data as Product[]) ?? []
}

export default async function PajisjetPage() {
  const products = await getLeaseProducts()
  return <PajisjetClient products={products} />
}
