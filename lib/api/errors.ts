import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export function handleApiError(err: unknown, logLabel: string) {
  if (err instanceof ZodError) {
    const first = err.issues[0]?.message ?? 'Invalid request'
    return apiError(first, 400)
  }
  console.error(logLabel, err)
  return apiError('Internal server error', 500)
}
