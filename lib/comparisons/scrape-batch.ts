import { createServiceClient } from '@/lib/supabase/server'
import { extractProductsFromHtml, fetchPageHtml, findNextPageUrl } from '@/lib/comparisons/extract-products'
import {
  fetchJsonCatalogProducts,
  JSON_CATALOG_BATCH_SIZE,
  usesJsonCatalog,
} from '@/lib/comparisons/json-api-catalog'
import { discoverJsonCatalogFromCatalogUrl } from '@/lib/comparisons/discover-json-catalog'
import {
  initialScrapeCursor,
  scrapeSourceKind,
  type ScrapeCursor,
} from '@/lib/comparisons/scrape-source'
import { findBestProductMatch, type OurProductRow } from '@/lib/comparisons/match-products'
import type { Competitor, ScrapeRun } from '@/types'

export const MAX_PAGES_PER_BATCH = 1
export const MAX_PAGES_PER_RUN = 40

export interface BatchResult {
  run: ScrapeRun
  done: boolean
  message?: string
}

async function loadOurProducts(): Promise<OurProductRow[]> {
  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('products')
    .select('id, sku, name_sq, name_en, price, sale_price')
    .eq('is_active', true)
  return (data ?? []) as OurProductRow[]
}

async function upsertCompetitorProduct(
  competitorId: string,
  item: {
    name: string
    price: number | null
    priceRaw: string | null
    productUrl: string
    externalSku: string | null
  },
  ourProducts: OurProductRow[]
): Promise<boolean> {
  const supabase = await createServiceClient()
  const { productId, confidence } = findBestProductMatch(item.name, item.externalSku, ourProducts)

  const { data: existing } = await supabase
    .from('competitor_products')
    .select('id, price, matched_product_id, match_confidence')
    .eq('competitor_id', competitorId)
    .eq('product_url', item.productUrl)
    .maybeSingle()

  const payload = {
    competitor_id: competitorId,
    name: item.name,
    price: item.price,
    price_raw: item.priceRaw,
    product_url: item.productUrl,
    external_sku: item.externalSku,
    scraped_at: new Date().toISOString(),
    matched_product_id: existing?.matched_product_id ?? productId,
    match_confidence: existing?.matched_product_id ? existing.match_confidence : confidence,
  }

  const { data: row, error } = await supabase
    .from('competitor_products')
    .upsert(payload, { onConflict: 'competitor_id,product_url' })
    .select('id, price')
    .single()

  if (error || !row) return false

  const prevPrice = existing?.price != null ? Number(existing.price) : null
  const newPrice = item.price
  if (newPrice != null && prevPrice !== newPrice) {
    await supabase.from('competitor_price_history').insert({
      competitor_product_id: row.id,
      price: newPrice,
    })
  }

  return true
}

async function ensureCompetitorJsonCatalog(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  competitor: Competitor
): Promise<{ competitor: Competitor; discovered: boolean }> {
  if (usesJsonCatalog(competitor)) {
    return { competitor, discovered: false }
  }

  const discovered = await discoverJsonCatalogFromCatalogUrl(competitor.catalog_url)
  if (!discovered) {
    return { competitor, discovered: false }
  }

  const { data: updated, error } = await supabase
    .from('competitors')
    .update({
      products_api_url: discovered.products_api_url,
      json_catalog_config: discovered.json_catalog_config,
      updated_at: new Date().toISOString(),
    })
    .eq('id', competitor.id)
    .select('*')
    .single()

  if (error || !updated) {
    return { competitor, discovered: false }
  }

  return { competitor: updated as Competitor, discovered: true }
}

function batchMessage(done: boolean, totalUpserted: number, source: ReturnType<typeof scrapeSourceKind>): string {
  if (!done) return 'Batch u përpunua'
  if (totalUpserted > 0) return 'Scraping u përfundua'
  if (source === 'html') {
    return 'Scraping u përfundua por nuk u gjetën produkte. Kontrollo selektorët CSS ose shto URL të API JSON.'
  }
  return 'Scraping u përfundua por nuk u importuan produkte. Kontrollo URL e API dhe shablonin e linkut.'
}

