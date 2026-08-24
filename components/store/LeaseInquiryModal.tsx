'use client'

import { useState, useEffect } from 'react'
import { X, Send, Loader2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { getProductName } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { LeaseModalIllustration } from '@/components/store/lease/LeaseIllustrations'
import type { Product } from '@/types'

interface LeaseInquiryModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

export function LeaseInquiryModal({ product, isOpen, onClose }: LeaseInquiryModalProps) {
  const { lang } = useLanguageStore()
  const tr = t(lang)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' })
  const [sending, setSending] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      const t = setTimeout(() => setVisible(false), 280)
      document.body.style.overflow = ''
      return () => clearTimeout(t)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen && !visible) return null

  const productName = getProductName(product, lang)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/lease/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, ...form }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Failed')
      toast.success(tr.lease.inquirySuccess)
      setForm({ name: '', email: '', phone: '', company: '', message: '' })
      onClose()
    } catch {
      toast.error(tr.lease.inquiryError)
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lease-inquiry-title"
    >
      <div
        className="absolute inset-0 bg-brand-950/50 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={cn(
          'relative w-full sm:max-w-[520px] bg-white rounded-t-[1.75rem] sm:rounded-3xl shadow-elevated max-h-[92vh] overflow-hidden transition-all duration-300',
          isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 sm:translate-y-2 sm:scale-[0.98]'
        )}
      >
        <div className="relative bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-6 pt-6 pb-5 sm:px-8 sm:pt-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-start gap-4">
            <LeaseModalIllustration className="w-[88px] h-[70px] flex-shrink-0 hidden sm:block rounded-xl shadow-brand-sm" />
            <div className="min-w-0 pr-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-300 mb-1.5">
                {tr.lease.proLabel}
              </p>
              <h2 id="lease-inquiry-title" className="text-xl font-extrabold text-white tracking-tight leading-tight">
                {tr.lease.inquiryTitle}
              </h2>
              <p className="text-sm text-brand-100/80 mt-1.5 leading-relaxed">{tr.lease.inquirySubtitle}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-medium text-white truncate max-w-full">
                {productName}
                <ArrowRight size={12} className="flex-shrink-0 opacity-70" />
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 overflow-y-auto max-h-[calc(92vh-180px)]">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label text-xs font-semibold uppercase tracking-wide text-text-muted">{tr.checkout.customerName}</label>
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label text-xs font-semibold uppercase tracking-wide text-text-muted">{tr.checkout.email}</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label text-xs font-semibold uppercase tracking-wide text-text-muted">{tr.checkout.phone}</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label text-xs font-semibold uppercase tracking-wide text-text-muted">{tr.checkout.businessName}</label>
              <input
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label text-xs font-semibold uppercase tracking-wide text-text-muted">{tr.contact.message}</label>
              <textarea
                rows={3}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="input resize-none"
                placeholder={tr.lease.messagePlaceholder}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={sending}
            className={cn(
              'btn-primary w-full py-3.5 text-[15px] font-semibold shadow-brand-md',
              sending && 'opacity-70 cursor-wait'
            )}
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {sending ? tr.lease.sending : tr.lease.submitInquiry}
          </button>
        </form>
      </div>
    </div>
  )
}
