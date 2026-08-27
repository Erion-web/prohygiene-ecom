'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, ShieldCheck, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login'
  const [mode, setMode]         = useState<'login' | 'register'>(initialMode)

  useEffect(() => {
    setMode(searchParams.get('mode') === 'register' ? 'register' : 'login')
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    if (mode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      toast.success('Mirë se erdhe!')

      const jwtRole = (data.user.app_metadata as Record<string, unknown>)?.role
      const isAdmin = typeof jwtRole === 'string' && ['admin', 'manager'].includes(jwtRole)

      if (isAdmin) {
        router.push('/admin')
        router.refresh()
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile && ['admin', 'manager'].includes(profile.role as string)) {
        router.push('/admin')
      } else if (redirectTo && redirectTo.startsWith('/')) {
        router.push(redirectTo)
      } else {
        router.push('/')
      }
      router.refresh()

    } else {
      if (!fullName.trim()) {
        toast.error('Shkruani emrin tuaj')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      })

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      // If auto-confirm is on, create profile immediately then go to setup
      if (data.user && !data.user.confirmation_sent_at) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: fullName.trim(),
          role: 'customer',
          customer_type: 'individual',
        }, { onConflict: 'id' })
        toast.success('Llogaria u krijua! Mirë se erdhe!')
        router.push('/auth/setup')
        router.refresh()
      } else {
        toast.success('Llogaria u krijua! Kontrolloni email-in tuaj për konfirmim.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-8">
          <Logo size="md" />
        </Link>

        <div className="card p-8">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-surface-muted rounded-xl p-1 mb-7">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === m ? 'bg-white shadow-soft text-text-primary' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {m === 'login' ? 'Kyçu' : 'Regjistrohu'}
              </button>
            ))}
          </div>

          <h1 className="text-xl font-extrabold text-text-primary mb-1">
            {mode === 'login' ? 'Mirë se erdhe!' : 'Krijo llogari falas'}
          </h1>
          <p className="text-text-muted text-sm mb-6">
            {mode === 'login'
              ? 'Kyçu për të parë porositë tuaja dhe për të blerë shpejt.'
              : 'Regjistrohu dhe shijo blerje të shpejta çdo herë.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name — only on register */}
            {mode === 'register' && (
              <div>
                <label className="label">Emri i plotë *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="input pl-9"
                    placeholder="Emri Mbiemri"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="email@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Fjalëkalimi</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-11"
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary p-0.5"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 justify-center text-base">
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Duke procesuar...</>
                : mode === 'login' ? 'Kyçu' : 'Krijo Llogarinë'
              }
            </button>
          </form>

          <div className="mt-5 flex items-center gap-2 text-xs text-text-muted">
            <ShieldCheck size={13} className="text-emerald-500 flex-shrink-0" />
            Të dhënat tuaja janë të sigurta dhe të enkriptuara
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          <Link href="/" className="hover:text-brand-600 transition-colors">← Kthehu në dyqan</Link>
        </p>
      </div>
    </div>
  )
}
