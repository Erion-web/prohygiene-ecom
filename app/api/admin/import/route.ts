import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import type { ImportResult } from '@/types'

// ── Column aliases ─────────────────────────────────────────────────────────
const COL: Record<string, string> = {
  // Albanian (user's Excel)
  'shifra':              'sku',
  'emertimi':            'name_sq',
  'emërtimi':            'name_sq',
  'njesia matese baze':  'unit',
  'njësia matëse bazë':  'unit',
  'njesia':              'unit',
  'cmimi me tvsh':       'price',
  'çmimi me tvsh':       'price',
  'cmimi':               'price',
  'çmimi':               'price',
  'sasia':               'stock',
  'kategoria':           'category',
  'kodi':                'sku',
  'emri':                'name_sq',
  // English (backwards compat)
  'sku':                 'sku',
  'name_sq':             'name_sq',
  'name_en':             'name_en',
  'description_sq':      'description_sq',
  'description_en':      'description_en',
  'category':            'category',
  'audience_type':       'audience_type',
  'price':               'price',
  'stock':               'stock',
  'unit':                'unit',
  'image_url':           'image_url',
}

function mapKey(raw: string): string {
  return COL[raw.toLowerCase().trim()] ?? raw.toLowerCase().trim()
}

/** Makes a URL-safe slug. Guaranteed unique when SKU is included. */
function makeSlug(sku: string): string {
  return sku
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

/** Handles European decimal commas: "1,12" → 1.12 */
function parsePrice(val: unknown): number {
  if (typeof val === 'number') return val
  if (!val) return 0
  const s = String(val).replace(/[^\d,.\-]/g, '').replace(',', '.')
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

function parseInt2(val: unknown): number {
  if (typeof val === 'number') return Math.round(val)
  const n = parseInt(String(val ?? '0'), 10)
  return isNaN(n) ? 0 : n
}

export async function POST(request: Request) {
  const { authorized } = await requireAdmin()
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Supabase env vars missing. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local' },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // ── Parse Excel / CSV ──────────────────────────────────────────────────
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return NextResponse.json({ error: 'Workbook is empty' }, { status: 400 })

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets[sheetName],
      { defval: '' }
    )
    if (rawRows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in file' }, { status: 400 })
    }

    // Remap all column headers to internal field names
    const rows = rawRows.map(raw =>
      Object.fromEntries(Object.entries(raw).map(([k, v]) => [mapKey(k), v]))
    )

    // ── Supabase setup ────────────────────────────────────────────────────
    const supabase = await createServiceClient()

    // Verify the products table is accessible
    const { error: tableError } = await supabase.from('products').select('id').limit(1)
    if (tableError) {
      console.error('[import] Database error:', tableError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Load category slugs
    const { data: categories } = await supabase.from('categories').select('id, slug')
    const categoryMap = new Map<string, string>(
      (categories ?? []).map(c => [c.slug, c.id])
    )

    const result: ImportResult = { success: 0, failed: 0, errors: [] }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2
      const sku = String(row['sku'] ?? '').trim()

      try {
        if (!sku) throw new Error('Shifra (SKU) mungon')

        const nameSq = String(row['name_sq'] ?? '').trim()
        if (!nameSq) throw new Error('Emërtimi mungon')

        const price = parsePrice(row['price'])
        if (price === 0) {
          // Skip zero-price rows (likely blank/header rows)
          result.failed++
          result.errors.push({ row: rowNum, sku, error: 'Çmimi 0 — anashkaluar' })
          continue
        }
        if (price < 0) throw new Error(`Çmimi invalid: ${row['price']}`)

        const stock    = parseInt2(row['stock'])
        const unit     = String(row['unit'] ?? 'cope').trim() || 'cope'
        const nameEn   = String(row['name_en'] ?? '').trim() || nameSq
        const descSq   = String(row['description_sq'] ?? '').trim() || null
        const descEn   = String(row['description_en'] ?? '').trim() || null
        const imageUrl = String(row['image_url'] ?? '').trim() || null
        const catSlug  = String(row['category'] ?? '').trim()
        const catId    = categoryMap.get(catSlug) ?? null

        const rawAud = String(row['audience_type'] ?? '').trim()
        const audience = (['home', 'business', 'both'] as const).includes(rawAud as 'home')
          ? (rawAud as 'home' | 'business' | 'both')
          : 'both'

        const productData = {
          sku,
          // Slug is derived from SKU only — guaranteed unique
          slug:           makeSlug(sku),
          name_sq:        nameSq,
          name_en:        nameEn,
          description_sq: descSq,
          description_en: descEn,
          category_id:    catId,
          audience_type:  audience,
          price,
          sale_price:     null,
          stock:          isNaN(stock) ? 0 : stock,
          unit,
          image_url:      imageUrl,
          is_active:      true,
          is_featured:    false,
          is_best_seller: false,
          vat_rate:       18,
          listing_type:   'sale',
          available_for_lease: false,
          gallery_urls:   [] as string[],
        }

        const { error } = await supabase
          .from('products')
          .upsert(productData, { onConflict: 'sku' })

        if (error) throw new Error(error.message)
        result.success++
      } catch (err) {
        result.failed++
        result.errors.push({
          row: rowNum,
          sku: sku || `rreshti-${rowNum}`,
          error: err instanceof Error ? err.message : 'Gabim i panjohur',
        })
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
