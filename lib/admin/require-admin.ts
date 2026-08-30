import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'

function isAdminRole(role: unknown): boolean {
  return typeof role === 'string' && ['admin', 'manager'].includes(role)
}

export async function requireAdmin() {
  const supabase = await createClient()
  const user = await getAuthUser()
  if (!user) return { supabase, user: null, authorized: false }

  const jwtRole = (user.app_metadata as Record<string, unknown>)?.role
  let authorized = isAdminRole(jwtRole)
  if (!authorized) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    authorized = isAdminRole(profile?.role)
  }

  return { supabase, user, authorized }
}

export function sanitizeSearch(q: string) {
  return q.replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}
