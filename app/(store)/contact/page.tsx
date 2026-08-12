'use client'

import { useState } from 'react'
import { Phone, Mail, MapPin, Clock, Send, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import type { Metadata } from 'next'

export default function ContactPage() {
  const { lang } = useLanguageStore()
  const tr = t(lang)
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success(tr.contact.success)
    setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    setSending(false)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <section className="bg-surface-soft border-b border-surface-border py-12">
        <div className="container-custom text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-3">
            {tr.contact.title}
          </h1>
          <p className="text-text-secondary text-lg">{tr.contact.subtitle}</p>
        </div>
      </section>

      <section className="section">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Info */}
            <div className="space-y-6">
              {[
                {
                  icon: Phone,
                  title: lang === 'sq' ? 'Telefoni' : 'Phone',
                  lines: ['046 10 80 40'],
                  href: 'tel:+38346108040',
                },
                {
                  icon: Mail,
                  title: 'Email',
                  lines: ['info@prohygiene.shop'],
                  href: 'mailto:info@prohygiene.shop',
                },
                {
                  icon: MapPin,
                  title: tr.contact.address,
                  lines: ['Rruga Nënë Tereza', 'Prishtinë 10000, Kosovë'],
                },
                {
                  icon: Clock,
                  title: tr.contact.workingHours,
                  lines: [
                    lang === 'sq' ? 'Hënë–Premte: 08:00–17:00' : 'Mon–Fri: 08:00–17:00',
                    lang === 'sq' ? 'Shtunë: 09:00–13:00' : 'Sat: 09:00–13:00',
                  ],
                },
              ].map(({ icon: Icon, title, lines, href }) => (
                <div key={title} className="card p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm mb-1">{title}</p>
                    {lines.map(line =>
                      href ? (
                        <a key={line} href={href} className="block text-text-secondary text-sm hover:text-brand-600 transition-colors">{line}</a>
                      ) : (
                        <p key={line} className="text-text-secondary text-sm">{line}</p>
                      )
                    )}
                  </div>
                </div>
              ))}

              {/* Business inquiries */}
              <div className="card p-5 bg-gradient-to-br from-brand-50 to-white border-brand-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                    <Building2 size={18} className="text-brand-600" />
                  </div>
                  <p className="font-bold text-text-primary text-sm">{tr.contact.businessInquiries}</p>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed">{tr.contact.businessInquiriesDesc}</p>
                <a href="mailto:info@prohygiene.shop" className="text-brand-600 text-xs font-semibold mt-2 block hover:text-brand-700">
                  info@prohygiene.shop
                </a>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="card p-8">
                <h2 className="text-xl font-bold text-text-primary mb-6">
                  {lang === 'sq' ? 'Dërgoni Mesazh' : 'Send a Message'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label">{tr.contact.name} *</label>
                      <input type="text" required className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Emri Mbiemri" />
                    </div>
                    <div>
                      <label className="label">{tr.contact.email} *</label>
                      <input type="email" required className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                    </div>
                    <div>
                      <label className="label">{tr.contact.phone}</label>
                      <input type="tel" className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="046 10 80 40" />
                    </div>
                    <div>
                      <label className="label">{tr.contact.subject} *</label>
                      <input type="text" required className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder={lang === 'sq' ? 'Subjekti...' : 'Subject...'} />
                    </div>
                  </div>
                  <div>
                    <label className="label">{tr.contact.message} *</label>
                    <textarea required className="input resize-none h-32" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder={lang === 'sq' ? 'Shkruani mesazhin tuaj...' : 'Write your message...'} />
                  </div>
                  <button type="submit" disabled={sending} className="btn-primary py-3 px-8">
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        {tr.contact.sending}
                      </span>
                    ) : (
                      <><Send size={16} /> {tr.contact.send}</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
