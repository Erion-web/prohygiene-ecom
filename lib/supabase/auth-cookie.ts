export function hasAuthCookie(cookieList: { name: string }[]): boolean {
  return cookieList.some(c => c.name.startsWith('sb-') && c.name.includes('auth-token'))
}
