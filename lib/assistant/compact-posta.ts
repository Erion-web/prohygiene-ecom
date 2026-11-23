// A pasted Falcon Posta export is ~15 lines per order. We only need the order
// number and the courier status.
const ORDER_RE = /ORD-\d{8}-[A-Z0-9]{6}/i
const KNOWN_STATUS =
  /(Sukses|E regjistruar|Në shpërndarje|Ne shperndarje|Në depo|Ne depo|E anuluar|Anuluar|Kthyer|Refuzuar|Në proces|Ne proces|Në pritje|Ne pritje)/i

export type PostaRow = { order: string; status: string }

export function parsePostaExport(text: string): PostaRow[] | null {
  const blocks = text.split(/^\s*(?=[A-Z]{2}\d{6}\b)/m).filter(b => /^[A-Z]{2}\d{6}\b/.test(b.trimStart()))
  if (blocks.length < 2) return null

  const rows: PostaRow[] = []
  for (const block of blocks) {
    const order = block.match(ORDER_RE)?.[0]
    const status = block.slice(0, 160).match(KNOWN_STATUS)?.[1]
    if (order && status) rows.push({ order: order.toUpperCase(), status })
  }
  return rows.length >= 2 ? rows : null
}

export function compactPostaExport(text: string): string {
  const rows = parsePostaExport(text)
  if (!rows) return text
  const firstId = text.search(/^\s*[A-Z]{2}\d{6}\b/m)
  // Drop the table's column-header lines (they start at the "ID" line).
  const header = firstId > 0 ? text.slice(0, firstId).split(/^\s*ID\b/m)[0].trim() : ''
  const lines = rows.map(r => `${r.order} | ${r.status}`).join('\n')
  return `${header ? header + '\n\n' : ''}Lista nga posta (numri i porosisë | statusi në postë), ${rows.length} porosi:\n${lines}`
}
