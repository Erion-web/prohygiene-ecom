'use client'

import Link from 'next/link'
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Send } from 'lucide-react'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { useState } from 'react'

export function Footer() {
  const { lang } = useLanguageStore()
  const tr = t(lang)
  const [email, setEmail] = useState('')

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
      {/* Main footer */}
      <div className="container-custom py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
                <span className="text-white font-black text-base">P</span>
              </div>
              <span className="font-black text-xl tracking-tight">
                Pro<span className="text-brand-400">Hygiene</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {tr.footer.description}
            </p>
            <div className="space-y-3">
              <a href="tel:+38344000000" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm">
                <Phone size={15} className="text-brand-400" />
                +383 44 000 000
              </a>
              <a href="mailto:info@prohygiene.com" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm">
                <Mail size={15} className="text-brand-400" />
                info@prohygiene.com
              </a>
              <div className="flex items-start gap-3 text-slate-400 text-sm">
                <MapPin size={15} className="text-brand-400 mt-0.5 flex-shrink-0" />
                Rruga Nënë Tereza, Prishtinë, Kosovë
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-300 mb-5">
              {tr.footer.quickLinks}
            </h4>
            <ul className="space-y-3">
              {quickLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-300 mb-5">
              {tr.footer.customerService}
            </h4>
            <ul className="space-y-3">
              {serviceLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-300 mb-5">
              {tr.footer.newsletter}
            </h4>
            <p className="text-slate-400 text-sm mb-4">
              {lang === 'sq'
                ? 'Merrni ofertat tona direkt në email.'
                : 'Get our latest offers directly to your inbox.'}
            </p>
            <form
              onSubmit={e => { e.preventDefault(); setEmail('') }}
              className="flex gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={tr.footer.newsletterPlaceholder}
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors duration-200 flex items-center"
              >
                <Send size={16} />
              </button>
            </form>

            {/* Social */}
            <div className="mt-6">
              <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">
                {tr.footer.followUs}
              </p>
              <div className="flex gap-3">
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

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="container-custom py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} ProHygiene. {tr.footer.rights}.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              {tr.footer.privacy}
            </Link>
            <Link href="/terms" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              {tr.footer.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
