import type { SupabaseClient } from '@supabase/supabase-js'
import { createProductItem, updateProductItem, updateOrderItem, type PlanItem } from './schemas'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

const SYSTEM_PROMPT = `Ti je asistent i brendshëm për adminin e dyqanit ProHygiene (produkte higjiene, Kosovë). Ndihmon adminin të shtojë e ndryshojë produkte dhe të përditësojë statuset e porosive pa punë manuale.

Çfarë mund të bësh:
- Produkte: krijim, ndryshim i çmimit/ofertës/stokut/kategorisë/brendit/përshkrimit, aktivizim ose çaktivizim.
- Porosi: ndryshim i statusit të porosisë (pending = Në pritje, processing = Në përpunim, completed = Përfunduar) dhe i statusit të pagesës (pending, approved = Aprovuar/paguar, declined, cancelled, needs_clarification).
- Nuk fshin asgjë. Produkt: is_active=false. Porosi: nuk mund të fshihet.

Si punon:
- Përgjigju shqip, shkurt, natyrshëm, pa emoji. Kupton kërkesa të lira, shkrim me gabime, dhe lista të ngjitura nga Excel ose mesazhe.
- Nuk ekzekuton ndryshime vetë. Vetëm PROPOZON me mjetet propose_*; admini i shikon dhe i konfirmon.
- Mos pyet kot. Nëse kërkesa është e qartë, propozo direkt. Pyet vetëm kur mungon diçka që nuk mund ta gjesh me mjetet (p.sh. çmimi i një produkti të ri).
- Për porosi: thirr search_orders për ta gjetur porosinë (sipas numrit, emrit të klientit, telefonit, ose filtrit të statusit). Përdor order_number të saktë nga rezultati. Kërkesa si "të gjitha porositë e dorëzuara pa pagesë të shënuar" zgjidhen me filtra, jo me hamendje.
- Nëse një kërkesë përputhet me disa porosi ose produkte dhe nuk është e qartë cila, listoji dhe pyet.
- Kur një porosi shënohet "completed", sistemi zbret stokun automatikisht; përmende këtë shkurt kur propozon.
- Për pagesë me para në dorëzim që është dorëzuar, statusi i pagesës i duhur është approved.
- Para se të propozosh produkte me kategori ose brend, thirr list_categories / list_brands dhe përdor emrat e saktë. Nëse kategoria nuk ekziston, lëre bosh dhe thuaje.
- Për produkte ekzistuese gjeji me search_products dhe përdor SKU e saktë; mos shpik SKU.
- Për produkte të reja pa SKU, lëre bosh (gjenerohet vetë). Çmimet janë në euro me TVSH. Mos shpik çmime, sasi apo përshkrime.
- Pas propozimit, përmbledh në një a dy fjali çfarë u propozua dhe kujtoje që duhet konfirmuar.
- Nëse kërkesa është jashtë këtyre mundësive (p.sh. fshirje, banera, kampanja, klientë), thuaje shkurt që nuk e bën dhe sugjero ku ta bëjë adminin.`

const tools = [
  {
    type: 'function',
    function: {
      name: 'list_categories',
      description: 'Liston kategoritë ekzistuese (emri shqip).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_brands',
      description: 'Liston brendet ekzistuese.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Kërkon produkte ekzistuese sipas emrit ose SKU. Kthen deri në 15.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_orders',
      description: 'Kërkon porosi. Të gjitha filtrat janë opsionalë. Kthen deri në 25, më të rejat së pari.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Numri i porosisë, emri ose telefoni i klientit' },
          status: { type: 'string', enum: ['pending', 'processing', 'completed'] },
          payment_status: { type: 'string', enum: ['pending', 'approved', 'declined', 'cancelled', 'needs_clarification'] },
          payment_method: { type: 'string', enum: ['card', 'cash_on_delivery'] },
          older_than_hours: { type: 'number', description: 'Vetëm porosi më të vjetra se kaq orë' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_update_orders',
      description: 'Propozon ndryshim të statusit të porosisë dhe/ose të pagesës (pret konfirmim).',
      parameters: {
        type: 'object',
        properties: {
          updates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                order_number: { type: 'string' },
                status: { type: 'string', enum: ['pending', 'processing', 'completed'] },
                payment_status: { type: 'string', enum: ['pending', 'approved', 'declined', 'cancelled', 'needs_clarification'] },
              },
              required: ['order_number'],
            },
          },
        },
        required: ['updates'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_create_products',
      description: 'Propozon krijimin e produkteve të reja (pret konfirmim nga admini).',
      parameters: {
        type: 'object',
        properties: {
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name_sq: { type: 'string' },
                name_en: { type: 'string' },
                sku: { type: 'string' },
                description_sq: { type: 'string' },
                price: { type: 'number' },
                sale_price: { type: 'number' },
                stock: { type: 'integer' },
                unit: { type: 'string', enum: ['cope', 'pako', 'ml'] },
                audience_type: { type: 'string', enum: ['home', 'business', 'both'] },
                category_name: { type: 'string' },
                brand_name: { type: 'string' },
                is_active: { type: 'boolean' },
                is_featured: { type: 'boolean' },
              },
              required: ['name_sq', 'price'],
            },
          },
        },
        required: ['products'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_update_products',
      description: 'Propozon ndryshime te produkte ekzistuese, të identifikuara me SKU (pret konfirmim).',
      parameters: {
        type: 'object',
        properties: {
          updates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                sku: { type: 'string' },
                name_sq: { type: 'string' },
                description_sq: { type: 'string' },
                price: { type: 'number' },
                sale_price: { type: ['number', 'null'] },
                stock: { type: 'integer' },
                audience_type: { type: 'string', enum: ['home', 'business', 'both'] },
                category_name: { type: 'string' },
                brand_name: { type: 'string' },
                is_active: { type: 'boolean' },
                is_featured: { type: 'boolean' },
                is_best_seller: { type: 'boolean' },
              },
              required: ['sku'],
            },
          },
        },
        required: ['updates'],
      },
    },
  },
]

