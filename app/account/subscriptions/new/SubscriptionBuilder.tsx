'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Minus, Trash2, Save, Loader2, RefreshCw, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface ProductRow {
  id: string
  sku: string
  name_sq: string
  price: number
  sale_price: number | null
  image_url: string | null
  gallery_urls: string[] | null
  unit: string
  category: { name_sq: string }[] | null
  brand: { name: string }[] | null
}

interface EditSub {
  id: string
  name: string
  frequency: string
  next_order_date: string
  notes: string | null
  items: { id: string; product_id: string; quantity: number }[]
}

interface Props {
  products: ProductRow[]
  editSub: EditSub | null
}

type Freq = 'weekly' | 'biweekly' | 'monthly'

const FREQ_OPTIONS: { key: Freq; label: string; desc: string }[] = [
  { key: 'weekly',   label: 'Çdo javë',   desc: '4× në muaj' },
  { key: 'biweekly', label: 'Çdo 2 javë', desc: '2× në muaj' },
  { key: 'monthly',  label: 'Çdo muaj',   desc: '1× në muaj' },
]

function productImg(p: ProductRow) {
  return p.image_url || p.gallery_urls?.[0] || null
}

function nextDateFromFreq(freq: Freq): string {
  const d = new Date()
  if (freq === 'weekly')   d.setDate(d.getDate() + 7)
  if (freq === 'biweekly') d.setDate(d.getDate() + 14)
  if (freq === 'monthly')  d.setMonth(d.getMonth() + 1)
  return d.toISOString().split('T')[0]
}

