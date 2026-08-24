import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from './server'
import { hasAuthCookie } from './auth-cookie'
import type { User } from '@supabase/supabase-js'

export { hasAuthCookie }

export const getAuthUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies()
  if (!hasAuthCookie(cookieStore.getAll())) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
