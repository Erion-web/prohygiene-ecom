import * as cheerio from 'cheerio'
import { parsePriceText } from '@/lib/comparisons/parse-price'
import type { Competitor } from '@/types'

export interface ExtractedProduct {
  name: string
  price: number | null
  priceRaw: string | null
  productUrl: string
  externalSku: string | null
}

function resolveUrl(base: string, href: string): string {
  try {
    return new URL(href, base).href
  } catch {
    return href
  }
}

function collectJsonLdNodes(data: unknown, out: Record<string, unknown>[]) {
  if (!data) return
  if (Array.isArray(data)) {
    for (const item of data) collectJsonLdNodes(item, out)
    return
  }
  if (typeof data !== 'object') return
  const obj = data as Record<string, unknown>
  if (obj['@graph']) collectJsonLdNodes(obj['@graph'], out)
  out.push(obj)
}

function productsFromJsonLd(html: string, pageUrl: string): ExtractedProduct[] {
  const $ = cheerio.load(html)
  const nodes: Record<string, unknown>[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).text().trim()
    if (!text) return
    try {
      collectJsonLdNodes(JSON.parse(text), nodes)
    } catch {
      /* ignore invalid JSON-LD */
    }
  })

  const results: ExtractedProduct[] = []
  for (const node of nodes) {
    const type = node['@type']
    const types = Array.isArray(type) ? type : [type]
    const isProduct = types.some(t => String(t).toLowerCase() === 'product')
    if (!isProduct) continue

    const name = String(node.name ?? '').trim()
    if (!name) continue

    let priceRaw: string | null = null
    let price: number | null = null
    const offers = node.offers
    const offerList = Array.isArray(offers) ? offers : offers ? [offers] : []
    for (const offer of offerList) {
      if (!offer || typeof offer !== 'object') continue
      const o = offer as Record<string, unknown>
      priceRaw = String(o.price ?? o.lowPrice ?? o.highPrice ?? '').trim() || priceRaw
      price = parsePriceText(priceRaw) ?? price
    }
    if (price == null && node.price != null) {
      priceRaw = String(node.price)
      price = parsePriceText(priceRaw)
    }

    const sku = node.sku != null ? String(node.sku) : null
    const url = node.url ? resolveUrl(pageUrl, String(node.url)) : pageUrl

    results.push({
      name,
      price,
      priceRaw,
      productUrl: url,
      externalSku: sku,
    })
  }
  return results
}

/** WooCommerce / Woodmart shop grids (e.g. daystar-ks.com/shop/). */
function productsFromWooCommerce(html: string, pageUrl: string): ExtractedProduct[] {
  const $ = cheerio.load(html)
  const results: ExtractedProduct[] = []

  const cards = $('.products .product.type-product, ul.products li.product, .wd-products .product.type-product')
  cards.each((_, card) => {
    const root = $(card)

    const name =
      root.find('.wd-entities-title a').first().text().trim() ||
      root.find('.woocommerce-loop-product__title a').first().text().trim() ||
      root.find('h2 a, h3 a').first().text().trim()

    if (!name) return

    let href =
      root.find('.wd-entities-title a').first().attr('href') ??
      root.find('a.woocommerce-LoopProduct-link').first().attr('href') ??
      root.find('a.product-image-link, a.wd-product-img-link').first().attr('href') ??
      ''
    const productUrl = href ? resolveUrl(pageUrl, href) : pageUrl

    const priceBlock = root.find('.price').first()
    const priceEl =
      priceBlock.find('ins .woocommerce-Price-amount').first().length > 0
        ? priceBlock.find('ins .woocommerce-Price-amount').first()
        : priceBlock.find('.woocommerce-Price-amount').first()
    const priceRaw = priceEl.text().trim() || priceBlock.text().trim() || null
    const price = parsePriceText(priceRaw)

    const sku =
      root.find('[data-product_sku]').first().attr('data-product_sku') ??
      root.find('.add_to_cart_button').first().attr('data-product_sku') ??
      null

    results.push({
      name: cheerio.load(`<span>${name}</span>`)('span').text().trim(),
      price,
      priceRaw,
      productUrl,
      externalSku: sku?.trim() || null,
    })
  })

  return results
}

function productsFromSelectors(html: string, pageUrl: string, competitor: Competitor): ExtractedProduct[] {
  if (!competitor.selector_card || !competitor.selector_name) return []
  const $ = cheerio.load(html)
  const results: ExtractedProduct[] = []

  $(competitor.selector_card).each((_, card) => {
    const root = $(card)
    const name = competitor.selector_name ? root.find(competitor.selector_name).first().text().trim() : ''
    if (!name) return

    const priceEl = competitor.selector_price ? root.find(competitor.selector_price).first() : root
    const priceRaw = priceEl.text().trim() || null
    const price = parsePriceText(priceRaw)

    let href = ''
    if (competitor.selector_link) {
      href = root.find(competitor.selector_link).first().attr('href') ?? ''
    }
    if (!href) href = root.find('a[href]').first().attr('href') ?? ''
    const productUrl = href ? resolveUrl(pageUrl, href) : pageUrl

    results.push({ name, price, priceRaw, productUrl, externalSku: null })
  })

  return results
}

export function extractProductsFromHtml(
  html: string,
  pageUrl: string,
  competitor: Competitor
): ExtractedProduct[] {
  const fromLd = productsFromJsonLd(html, pageUrl)
  if (fromLd.length > 0) return dedupeByUrl(fromLd)

  const fromWoo = productsFromWooCommerce(html, pageUrl)
  if (fromWoo.length > 0) return dedupeByUrl(fromWoo)

  const fromCss = productsFromSelectors(html, pageUrl, competitor)
  return dedupeByUrl(fromCss)
}

function dedupeByUrl(items: ExtractedProduct[]): ExtractedProduct[] {
  const map = new Map<string, ExtractedProduct>()
  for (const item of items) {
    const key = item.productUrl || item.name
    if (!map.has(key)) map.set(key, item)
  }
  return [...map.values()]
}

export function findNextPageUrl(
  html: string,
  pageUrl: string,
  competitor: Competitor
): string | null {
  const $ = cheerio.load(html)
  if (competitor.selector_next_page) {
    const href = $(competitor.selector_next_page).first().attr('href')
    if (href) return resolveUrl(pageUrl, href)
  }
  const relNext = $('link[rel="next"]').attr('href') ?? $('a[rel="next"]').attr('href')
  if (relNext) return resolveUrl(pageUrl, relNext)

  const wooNext =
    $('a.next.page-numbers').attr('href') ??
    $('.woocommerce-pagination a.next').attr('href')
  if (wooNext) return resolveUrl(pageUrl, wooNext)

  const nextText = $('a').filter((_, el) => {
    const t = $(el).text().toLowerCase().trim()
    return t === 'next' || t === 'tjetër' || t === 'tjeter' || t.includes('→')
  }).first().attr('href')
  if (nextText) return resolveUrl(pageUrl, nextText)

  return null
}

export async function fetchPageHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; ProHygieneComparison/1.0; +https://prohygiene.shop)',
      Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'sq,en;q=0.9',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} për ${url}`)
  return res.text()
}
