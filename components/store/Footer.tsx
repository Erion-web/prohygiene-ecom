'use client'

import Link from 'next/link'
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Send } from 'lucide-react'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Logo } from '@/components/ui/Logo'

export function Footer() {
  const { lang } = useLanguageStore()
  const tr = t(lang)
  const [email, setEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubscribing(true)
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Failed')
      toast.success(lang === 'sq' ? 'U regjistruat me sukses!' : 'Subscribed successfully!')
      setEmail('')
    } catch {
      toast.error(lang === 'sq' ? 'Diçka shkoi keq. Provoni përsëri.' : 'Something went wrong. Please try again.')
    } finally {
      setSubscribing(false)
    }
  }

  const quickLinks = [
    { href: '/', label: tr.nav.home },
    { href: '/shop', label: tr.nav.shop },
    { href: '/home-products', label: tr.nav.homeProducts },
    { href: '/business', label: tr.nav.business },
    { href: '/campaigns', label: tr.nav.campaigns },
    { href: '/about', label: tr.nav.about },
  ]

  const serviceLinks = [
    { href: '/contact', label: tr.footer.contact },
    { href: '/shipping', label: tr.footer.shipping },
    { href: '/returns', label: tr.footer.returns },
    { href: '/faq', label: tr.footer.faq },
    { href: '/privacy', label: tr.footer.privacy },
    { href: '/terms', label: tr.footer.terms },
  ]

  return (
    <footer className="bg-slate-950 text-white">
      <div className="container-custom py-10 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

          {/* Brand — full width on mobile */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <div style={{ filter: 'brightness(0) invert(1)' }}>
                <Logo size="md" />
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-xs">
              {tr.footer.description}
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-x-5">
              <a href="tel:+38346108040" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                <Phone size={14} className="text-brand-400 flex-shrink-0" />
                046 10 80 40
              </a>
              <a href="mailto:info@prohygiene.shop" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                <Mail size={14} className="text-brand-400 flex-shrink-0" />
                info@prohygiene.shop
              </a>
              <a
                href="https://maps.app.goo.gl/ecWZFJyh36TgnS1d7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                <MapPin size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
                Rruga Rexhep Krasniqi, Prishtinë
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 mb-4">
              {tr.footer.quickLinks}
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 mb-4">
              {tr.footer.customerService}
            </h4>
            <ul className="space-y-2.5">
              {serviceLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter + Social — full width on mobile */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 mb-4">
              {tr.footer.newsletter}
            </h4>
            <p className="text-slate-400 text-sm mb-3">
              {tr.footer.newsletterDesc}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={tr.footer.newsletterPlaceholder}
                className="flex-1 min-w-0 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
              />
              <button type="submit" disabled={subscribing} className="px-3.5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors flex items-center flex-shrink-0 disabled:opacity-60">
                <Send size={15} />
              </button>
            </form>

            <div className="mt-5">
              <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">{tr.footer.followUs}</p>
              <div className="flex gap-2.5">
                {[
                  { icon: Facebook, href: '#', label: 'Facebook' },
                  { icon: Instagram, href: '#', label: 'Instagram' },
                  { icon: Linkedin, href: '#', label: 'LinkedIn' },
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-brand-600 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="container-custom py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-500 text-xs text-center sm:text-left">
            © {new Date().getFullYear()} ProHygiene. {tr.footer.rights}.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">{tr.footer.privacy}</Link>
            <Link href="/terms" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">{tr.footer.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
