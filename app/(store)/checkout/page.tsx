'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck, CreditCard, Truck, ChevronRight, Loader2, RefreshCw, X, Calendar, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore } from '@/store/cart'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { formatPrice, getProductName, generateOrderNumber } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { CheckoutFormData, CustomerType, PaymentMethod } from '@/types'

type RepeatFreq = 'weekly' | 'biweekly' | 'monthly' | 'custom'

function nextDate(freq: Exclude<RepeatFreq, 'custom'>): string {
  const d = new Date()
  if (freq === 'weekly')   d.setDate(d.getDate() + 7)
  if (freq === 'biweekly') d.setDate(d.getDate() + 14)
  if (freq === 'monthly')  d.setMonth(d.getMonth() + 1)
  return d.toISOString().split('T')[0]
}

interface RepeatModalProps {
  items: { productId: string; productName: string; quantity: number }[]
  userId: string | null
  customerName: string
  customerEmail: string
  redirectUrl: string
  onDone: (url: string) => void
}

function RepeatModal({ items, userId, customerName, customerEmail, redirectUrl, onDone }: RepeatModalProps) {
  const [freq, setFreq] = useState<RepeatFreq | null>(null)
  const [customDate, setCustomDate] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const freqOptions: { key: RepeatFreq; label: string; desc: string }[] = [
    { key: 'weekly',   label: 'Çdo javë',   desc: '4× në muaj' },
    { key: 'biweekly', label: 'Çdo 2 javë', desc: '2× në muaj' },
    { key: 'monthly',  label: 'Çdo muaj',   desc: '1× në muaj' },
    { key: 'custom',   label: 'Datë vetë',  desc: 'Zgjedh datën' },
  ]

  const handleRepeat = async () => {
    if (!freq) return
    if (freq === 'custom' && !customDate) { toast.error('Zgjedh datën'); return }
    if (!userId && password.length < 6) { toast.error('Fjalëkalimi duhet të ketë të paktën 6 shkronja'); return }
    setSaving(true)

    let uid = userId

    // Guest checkout: no account yet, so create one on the spot — subscriptions
    // need a real Supabase Auth user to belong to.
    if (!uid) {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: customerEmail,
        password,
        options: { data: { full_name: customerName } },
      })
      if (error) {
        toast.error(
          error.message === 'User already registered'
            ? 'Ky email ka tashmë llogari — hyni në llogarinë tuaj për të krijuar paketën periodike.'
            : error.message
        )
        setSaving(false)
        return
      }
      uid = data.user?.id ?? null
      if (!uid) {
        toast.error('Diçka shkoi keq gjatë krijimit të llogarisë.')
        setSaving(false)
        return
      }
    }

    const orderDate = freq === 'custom' ? customDate : nextDate(freq as Exclude<RepeatFreq, 'custom'>)
    const dbFreq = freq === 'custom' ? 'monthly' : freq

    const res = await fetch('/api/subscriptions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: uid, items, frequency: dbFreq, next_order_date: orderDate }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      toast.error(data.error ?? 'Gabim')
      setSaving(false)
      return
    }

    toast.success(userId ? 'Paketa periodike u krijua!' : 'Llogaria u krijua dhe paketa periodike u aktivizua!')
    onDone(redirectUrl)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <RefreshCw size={20} className="text-brand-600" />
            </div>
            <div>
              <h2 className="font-extrabold text-text-primary text-base">Bëjeni këtë porosi periodike?</h2>
            </div>
          </div>
          <button onClick={() => onDone(redirectUrl)} className="p-1.5 rounded-xl hover:bg-surface-muted text-text-muted transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed mb-5">
          Me ProHygiene mund t&apos;i bëni porositë tuaja periodike — dërgohen vetë, automatikisht,
          çdo javë, çdo 2 javë ose çdo muaj. Ose zgjidhni vetë datën nga kalendari, sa shpesh të doni.
        </p>

        {/* Frequency grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {freqOptions.map(({ key, label, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFreq(key)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                freq === key
                  ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                  : 'border-surface-border hover:border-brand-200'
              }`}
            >
              <p className={`text-sm font-bold ${freq === key ? 'text-brand-700' : 'text-text-primary'}`}>{label}</p>
              <p className="text-xs text-text-muted mt-0.5">{desc}</p>
            </button>
          ))}
        </div>

        {/* Custom date */}
        {freq === 'custom' && (
          <div className="mb-4">
            <label className="label flex items-center gap-1.5"><Calendar size={13} /> Data e porosisë tjetër</label>
            <input
              type="date"
              value={customDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setCustomDate(e.target.value)}
              className="input"
            />
          </div>
        )}

        {/* Guest inline account creation */}
        {!userId && freq && (
          <div className="mb-4 p-3.5 rounded-2xl bg-surface-soft border border-surface-border">
            <p className="text-xs text-text-secondary mb-2.5">
              Për t&apos;i aktivizuar porositë periodike duhet një llogari — po e krijojmë me <strong>{customerEmail}</strong>, ju vetëm zgjidhni fjalëkalimin.
            </p>
            <label className="label text-xs">Fjalëkalimi</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Të paktën 6 shkronja"
              className="input"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onDone(redirectUrl)}
            className="flex-1 py-2.5 rounded-xl border border-surface-border text-sm font-semibold text-text-secondary hover:bg-surface-muted transition-colors"
          >
            Jo, faleminderit
          </button>
          <button
            onClick={handleRepeat}
            disabled={!freq || saving || (freq === 'custom' && !customDate) || (!userId && password.length < 6)}
            className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            {saving ? 'Duke ruajtur...' : 'Po, krijo paketën'}
          </button>
        </div>
      </div>
    </div>
  )
}