export function SubscriptionBuilder({ products, editSub }: Props) {
  const router = useRouter()
  const [loading, setLoading]  = useState(false)
  const [search, setSearch]    = useState('')
  const [name, setName]        = useState(editSub?.name ?? 'Paketa ime')
  const [freq, setFreq]        = useState<Freq>((editSub?.frequency as Freq) ?? 'monthly')
  const [nextDate, setNextDate] = useState(editSub?.next_order_date ?? nextDateFromFreq('monthly'))
  const [notes, setNotes]      = useState(editSub?.notes ?? '')

  const [basket, setBasket] = useState<Record<string, number>>(() => {
    if (!editSub) return {}
    return Object.fromEntries(editSub.items.map(i => [i.product_id, i.quantity]))
  })

  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products])

  const filtered = useMemo(() =>
    products.filter(p =>
      p.name_sq.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
  , [products, search])

  const setQty = (id: string, qty: number) => {
    setBasket(prev => {
      if (qty <= 0) { const next = { ...prev }; delete next[id]; return next }
      return { ...prev, [id]: qty }
    })
  }

  const basketItems = Object.entries(basket).map(([id, qty]) => ({
    product: productMap.get(id)!,
    qty,
  })).filter(x => x.product)

  const subtotal = basketItems.reduce((sum, { product: p, qty }) => {
    return sum + (p.sale_price ?? p.price) * qty
  }, 0)

  const handleSave = async () => {
    if (basketItems.length === 0) { toast.error('Shtoni të paktën një produkt'); return }
    setLoading(true)
    const supabase = createClient()

    if (editSub) {
      const { error } = await supabase
        .from('subscriptions')
        .update({ name, frequency: freq, next_order_date: nextDate, notes: notes || null })
        .eq('id', editSub.id)
      if (error) { toast.error(error.message); setLoading(false); return }

      await supabase.from('subscription_items').delete().eq('subscription_id', editSub.id)
      const { error: itemsErr } = await supabase.from('subscription_items').insert(
        basketItems.map(({ product: p, qty }) => ({
          subscription_id: editSub.id,
          product_id: p.id,
          quantity: qty,
        }))
      )
      if (itemsErr) { toast.error(itemsErr.message); setLoading(false); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Ju lutem kyçuni'); setLoading(false); return }
      const { data: sub, error } = await supabase
        .from('subscriptions')
        .insert({ name, frequency: freq, next_order_date: nextDate, notes: notes || null, user_id: user.id })
        .select()
        .single()
      if (error || !sub) { toast.error(error?.message ?? 'Gabim'); setLoading(false); return }

      const { error: itemsErr } = await supabase.from('subscription_items').insert(
        basketItems.map(({ product: p, qty }) => ({
          subscription_id: sub.id,
          product_id: p.id,
          quantity: qty,
        }))
      )
      if (itemsErr) { toast.error(itemsErr.message); setLoading(false); return }
    }

    toast.success(editSub ? 'Paketa u përditësua' : 'Paketa u krijua')
    router.push('/account/subscriptions')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Package details */}
      <div className="card p-5 space-y-4">
        <h2 className="font-bold text-text-primary">Detajet e Paketës</h2>

        <div>
          <label className="label">Emri i paketës</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="input" placeholder="p.sh. Paketa e Zyrës"
          />
        </div>

        <div>
          <label className="label">Frekuenca</label>
          <div className="grid grid-cols-3 gap-2">
            {FREQ_OPTIONS.map(({ key, label, desc }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setFreq(key); setNextDate(nextDateFromFreq(key)) }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  freq === key ? 'border-brand-500 bg-brand-50' : 'border-surface-border hover:border-brand-200'
                }`}
              >
                <p className={`text-sm font-semibold ${freq === key ? 'text-brand-700' : 'text-text-primary'}`}>
                  {label}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Data e porosisë tjetër</label>
          <input
            type="date"
            value={nextDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setNextDate(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="label">Shënime (opsionale)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="input resize-none h-16 text-sm"
            placeholder="Instruksione të veçanta..."
          />
        </div>
      </div>

      {/* Basket */}
      {basketItems.length > 0 && (
        <div className="card p-5 space-y-3">
          <h2 className="font-bold text-text-primary">Paketa ({basketItems.length} produkte)</h2>
          {basketItems.map(({ product: p, qty }) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-surface-border/50 last:border-0">
              {productImg(p)
                ? <img src={productImg(p)!} alt={p.name_sq} className="w-10 h-10 rounded-lg object-cover" />
                : <div className="w-10 h-10 rounded-lg bg-surface-muted flex items-center justify-center text-text-muted opacity-40"><ShoppingBag size={14} /></div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{p.name_sq}</p>
                <p className="text-xs text-text-muted">{(p.sale_price ?? p.price).toFixed(2)}€ / {p.unit}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setQty(p.id, qty - 1)} className="w-6 h-6 rounded-lg bg-surface-muted flex items-center justify-center hover:bg-surface-border">
                  <Minus size={11} />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                <button onClick={() => setQty(p.id, qty + 1)} className="w-6 h-6 rounded-lg bg-surface-muted flex items-center justify-center hover:bg-surface-border">
                  <Plus size={11} />
                </button>
                <button onClick={() => setQty(p.id, 0)} className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-50 ml-1">
                  <Trash2 size={11} />
                </button>
              </div>
              <p className="text-sm font-bold text-text-primary w-16 text-right">
                {((p.sale_price ?? p.price) * qty).toFixed(2)}€
              </p>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-text-secondary">Gjithsej / periudhë</span>
            <span className="text-base font-black text-text-primary">{subtotal.toFixed(2)}€</span>
          </div>
        </div>
      )}

      {/* Product picker */}
      <div className="card p-5 space-y-4">
        <h2 className="font-bold text-text-primary flex items-center gap-2">
          <ShoppingBag size={16} className="text-brand-500" />
          Shto Produkte
        </h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 text-sm"
            placeholder="Kërko produkt..."
          />
        </div>
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {filtered.map(p => {
            const qty = basket[p.id] ?? 0
            const price = p.sale_price ?? p.price
            return (
              <div key={p.id} className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-surface-soft">
                {productImg(p)
                  ? <img src={productImg(p)!} alt={p.name_sq} className="w-9 h-9 rounded-lg object-cover" />
                  : <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center text-text-muted opacity-40"><ShoppingBag size={13} /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{p.name_sq}</p>
                  <p className="text-xs text-text-muted">{price.toFixed(2)}€ / {p.unit}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {qty > 0 ? (
                    <>
                      <button onClick={() => setQty(p.id, qty - 1)} className="w-6 h-6 rounded-lg bg-surface-muted flex items-center justify-center hover:bg-surface-border">
                        <Minus size={11} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-brand-600">{qty}</span>
                      <button onClick={() => setQty(p.id, qty + 1)} className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700">
                        <Plus size={11} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setQty(p.id, 1)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100"
                    >
                      <Plus size={11} /> Shto
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={loading || basketItems.length === 0}
        className="btn-primary w-full py-3 justify-center gap-2 text-base"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {editSub ? 'Ruaj Ndryshimet' : 'Krijo Paketën'}
      </button>
    </div>
  )
}
