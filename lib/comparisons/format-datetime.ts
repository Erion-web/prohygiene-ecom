/** Fixed-locale datetime for SSR + client (avoids hydration mismatch). */
export function formatAdminDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Belgrade',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)?.value ?? ''

  return `${get('day')}/${get('month')}/${get('year')}, ${get('hour')}:${get('minute')}`
}
