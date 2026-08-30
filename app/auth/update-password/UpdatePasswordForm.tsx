'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export function UpdatePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Fjalëkalimi duhet të ketë të paktën 6 karaktere')
      return
    }
    if (password !== confirm) {
      toast.error('Fjalëkalimet nuk përputhen')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success('Fjalëkalimi u ndryshua')
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Fjalëkalimi i ri</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input pr-11"
            placeholder="••••••••"
            autoComplete="new-password"
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
      <div>
        <label className="label">Përsërit fjalëkalimin</label>
        <input
          type={showPass ? 'text' : 'password'}
          required
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="input"
          placeholder="••••••••"
          autoComplete="new-password"
          minLength={6}
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 justify-center text-base">
        {loading ? <><Loader2 size={18} className="animate-spin" /> Duke ruajtur...</> : 'Ruaj fjalëkalimin'}
      </button>
    </form>
  )
}
