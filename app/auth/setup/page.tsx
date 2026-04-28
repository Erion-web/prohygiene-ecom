import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { SetupForm } from './SetupForm'

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const initialName = (user.user_metadata?.full_name as string | undefined) ?? ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-8">
          <Logo size="md" />
        </Link>

        <div className="card p-8">
          <div className="mb-6">
            <h1 className="text-xl font-extrabold text-text-primary mb-1">
              Plotëso profilin tënd
            </h1>
            <p className="text-text-muted text-sm">
              Shto adresën tënde për blerje edhe më të shpejta.
            </p>
          </div>

          <SetupForm
            userId={user.id}
            initialName={initialName}
            email={user.email ?? ''}
          />
        </div>
      </div>
    </div>
  )
}
