import { Navbar } from '@/components/store/Navbar'
import { Footer } from '@/components/store/Footer'
import { getAuthUser } from '@/lib/supabase/auth'
import { getActiveCategories } from '@/lib/store/catalog'

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [categories, user] = await Promise.all([
    getActiveCategories(),
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