type GroqMessage = {
  role: string
  content: string | null
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>
  tool_call_id?: string
  name?: string
}

function clean<T extends Record<string, unknown>>(o: T): T {
  // Models sometimes send "" or null for omitted optional fields.
  return Object.fromEntries(
    Object.entries(o).filter(([k, v]) => v !== '' && !(v === null && k !== 'sale_price')),
  ) as T
}

export async function runAssistant(
  supabase: SupabaseClient,
  history: ChatTurn[],
): Promise<{ reply: string; plan: PlanItem[] }> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY mungon në mjedisin e serverit.')

  const plan: PlanItem[] = []
  const messages: GroqMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(m => ({ role: m.role, content: m.content })),
  ]

  for (let round = 0; round < 6; round++) {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, temperature: 0.2, messages, tools, tool_choice: 'auto' }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) throw new Error(json?.error?.message ?? `Groq HTTP ${res.status}`)

    const msg = json?.choices?.[0]?.message as GroqMessage | undefined
    if (!msg) throw new Error('Përgjigje e zbrazët nga Groq')
    messages.push(msg)

    if (!msg.tool_calls?.length) return { reply: msg.content?.trim() || 'U krye.', plan }

    for (const call of msg.tool_calls) {
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(call.function.arguments || '{}')
      } catch {}
      const result = await runTool(supabase, call.function.name, args, plan)
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        name: call.function.name,
        content: JSON.stringify(result),
      })
    }
  }
  return { reply: 'Kërkesa ishte shumë komplekse. Provo ta ndash në pjesë më të vogla.', plan }
}

async function runTool(
  supabase: SupabaseClient,
  name: string,
  args: Record<string, unknown>,
  plan: PlanItem[],
): Promise<unknown> {
  switch (name) {
    case 'list_categories': {
      const { data } = await supabase.from('categories').select('name_sq').order('name_sq').limit(200)
      return { categories: (data ?? []).map(c => c.name_sq) }
    }
    case 'list_brands': {
      const { data } = await supabase.from('brands').select('name').order('name').limit(200)
      return { brands: (data ?? []).map(b => b.name) }
    }
    case 'search_products': {
      const q = String(args.query ?? '').replace(/[%,()*\\]/g, ' ').trim().slice(0, 80)
      if (!q) return { products: [] }
      const { data } = await supabase
        .from('products')
        .select('sku, name_sq, price, sale_price, stock, is_active')
        .or(`name_sq.ilike.%${q}%,sku.ilike.%${q}%`)
        .limit(15)
      return { products: data ?? [] }
    }
    case 'propose_create_products': {
      const items = Array.isArray(args.products) ? args.products : []
      const errors: string[] = []
      for (const raw of items) {
        const parsed = createProductItem.safeParse(clean({ ...(raw as object), type: 'create_product' }))
        if (parsed.success) plan.push(parsed.data)
        else errors.push(`${(raw as { name_sq?: string }).name_sq ?? '?'}: ${parsed.error.issues[0]?.message}`)
      }
      return { queued: items.length - errors.length, errors }
    }
    case 'propose_update_products': {
      const items = Array.isArray(args.updates) ? args.updates : []
      const errors: string[] = []
      for (const raw of items) {
        const parsed = updateProductItem.safeParse(clean({ ...(raw as object), type: 'update_product' }))
        if (parsed.success) plan.push(parsed.data)
        else errors.push(`${(raw as { sku?: string }).sku ?? '?'}: ${parsed.error.issues[0]?.message}`)
      }
      return { queued: items.length - errors.length, errors }
    }
    case 'search_orders': {
      let q = supabase
        .from('orders')
        .select('order_number, customer_name, customer_phone, total, status, payment_status, payment_method, created_at, falcon_status_name')
        .order('created_at', { ascending: false })
        .limit(25)
      const text = String(args.query ?? '').replace(/[%,()*\\]/g, ' ').trim().slice(0, 80)
      if (text) q = q.or(`order_number.ilike.%${text}%,customer_name.ilike.%${text}%,customer_phone.ilike.%${text}%`)
      if (typeof args.status === 'string') q = q.eq('status', args.status)
      if (typeof args.payment_status === 'string') q = q.eq('payment_status', args.payment_status)
      if (typeof args.payment_method === 'string') q = q.eq('payment_method', args.payment_method)
      if (typeof args.older_than_hours === 'number') {
        q = q.lt('created_at', new Date(Date.now() - args.older_than_hours * 3600_000).toISOString())
      }
      const { data } = await q
      return { orders: data ?? [] }
    }
    case 'propose_update_orders': {
      const items = Array.isArray(args.updates) ? args.updates : []
      const errors: string[] = []
      for (const raw of items) {
        const parsed = updateOrderItem.safeParse(clean({ ...(raw as object), type: 'update_order' }))
        if (parsed.success) plan.push(parsed.data)
        else errors.push(`${(raw as { order_number?: string }).order_number ?? '?'}: ${parsed.error.issues[0]?.message}`)
      }
      return { queued: items.length - errors.length, errors }
    }
    default:
      return { error: `Mjet i panjohur: ${name}` }
  }
}