export async function processScrapeBatch(runId: string): Promise<BatchResult> {
  const supabase = await createServiceClient()

  const { data: runRow, error: runErr } = await supabase
    .from('scrape_runs')
    .select('*')
    .eq('id', runId)
    .single()

  if (runErr || !runRow) throw new Error('Scrape run nuk u gjet')

  const run = runRow as ScrapeRun
  if (run.status === 'completed' || run.status === 'failed') {
    return { run, done: true }
  }

  const { data: competitorRow } = await supabase
    .from('competitors')
    .select('*')
    .eq('id', run.competitor_id)
    .single()

  if (!competitorRow) {
    await supabase.from('scrape_runs').update({
      status: 'failed',
      error_message: 'Konkurrenti nuk u gjet',
      finished_at: new Date().toISOString(),
    }).eq('id', runId)
    throw new Error('Konkurrenti nuk u gjet')
  }

  let competitor = competitorRow as Competitor
  const { competitor: withCatalog, discovered } = await ensureCompetitorJsonCatalog(supabase, competitor)
  competitor = withCatalog

  let source = scrapeSourceKind(competitor)
  let cursor = (run.cursor ?? {}) as ScrapeCursor

  if (discovered || (source === 'json_api' && cursor.source !== 'json_api')) {
    cursor = initialScrapeCursor(competitor)
  }

  let pageCount = cursor.pageCount ?? 0
  let nextUrl: string | null =
    cursor.nextUrl !== undefined
      ? cursor.nextUrl
      : source === 'json_api'
        ? 'json_api'
        : competitor.catalog_url

  if (run.status === 'pending') {
    await supabase.from('scrape_runs').update({ status: 'running' }).eq('id', runId)
  }

  const ourProducts = await loadOurProducts()
  let upsertedThisBatch = 0
  let productOffset = cursor.productOffset ?? 0

  try {
    if (source === 'json_api') {
      if (!usesJsonCatalog(competitor)) {
        throw new Error('Konkurrenti nuk ka URL të API për produkte')
      }
      if (nextUrl && pageCount < MAX_PAGES_PER_RUN) {
        const all = await fetchJsonCatalogProducts(competitor)
        const slice = all.slice(productOffset, productOffset + JSON_CATALOG_BATCH_SIZE)
        for (const item of slice) {
          const ok = await upsertCompetitorProduct(competitor.id, item, ourProducts)
          if (ok) upsertedThisBatch++
        }
        productOffset += slice.length
        pageCount++
        nextUrl = productOffset >= all.length ? null : 'json_api'
      }
    } else {
      for (let i = 0; i < MAX_PAGES_PER_BATCH; i++) {
        if (!nextUrl || pageCount >= MAX_PAGES_PER_RUN) break

        const html = await fetchPageHtml(nextUrl)
        let extracted = extractProductsFromHtml(html, nextUrl, competitor)

        if (
          extracted.length === 0 &&
          pageCount === 0 &&
          nextUrl === competitor.catalog_url
        ) {
          const again = await ensureCompetitorJsonCatalog(supabase, competitor)
          if (again.discovered || usesJsonCatalog(again.competitor)) {
            competitor = again.competitor
            source = scrapeSourceKind(competitor)
            if (source === 'json_api') {
              cursor = initialScrapeCursor(competitor)
              pageCount = 0
              productOffset = 0
              nextUrl = 'json_api'
              break
            }
          }
        }

        for (const item of extracted) {
          const ok = await upsertCompetitorProduct(competitor.id, item, ourProducts)
          if (ok) upsertedThisBatch++
        }

        pageCount++
        const currentUrl: string = nextUrl
        const foundNext = findNextPageUrl(html, currentUrl, competitor)
        nextUrl =
          foundNext && foundNext !== competitor.catalog_url && foundNext !== currentUrl
            ? foundNext
            : null
      }

      if (source === 'json_api' && nextUrl === 'json_api' && pageCount === 0) {
        const all = await fetchJsonCatalogProducts(competitor)
        const slice = all.slice(productOffset, productOffset + JSON_CATALOG_BATCH_SIZE)
        for (const item of slice) {
          const ok = await upsertCompetitorProduct(competitor.id, item, ourProducts)
          if (ok) upsertedThisBatch++
        }
        productOffset += slice.length
        pageCount++
        nextUrl = productOffset >= all.length ? null : 'json_api'
      }
    }

    const done = !nextUrl || pageCount >= MAX_PAGES_PER_RUN
    const totalUpserted = run.products_upserted + upsertedThisBatch
    const now = new Date().toISOString()

    const nextCursor: ScrapeCursor =
      source === 'json_api'
        ? {
            source: 'json_api',
            nextUrl: done ? null : nextUrl,
            pageCount,
            productOffset,
          }
        : { source: 'html', nextUrl: done ? null : nextUrl, pageCount }

    const { data: updatedRun } = await supabase
      .from('scrape_runs')
      .update({
        status: done ? 'completed' : 'running',
        pages_processed: pageCount,
        products_upserted: totalUpserted,
        cursor: nextCursor,
        finished_at: done ? now : null,
        error_message: null,
      })
      .eq('id', runId)
      .select('*')
      .single()

    await supabase.from('competitors').update({
      last_scraped_at: now,
      last_success_at: done && totalUpserted > 0 ? now : competitor.last_success_at,
      updated_at: now,
    }).eq('id', competitor.id)

    return {
      run: (updatedRun ?? run) as ScrapeRun,
      done,
      message: batchMessage(done, totalUpserted, source),
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gabim gjatë scraping'
    await supabase.from('scrape_runs').update({
      status: 'failed',
      error_message: msg,
      finished_at: new Date().toISOString(),
    }).eq('id', runId)
    throw err
  }
}

export async function startScrapeRun(competitorId: string): Promise<ScrapeRun> {
  const supabase = await createServiceClient()

  const { data: active } = await supabase
    .from('scrape_runs')
    .select('id, status')
    .eq('competitor_id', competitorId)
    .in('status', ['pending', 'running'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (active) {
    const { data: existing } = await supabase.from('scrape_runs').select('*').eq('id', active.id).single()
    if (existing) return existing as ScrapeRun
  }

  const { data: competitor } = await supabase
    .from('competitors')
    .select('*')
    .eq('id', competitorId)
    .single()

  if (!competitor) throw new Error('Konkurrenti nuk u gjet')

  const { competitor: ready } = await ensureCompetitorJsonCatalog(
    supabase,
    competitor as Competitor
  )

  const { data: run, error } = await supabase
    .from('scrape_runs')
    .insert({
      competitor_id: competitorId,
      status: 'pending',
      cursor: initialScrapeCursor(ready),
    })
    .select('*')
    .single()

  if (error || !run) throw new Error(error?.message ?? 'Nuk u krijua scrape run')
  return run as ScrapeRun
}

export async function runDueCompetitorScrape(): Promise<{ started: boolean; runId?: string }> {
  const supabase = await createServiceClient()
  const { data: competitors } = await supabase
    .from('competitors')
    .select('*')
    .eq('is_active', true)

  const now = Date.now()
  const due = (competitors ?? []).find(c => {
    const comp = c as Competitor
    if (!comp.last_scraped_at) return true
    const hours = comp.scrape_interval_hours ?? 168
    const next = new Date(comp.last_scraped_at).getTime() + hours * 3600_000
    return now >= next
  }) as Competitor | undefined

  if (!due) return { started: false }

  const run = await startScrapeRun(due.id)
  await processScrapeBatch(run.id)
  return { started: true, runId: run.id }
}