const CITIES = [
  'Prishtinë', 'Ferizaj', 'Gjakovë', 'Gjilan', 'Mitrovicë',
  'Pejë', 'Prizren', 'Vushtrri', 'Suharrekë', 'Rahovec',
  'Dragash', 'Malishevë', 'Lipjan', 'Podujevë', 'Skenderaj',
]

export default function CheckoutPage() {
  const router = useRouter()
  const { lang } = useLanguageStore()
  const tr = t(lang)
  const { items, getTotal, getDiscount, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({})
  const [repeatModal, setRepeatModal] = useState<{
    items: { productId: string; productName: string; quantity: number }[]
    userId: string | null
    customerName: string
    customerEmail: string
    redirectUrl: string
  } | null>(null)

  const [form, setForm] = useState<CheckoutFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_type: 'individual',
    business_name: '',
    fiscal_number: '',
    city: '',
    address: '',
    notes: '',
    payment_method: 'card',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setForm(prev => ({ ...prev, customer_email: user.email ?? prev.customer_email }))
      supabase
        .from('profiles')
        .select('full_name, phone, city, address, customer_type, business_name, fiscal_number')
        .eq('id', user.id)
        .single()
        .then(({ data: profile }) => {
          if (!profile) return
          setForm(prev => ({
            ...prev,
            customer_name: profile.full_name ?? prev.customer_name,
            customer_phone: profile.phone ?? prev.customer_phone,
            city: profile.city ?? prev.city,
            address: profile.address ?? prev.address,
            customer_type: (profile.customer_type as CustomerType) ?? prev.customer_type,
            business_name: profile.business_name ?? prev.business_name,
            fiscal_number: profile.fiscal_number ?? prev.fiscal_number,
          }))
        })
    })
  }, [])

  const total = getTotal()
  const discount = getDiscount()
  const shipping = total >= 30 ? 0 : 3
  const couponDiscount = total >= 50 ? 5 : 0
  const finalTotal = total + shipping - couponDiscount

  const update = (key: keyof CheckoutFormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CheckoutFormData, string>> = {}
    const required: (keyof CheckoutFormData)[] = ['customer_name', 'customer_email', 'customer_phone', 'city', 'address']
    for (const field of required) {
      if (!form[field]) newErrors[field] = tr.checkout.requiredField
    }
    if (form.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) {
      newErrors.customer_email = tr.checkout.invalidEmail
    }
    if (form.customer_type === 'business' && !form.business_name) {
      newErrors.business_name = tr.checkout.requiredField
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error(tr.checkout.fillRequired)
      return
    }

    if (items.length === 0) {
      router.push('/cart')
      return
    }

    setLoading(true)

    try {
      // Get current user (optional — guest checkout works too)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const orderPayload = {
        user_id: user?.id ?? null,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        customer_type: form.customer_type,
        business_name: form.business_name || null,
        fiscal_number: form.fiscal_number || null,
        city: form.city,
        address: form.address,
        notes: form.notes || null,
        subtotal: total + discount,
        discount_amount: discount + couponDiscount,
        shipping_cost: shipping,
        vat_amount: finalTotal * 0.18,
        total: finalTotal,
        status: 'pending',
        payment_method: form.payment_method,
        payment_status: 'pending',
      }

      const orderItems = items.map(item => ({
        product_id: item.product.id,
        product_name_sq: item.product.name_sq,
        product_name_en: item.product.name_en,
        product_sku: item.product.sku,
        product_image_url: item.product.image_url,
        unit_price: item.product.price,
        sale_price: item.effectivePrice < item.product.price ? item.effectivePrice : null,
        quantity: item.quantity,
        subtotal: item.effectivePrice * item.quantity,
      }))

      // Create order via server API (uses service role — works for guests too)
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderPayload, items: orderItems }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok || orderData.error) throw new Error(orderData.error ?? 'Failed to create order')
      const order = orderData.order

      let redirectUrl = `/order-success?order=${order.order_number}`

      if (form.payment_method === 'card') {
        const res = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            order_number: order.order_number,
            amount: finalTotal,
            email: form.customer_email,
            lang,
          }),
        })
        const paymentData = await res.json()
        if (!res.ok || paymentData.error) throw new Error(paymentData.error ?? 'Payment initiation failed')
        if (paymentData.redirect_url) redirectUrl = paymentData.redirect_url
      }

      // Save cart items before clearing
      const savedItems = items.map(i => ({
        productId: i.product.id,
        productName: i.product.name_sq,
        quantity: i.quantity,
      }))
      clearCart()

      // Always offer a repeat/periodic order — guests get an inline account
      // creation step inside the modal since subscriptions need a real user.
      setRepeatModal({
        items: savedItems,
        userId: user?.id ?? null,
        customerName: form.customer_name,
        customerEmail: form.customer_email,
        redirectUrl,
      })
      setLoading(false)
    } catch (err) {
      console.error(err)
      toast.error(tr.common.error)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0 && !repeatModal) {
    return (
      <div className="section">
        <div className="container-custom text-center">
          <p className="text-text-muted mb-4">{tr.cart.empty}</p>
          <Link href="/shop" className="btn-primary">{tr.cart.continueShopping}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in pb-24 lg:pb-0">
      {repeatModal && (
        <RepeatModal
          items={repeatModal.items}
          userId={repeatModal.userId}
          customerName={repeatModal.customerName}
          customerEmail={repeatModal.customerEmail}
          redirectUrl={repeatModal.redirectUrl}
          onDone={url => { setRepeatModal(null); window.location.href = url }}
        />
      )}
      <div className="bg-surface-soft border-b border-surface-border">
        <div className="container-custom py-6">
          <h1 className="text-2xl font-extrabold text-text-primary">{tr.checkout.title}</h1>
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
            <Link href="/cart" className="hover:text-brand-600 transition-colors">{tr.cart.title}</Link>
            <ChevronRight size={12} />
            <span className="text-brand-600 font-semibold">{tr.checkout.title}</span>
          </div>
        </div>
      </div>

      <div className="container-custom py-4 sm:py-8">
        <form id="checkout-form" onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Info */}
              <div className="card p-6">
                <h2 className="font-bold text-text-primary mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                  {tr.checkout.personalInfo}
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">{tr.checkout.customerName} *</label>
                    <input
                      type="text"
                      value={form.customer_name}
                      onChange={e => update('customer_name', e.target.value)}
                      className={`input ${errors.customer_name ? 'input-error' : ''}`}
                      placeholder="Emri Mbiemri"
                    />
                    {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
                  </div>
                  <div>
                    <label className="label">{tr.checkout.phone} *</label>
                    <input
                      type="tel"
                      value={form.customer_phone}
                      onChange={e => update('customer_phone', e.target.value)}
                      className={`input ${errors.customer_phone ? 'input-error' : ''}`}
                      placeholder="046 10 80 40"
                    />
                    {errors.customer_phone && <p className="text-red-500 text-xs mt-1">{errors.customer_phone}</p>}
                  </div>
                  <div>
                    <label className="label">{tr.checkout.email} *</label>
                    <input
                      type="email"
                      value={form.customer_email}
                      onChange={e => update('customer_email', e.target.value)}
                      className={`input ${errors.customer_email ? 'input-error' : ''}`}
                      placeholder="email@example.com"
                    />
                    {errors.customer_email && <p className="text-red-500 text-xs mt-1">{errors.customer_email}</p>}
                  </div>

                  <div>
                    <label className="label">{tr.checkout.customerType}</label>
                    <div className="flex gap-3">
                      {(['individual', 'business'] as CustomerType[]).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => update('customer_type', type)}
                          className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                            form.customer_type === type
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-surface-border text-text-secondary hover:border-brand-200'
                          }`}
                        >
                          {type === 'individual' ? tr.checkout.individual : tr.checkout.business}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.customer_type === 'business' && (
                    <>
                      <div>
                        <label className="label">{tr.checkout.businessName} *</label>
                        <input
                          type="text"
                          value={form.business_name}
                          onChange={e => update('business_name', e.target.value)}
                          className={`input ${errors.business_name ? 'input-error' : ''}`}
                          placeholder="Emri i Kompanisë"
                        />
                        {errors.business_name && <p className="text-red-500 text-xs mt-1">{errors.business_name}</p>}
                      </div>
                      <div>
                        <label className="label">{tr.checkout.fiscalNumber}</label>
                        <input
                          type="text"
                          value={form.fiscal_number}
                          onChange={e => update('fiscal_number', e.target.value)}
                          className="input"
                          placeholder="XXX-XXXXXXXXX-X"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Delivery */}
              <div className="card p-6">
                <h2 className="font-bold text-text-primary mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  {tr.checkout.deliveryInfo}
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">{tr.checkout.city} *</label>
                    <select
                      value={form.city}
                      onChange={e => update('city', e.target.value)}
                      className={`input ${errors.city ? 'input-error' : ''}`}
                    >
                      <option value="">{tr.checkout.selectCity}</option>
                      {CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">{tr.checkout.address} *</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={e => update('address', e.target.value)}
                      className={`input ${errors.address ? 'input-error' : ''}`}
                      placeholder="Rruga, numri i shtëpisë..."
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">{tr.checkout.notes}</label>
                    <textarea
                      value={form.notes}
                      onChange={e => update('notes', e.target.value)}
                      className="input resize-none h-20"
                      placeholder={tr.checkout.notesPlaceholder}
                    />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="card p-6">
                <h2 className="font-bold text-text-primary mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                  {tr.checkout.paymentMethod}
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  {([
                    { value: 'card', icon: CreditCard, label: tr.checkout.cardPayment, desc: tr.checkout.cardDesc },
                    { value: 'cash_on_delivery', icon: Truck, label: tr.checkout.cashOnDelivery, desc: tr.checkout.cashDesc },
                  ] as const).map(({ value, icon: Icon, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update('payment_method', value)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                        form.payment_method === value
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-surface-border hover:border-brand-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        form.payment_method === value ? 'bg-brand-100' : 'bg-surface-muted'
                      }`}>
                        <Icon size={20} className={form.payment_method === value ? 'text-brand-600' : 'text-text-muted'} />
                      </div>
                      <p className={`font-semibold text-sm ${form.payment_method === value ? 'text-brand-700' : 'text-text-primary'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>

                {form.payment_method === 'card' && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-text-muted bg-surface-soft rounded-xl p-3">
                    <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0" />
                    {tr.checkout.securePayment}
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="card p-6 sticky top-20">
                <h2 className="font-bold text-text-primary mb-5">{tr.checkout.orderSummary}</h2>

                <div className="space-y-3 mb-5 max-h-52 overflow-y-auto">
                  {items.map(({ product, quantity, effectivePrice }) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-surface-soft">
                        {product.image_url ? (
                          <Image src={product.image_url} alt="" fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-xl">🧴</div>
                        )}
                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-brand-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center min-w-[18px] px-0.5">
                          {quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary line-clamp-1">
                          {getProductName(product, lang)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-text-primary flex-shrink-0">
                        {formatPrice(effectivePrice * quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-surface-border pt-4 space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{tr.cart.subtotal}</span>
                    <span>{formatPrice(total + discount)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>{tr.cart.discount}</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{tr.cart.shipping}</span>
                    <span className={shipping === 0 ? 'text-emerald-600 font-medium' : ''}>
                      {shipping === 0 ? tr.cart.free : formatPrice(shipping)}
                    </span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span className="flex items-center gap-1"><Tag size={12} />{tr.cart.coupon}</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-surface-border">
                    <span>{tr.cart.total}</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 justify-center text-base"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> {tr.checkout.processing}</>
                  ) : (
                    <>{tr.checkout.placeOrder}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Mobile sticky order button */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-surface-border px-4 pt-3 safe-bottom shadow-elevated">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted">{tr.cart.total}</p>
              <p className="font-extrabold text-text-primary">{formatPrice(finalTotal)}</p>
            </div>
            <button
              type="submit"
              form="checkout-form"
              disabled={loading}
              className="btn-primary py-3 px-6 gap-2 flex-1 justify-center"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> {tr.checkout.processing}</>
                : tr.checkout.placeOrder
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
