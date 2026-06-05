import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { Plus, Upload } from 'lucide-react'
import { ProductsClient } from './ProductsClient'

async function getData() {
  const supabase = await createClient()
  const [productsRes, categoriesRes, brandsRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(name_sq), brand:brands(name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('id, name_sq')
      .eq('is_active', true)
      .order('name_sq'),
    supabase
      .from('brands')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ])
  return {
    products: productsRes.data ?? [],
    categories: categoriesRes.data ?? [],
    brands: brandsRes.data ?? [],
  }
}

export default async function ProductsAdminPage() {
  const { products, categories, brands } = await getData()

  return (
    <div>
      <AdminHeader
        title="Produktet"
        subtitle={`${products.length} produkte gjithsej`}
        actions={
          <div className="flex gap-2">
            <Link href="/admin/products/import" className="btn-secondary gap-2 text-sm py-2">
              <Upload size={15} />
              <span className="hidden sm:inline">Importo</span>
            </Link>
            <Link href="/admin/products/new" className="btn-primary gap-2 text-sm py-2">
              <Plus size={15} />
              <span className="hidden sm:inline">Shto Produkt</span>
            </Link>
          </div>
        }
      />
      <ProductsClient products={products} categories={categories} brands={brands} />
    </div>
  )
}
