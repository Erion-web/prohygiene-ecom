/** Helps remark-gfm detect tables (needs a blank line before the header row). */
export function normalizeAssistantMarkdown(content: string): string {
  let text = content.replace(/\r\n/g, '\n').trim()

  // Ensure empty line before a markdown table header.
  text = text.replace(/([^\n])\n(\|[^\n]+\|\s*\n\|[-\s:|]+\|)/g, '$1\n\n$2')

  // Rows without trailing pipe (common model slip).
  text = text.replace(/^(\|.+\|?)$/gm, line => {
    const t = line.trim()
    if (!t.startsWith('|')) return line
    return t.endsWith('|') ? t : `${t} |`
  })

  return text
}
