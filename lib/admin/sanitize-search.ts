export function sanitizeSearch(q: string) {
  return q.replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}
