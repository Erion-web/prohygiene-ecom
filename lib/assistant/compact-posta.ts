// A pasted Falcon Posta export is ~15 lines per order. We only need the order
// number and the courier status, so shrink it before it reaches the model
// (smaller prompt, fewer extraction mistakes).
const ORDER_RE = /ORD-\d{8}-[A-Z0-9]{6}/i
const KNOWN_STATUS = /(Sukses|E regjistruar|Në shpërndarje|Ne shperndarje|Në depo|Ne depo|Kthyer|Anuluar|Refuzuar|Në proces|Ne proces)/i

export function compactPostaExport(text: string): string {
  const blocks = text.split(/^\s*(?=[A-Z]{2}\d{6}\b)/m).filter(b => /^[A-Z]{2}\d{6}\b/.test(b.trimStart()))
  if (blocks.length < 2) return text

  const rows: string[] = []
  for (const block of blocks) {
    const order = block.match(ORDER_RE)?.[0]
    const status = block.slice(0, 140).match(KNOWN_STATUS)?.[1]
    if (order && status) rows.push(`${order.toUpperCase()} | ${status}`)
  }
  if (rows.length < 2) return text

  // Keep any instructions the admin typed before/after the table.
  const firstId = text.search(/^\s*[A-Z]{2}\d{6}\b/m)
  // Drop the table's column-header lines (they start at the "ID" line).
  const header = firstId > 0 ? text.slice(0, firstId).split(/^\s*ID\b/m)[0].trim() : ''
  return `${header ? header + '\n\n' : ''}Lista nga posta (numri i porosisë | statusi në postë), ${rows.length} porosi:\n${rows.join('\n')}`
}
