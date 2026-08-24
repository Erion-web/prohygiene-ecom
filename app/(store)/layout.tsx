import { Navbar } from '@/components/store/Navbar'
import { Footer } from '@/components/store/Footer'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import type { Category } from '@/types'

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  return data ?? []
}

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [categories, user] = await Promise.all([
    getCategories(),
    getAuthUser(),
  ])

  const userName = user
    ? ((user.user_metadata?.full_name as string | undefined) ?? user.email?.split('@')[0] ?? null)
    : null

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar categories={categories} userName={userName} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
