'use client'

import { useState } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
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

  if (!isOpen) return null

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-elevated max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-white border-b border-surface-border px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-lg font-extrabold text-text-primary">{tr.lease.inquiryTitle}</h2>
            <p className="text-sm text-text-muted mt-0.5">{tr.lease.inquirySubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:bg-surface-soft transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">{tr.checkout.customerName}</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">{tr.checkout.email}</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">{tr.checkout.phone}</label>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">{tr.checkout.businessName}</label>
            <input
              value={form.company}
              onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">{tr.contact.message}</label>
            <textarea
              rows={4}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              className="input resize-none"
              placeholder={tr.lease.messagePlaceholder}
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className={cn('btn-primary w-full py-3.5', sending && 'opacity-70 cursor-wait')}
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {sending ? tr.lease.sending : tr.lease.submitInquiry}
          </button>
        </form>
      </div>
    </div>
  )
}
