import { createRequire } from 'module'
import { createClient } from '@supabase/supabase-js'

const require = createRequire(import.meta.url)
const { v2: cloudinary } = require('cloudinary')

const PAGE = 1000
const CONCURRENCY = 4

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase env vars')
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Missing Cloudinary env vars')
}

const supabase = createClient(supabaseUrl, serviceKey)

function isCloudinaryUrl(url) {
  try {
    return new URL(url).hostname === 'res.cloudinary.com'
  } catch {
    return false
  }
}

function isHttpUrl(url) {
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

function supabaseStoragePathFromUrl(url) {
  try {
    const { pathname } = new URL(url)
    const marker = '/storage/v1/object/public/'
    const idx = pathname.indexOf(marker)
    if (idx === -1) return null
    const rest = pathname.slice(idx + marker.length)
    const slash = rest.indexOf('/')
    if (slash === -1) return null
    return {
      bucket: rest.slice(0, slash),
      path: decodeURIComponent(rest.slice(slash + 1)),
    }
  } catch {
    return null
  }
}

async function fetchAll(table, columns) {
  const rows = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + PAGE - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE) break
  }
  return rows
}

function collect(url, folder, jobs) {
  if (!url || typeof url !== 'string') return
  const trimmed = url.trim()
  if (!trimmed || !isHttpUrl(trimmed) || isCloudinaryUrl(trimmed)) return
  if (!jobs.has(trimmed)) jobs.set(trimmed, folder)
}

async function mapPool(items, fn) {
  let i = 0
  const results = new Array(items.length)
  async function worker() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await fn(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => worker()))
  return results
}

async function uploadRemote(url, folder) {
  const result = await cloudinary.uploader.upload(url, {
    folder: `prohygiene/${folder}`,
    resource_type: 'image',
    overwrite: false,
  })
  if (!result?.secure_url) throw new Error('No secure_url')
  return result.secure_url
}

function remap(url, urlMap) {
  if (!url) return url
  return urlMap.get(url) ?? url
}

async function main() {
  const jobs = new Map()

  const [products, banners, packages, categories, campaigns, brands, orderItems] = await Promise.all([
    fetchAll('products', 'id, image_url, gallery_urls'),
    fetchAll('banners', 'id, image_url'),
    fetchAll('homepage_packages', 'id, image_url'),
    fetchAll('categories', 'id, image_url'),
    fetchAll('campaigns', 'id, banner_url'),
    fetchAll('brands', 'id, logo_url'),
    fetchAll('order_items', 'id, product_image_url'),
  ])

  for (const row of products) {
    collect(row.image_url, 'products', jobs)
    for (const url of row.gallery_urls ?? []) collect(url, 'products', jobs)
  }
  for (const row of banners) collect(row.image_url, 'banners', jobs)
  for (const row of packages) collect(row.image_url, 'packages', jobs)
  for (const row of categories) collect(row.image_url, 'categories', jobs)
  for (const row of campaigns) collect(row.banner_url, 'campaigns', jobs)
  for (const row of brands) collect(row.logo_url, 'brands', jobs)
  for (const row of orderItems) collect(row.product_image_url, 'products', jobs)

  const entries = [...jobs.entries()]
  console.log(`Found ${entries.length} unique remote images to migrate`)
  if (entries.length === 0) {
    console.log('Nothing to migrate')
    return
  }

  const urlMap = new Map()
  let failed = 0
  await mapPool(entries, async ([url, folder], idx) => {
    try {
      const next = await uploadRemote(url, folder)
      urlMap.set(url, next)
      console.log(`[${idx + 1}/${entries.length}] ok ${folder}`)
    } catch (err) {
      failed += 1
      const message = err instanceof Error ? err.message : JSON.stringify(err)
      console.error(`[${idx + 1}/${entries.length}] fail ${folder}: ${message} :: ${url}`)
    }
  })

  let updated = 0

  for (const row of products) {
    const image_url = remap(row.image_url, urlMap)
    const gallery_urls = (row.gallery_urls ?? []).map(url => remap(url, urlMap))
    const coverChanged = image_url !== row.image_url
    const galleryChanged = JSON.stringify(gallery_urls) !== JSON.stringify(row.gallery_urls ?? [])
    if (!coverChanged && !galleryChanged) continue
    const { error } = await supabase.from('products').update({ image_url, gallery_urls }).eq('id', row.id)
    if (error) {
      console.error(`product ${row.id}: ${error.message}`)
      continue
    }
    updated += 1
  }

  for (const row of banners) {
    const image_url = remap(row.image_url, urlMap)
    if (image_url === row.image_url) continue
    const { error } = await supabase.from('banners').update({ image_url }).eq('id', row.id)
    if (error) {
      console.error(`banner ${row.id}: ${error.message}`)
      continue
    }
    updated += 1
  }

  for (const row of packages) {
    const image_url = remap(row.image_url, urlMap)
    if (image_url === row.image_url) continue
    const { error } = await supabase.from('homepage_packages').update({ image_url }).eq('id', row.id)
    if (error) {
      console.error(`package ${row.id}: ${error.message}`)
      continue
    }
    updated += 1
  }

  for (const row of categories) {
    const image_url = remap(row.image_url, urlMap)
    if (image_url === row.image_url) continue
    const { error } = await supabase.from('categories').update({ image_url }).eq('id', row.id)
    if (error) {
      console.error(`category ${row.id}: ${error.message}`)
      continue
    }
    updated += 1
  }

  for (const row of campaigns) {
    const banner_url = remap(row.banner_url, urlMap)
    if (banner_url === row.banner_url) continue
    const { error } = await supabase.from('campaigns').update({ banner_url }).eq('id', row.id)
    if (error) {
      console.error(`campaign ${row.id}: ${error.message}`)
      continue
    }
    updated += 1
  }

  for (const row of brands) {
    const logo_url = remap(row.logo_url, urlMap)
    if (logo_url === row.logo_url) continue
    const { error } = await supabase.from('brands').update({ logo_url }).eq('id', row.id)
    if (error) {
      console.error(`brand ${row.id}: ${error.message}`)
      continue
    }
    updated += 1
  }

  for (const [oldUrl, newUrl] of urlMap) {
    const { error, count } = await supabase
      .from('order_items')
      .update({ product_image_url: newUrl }, { count: 'exact' })
      .eq('product_image_url', oldUrl)
    if (error) console.error(`order_items: ${error.message}`)
    else updated += count ?? 0
  }

  const byBucket = new Map()
  for (const oldUrl of urlMap.keys()) {
    const stored = supabaseStoragePathFromUrl(oldUrl)
    if (!stored) continue
    const list = byBucket.get(stored.bucket) ?? []
    list.push(stored.path)
    byBucket.set(stored.bucket, list)
  }

  let removed = 0
  for (const [bucket, paths] of byBucket) {
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100)
      const { error } = await supabase.storage.from(bucket).remove(chunk)
      if (error) console.error(`storage ${bucket}: ${error.message}`)
      else removed += chunk.length
    }
  }

  console.log(`Uploaded ${urlMap.size}, failed ${failed}, rows updated ${updated}, storage files removed ${removed}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
