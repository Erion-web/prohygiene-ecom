import { createHmac, timingSafeEqual } from 'crypto'

// Falcon Posta signs each webhook body with HMAC-SHA256 using the seller's
// webhook secret, sent in a "Signature" header. Must be checked against the
// raw request bytes — re-serializing the parsed JSON can change key order /
// whitespace and silently break verification.
export function verifyFalconSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.FALCON_WEBHOOK_SECRET
  if (!secret || !signature) return false

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const expectedBuf = Buffer.from(expected, 'utf8')
  const givenBuf = Buffer.from(signature, 'utf8')
  if (expectedBuf.length !== givenBuf.length) return false

  return timingSafeEqual(expectedBuf, givenBuf)
}

// ── Outbound API (Create Order etc.) ─────────────────────────────────────

const KOSOVO_COUNTRY_ID = 1 // confirmed from the Create Order example response

class FalconApiError extends Error {}

function getBaseUrl(): string {
  const base = process.env.FALCON_API_BASE_URL
  if (!base) throw new FalconApiError('FALCON_API_BASE_URL is not set')
  return base.replace(/\/$/, '')
}

async function falconRequest<T>(path: string, params?: Record<string, string | number | boolean | undefined>, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'): Promise<T> {
  const token = process.env.FALCON_API_TOKEN
  if (!token) throw new FalconApiError('FALCON_API_TOKEN is not set')

  const url = new URL(`${getBaseUrl()}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue
      url.searchParams.set(key, String(value))
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.success) {
    throw new FalconApiError(body?.message ?? `Falcon API request failed (${res.status})`)
  }
  return body.data as T
}

// Strips combining diacritical marks (U+0300–U+036F) after NFD decomposition,
// so "Prishtinë" and "Prishtine" match — Falcon's city names and ours don't
// always agree on diacritics.
function normalizeCityName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

interface FalconCity {
  id: number
  name: string
}

let cityCache: { at: number; cities: FalconCity[] } | null = null
const CITY_CACHE_MS = 10 * 60 * 1000

async function getFalconCities(): Promise<FalconCity[]> {
  if (cityCache && Date.now() - cityCache.at < CITY_CACHE_MS) return cityCache.cities
  const cities = await falconRequest<FalconCity[]>('/helpers/cities')
  cityCache = { at: Date.now(), cities }
  return cities
}

// Known spelling differences between our city list and Falcon's — verified
// against their live /helpers/cities response. Keyed by our normalized name.
const CITY_NAME_ALIASES: Record<string, string> = {
  [normalizeCityName('Vitia')]: normalizeCityName('Viti'),
}

export async function findFalconCityId(cityName: string): Promise<number | null> {
  const cities = await getFalconCities()
  const target = normalizeCityName(cityName)
  const aliased = CITY_NAME_ALIASES[target]
  const match = cities.find(c => {
    const n = normalizeCityName(c.name)
    return n === target || n === aliased
  })
  return match?.id ?? null
}

export interface CreateFalconOrderInput {
  customOrderId: string
  customerName: string
  customerPhone: string
  customerAddress: string
  cityId: number
  productName: string
  productDescription?: string
  productPrice: number
  additionalInfo?: string
}

export interface FalconOrder {
  id: string
  custom_id: string | null
  status: { id: number; name: string }
}

export async function createFalconOrder(input: CreateFalconOrderInput): Promise<FalconOrder> {
  return falconRequest<FalconOrder>('/orders', {
    custom_id: input.customOrderId,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    customer_address: input.customerAddress,
    country_id: KOSOVO_COUNTRY_ID,
    city_id: input.cityId,
    product_name: input.productName,
    product_description: input.productDescription,
    product_price: input.productPrice.toFixed(2),
    additional_info: input.additionalInfo,
  }, 'POST')
}
