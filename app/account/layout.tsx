import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/store/Navbar'
import { Footer } from '@/components/store/Footer'
import { LogoutButton } from './LogoutButton'
import { AccountNav } from './AccountNav'
import type { Category } from '@/types'

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
  return data ?? []
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/account')

  const [{ data: profile }, categories] = await Promise.all([
    supabase.from('profiles').select('full_name, email, role').eq('id', user.id).single(),
    getCategories(),
  ])

  const name = profile?.full_name || user.email?.split('@')[0] || 'Profili'
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar categories={categories} />

      <div className="flex-1 bg-surface-soft">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-8">

          {/* ── MOBILE LAYOUT ── */}
          <div className="md:hidden space-y-4">
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-surface-border shadow-soft p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-primary text-sm truncate">{name}</p>
                <p className="text-xs text-text-muted truncate">{user.email}</p>
                {isAdmin && (
                  <Link href="/admin" className="text-xs text-brand-600 font-semibold">
                    → Paneli i Adminit
                  </Link>
                )}
              </div>
              <LogoutButton compact />
            </div>

            {/* Horizontal tab nav */}
            <AccountNav />

            {/* Page content */}
            <main>{children}</main>
          </div>

          {/* ── DESKTOP LAYOUT ── */}
          <div className="hidden md:grid md:grid-cols-[240px_1fr] gap-6 items-start">
            <aside className="space-y-3 sticky top-20">
              <div className="card p-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-black text-xl mb-3">
                  {initial}
                </div>
                <p className="font-bold text-text-primary truncate">{name}</p>
                <p className="text-xs text-text-muted truncate">{user.email}</p>
                {isAdmin && (
                  <Link href="/admin" className="text-xs text-brand-600 font-semibold mt-1.5 block hover:underline">
                    → Paneli i Adminit
                  </Link>
                )}
              </div>
              <AccountNav />
              <div className="card p-2">
                <LogoutButton />
              </div>
            </aside>
            <main>{children}</main>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  )
}
