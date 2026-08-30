import { getAuthUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { UpdatePasswordForm } from './UpdatePasswordForm'

export default async function UpdatePasswordPage() {
  const user = await getAuthUser()
  if (!user) redirect('/auth/login?mode=forgot')

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-8">
          <Logo size="md" />
        </Link>
        <div className="card p-8">
          <h1 className="text-xl font-extrabold text-text-primary mb-1">Fjalëkalim i ri</h1>
          <p className="text-text-muted text-sm mb-6">
            Zgjidhni një fjalëkalim të ri për {user.email}.
          </p>
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  )
}
