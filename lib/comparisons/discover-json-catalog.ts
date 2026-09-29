import { fetchPageHtml } from '@/lib/comparisons/extract-products'
import type { JsonCatalogConfig } from '@/types'

export interface DiscoveredJsonCatalog {
  products_api_url: string
  json_catalog_config: JsonCatalogConfig
}

function combineApiUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, '')
  const p = path.replace(/^\/+/, '')
  return `${b}/${p}`
}

function isSpaCatalogShell(html: string): boolean {
  return /<div\s+id=["']root["']\s*>\s*<\/div>/i.test(html) || /<div\s+id=["']root["']\s*\/>/i.test(html)
}

function scriptUrlsFromHtml(html: string, pageUrl: string): string[] {
  const urls: string[] = []
  const re = /<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    try {
      urls.push(new URL(m[1], pageUrl).href)
    } catch {
      /* skip */
    }
  }
  return urls
}

function apiBaseUrlsFromJs(js: string): string[] {
  const bases = new Set<string>()
  const patterns = [
    /baseURL:\s*"([^"]+)"/g,
    /axios\.create\(\{baseURL:\s*"([^"]+)"/g,
  ]
  for (const re of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(js))) {
      const u = m[1].trim()
      if (u.startsWith('http')) bases.add(u)
    }
  }
  return [...bases]
}

function productListPathsFromJs(js: string): string[] {
  const paths = new Set<string>()
  const re = /\.get\("([^"$?{]+)"\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(js))) {
    const p = m[1].trim()
    if (!/product/i.test(p)) continue
    if (/paginated|suggestions|similar|random|bestseller|price-range|variants/i.test(p)) continue
    paths.add(p)
  }
  const priority = (p: string) => {
    if (/^Product\/products$/i.test(p)) return 0
    if (/\/products$/i.test(p)) return 1
    if (/products/i.test(p)) return 2
    return 3
  }
  return [...paths].sort((a, b) => priority(a) - priority(b))
}

function productUrlTemplateFromJs(js: string, catalogUrl: string): string {
  let origin: string
  try {
    origin = new URL(catalogUrl).origin
  } catch {
    return ''
  }

  if (/\/produkti\//i.test(js)) {
    return `${origin}/produkti/{id}`
  }
  if (/\/product\//i.test(js)) {
    return `${origin}/product/{id}`
  }
  if (/\/products\//i.test(js)) {
    return `${origin}/products/{id}`
  }
  if (/\/p\//i.test(js)) {
    return `${origin}/p/{id}`
  }
  return `${origin}/product/{id}`
}

function looksLikeProductArray(data: unknown): data is Record<string, unknown>[] {
  if (!Array.isArray(data) || data.length === 0) return false
  const row = data[0]
  if (!row || typeof row !== 'object') return false
  const o = row as Record<string, unknown>
  return Boolean(o.name ?? o.title ?? o.productName)
}

async function probeProductsApi(apiUrl: string): Promise<boolean> {
  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return false
    const body = await res.json()
    if (looksLikeProductArray(body)) return true
    if (body && typeof body === 'object') {
      for (const v of Object.values(body as Record<string, unknown>)) {
        if (looksLikeProductArray(v)) return true
      }
    }
    return false
  } catch {
    return false
  }
}

async function fetchMainBundleText(scriptUrl: string): Promise<string | null> {
  try {
    const res = await fetch(scriptUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; ProHygieneComparison/1.0; +https://prohygiene.shop)',
        Accept: '*/*',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) return null
    const text = await res.text()
    if (text.length > 4_000_000) return text.slice(0, 4_000_000)
    return text
  } catch {
    return null
  }
}

export async function discoverJsonCatalogFromCatalogUrl(
  catalogUrl: string
): Promise<DiscoveredJsonCatalog | null> {
  let html: string
  try {
    html = await fetchPageHtml(catalogUrl)
  } catch {
    return null
  }

  if (!isSpaCatalogShell(html)) {
    return null
  }

  const scripts = scriptUrlsFromHtml(html, catalogUrl)
    .filter(u => !/model-viewer|polyfill|vendor-chunk/i.test(u))
    .sort((a, b) => {
      const score = (u: string) => (/\/assets\/index-/i.test(u) ? 2 : /\/assets\//.test(u) ? 1 : 0)
      return score(b) - score(a)
    })
  if (!scripts.length) return null

  let js = ''
  for (const scriptUrl of scripts.slice(0, 3)) {
    const chunk = await fetchMainBundleText(scriptUrl)
    if (!chunk) continue
    js += chunk
    const bases = apiBaseUrlsFromJs(js)
    const paths = productListPathsFromJs(js)
    if (bases.length && paths.length) break
  }
  if (!js) return null

  const bases = apiBaseUrlsFromJs(js)
  const paths = productListPathsFromJs(js)
  if (!bases.length || !paths.length) return null

  const urlTemplate = productUrlTemplateFromJs(js, catalogUrl)
  if (!urlTemplate) return null

  for (const base of bases) {
    for (const path of paths.slice(0, 8)) {
      const products_api_url = combineApiUrl(base, path)
      if (await probeProductsApi(products_api_url)) {
        return {
          products_api_url,
          json_catalog_config: { urlTemplate },
        }
      }
    }
  }

  return null
}
