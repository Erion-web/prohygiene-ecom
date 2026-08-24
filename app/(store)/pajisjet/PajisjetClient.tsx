'use client'

import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { LeaseProductCard } from '@/components/store/lease/LeaseProductCard'
import {
  LeaseHeroIllustration,
  LeaseEmptyIllustration,
  LeaseInstallIcon,
  LeaseMaintainIcon,
  LeaseRefillIcon,
} from '@/components/store/lease/LeaseIllustrations'
import type { Product } from '@/types'

interface PajisjetClientProps {
  products: Product[]
}

export function PajisjetClient({ products }: PajisjetClientProps) {
  const { lang } = useLanguageStore()
  const tr = t(lang)

  const benefits = [
    { Icon: LeaseInstallIcon, title: tr.lease.benefitInstall, desc: tr.lease.benefitInstallDesc },
    { Icon: LeaseMaintainIcon, title: tr.lease.benefitMaintain, desc: tr.lease.benefitMaintainDesc },
    { Icon: LeaseRefillIcon, title: tr.lease.benefitRefill, desc: tr.lease.benefitRefillDesc },
  ]

  const steps = [
    { n: '01', label: tr.lease.step1 },
    { n: '02', label: tr.lease.step2 },
    { n: '03', label: tr.lease.step3 },
  ]

  return (
    <div className="animate-fade-in pb-24 sm:pb-0">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} aria-hidden />
        <div className="container-custom relative py-14 md:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="max-w-xl">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200 mb-6">
                {tr.lease.proLabel}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-white tracking-tight leading-[1.1] text-balance mb-5">
                {tr.lease.pageTitle}
              </h1>
              <p className="text-base sm:text-lg text-brand-100/90 leading-relaxed text-pretty mb-8 max-w-lg">
                {tr.lease.pageSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-brand-800 shadow-elevated hover:bg-brand-50 transition-colors"
                >
                  <Phone size={16} />
                  {tr.lease.contactUs}
                </Link>
                {products.length > 0 && (
                  <a
                    href="#katalogu"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                  >
                    {lang === 'sq' ? 'Shiko katalogun' : 'View catalog'}
                    <ArrowRight size={16} />
                  </a>
                )}
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <LeaseHeroIllustration className="w-full max-w-[420px] h-auto drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-surface-border bg-white">
        <div className="container-custom py-10 md:py-12">
          <div className="grid sm:grid-cols-3 gap-6 md:gap-8">
            {benefits.map(({ Icon, title, desc }) => (
              <div key={title} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-100">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary tracking-tight mb-1">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="katalogu" className="section bg-surface-soft/50">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 md:mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-1 h-7 bg-brand-500 rounded-full" aria-hidden />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  {lang === 'sq' ? 'Katalogu i pajisjeve' : 'Device catalog'}
                </h2>
              </div>
              {products.length > 0 && (
                <p className="text-sm text-text-muted pl-4">
                  {products.length} {lang === 'sq' ? 'pajisje' : 'devices'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4 pl-4 sm:pl-0">
              {steps.map((step, i) => (
                <div key={step.n} className="flex items-center gap-2 sm:gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] font-bold text-brand-600 tabular-nums">{step.n}</p>
                    <p className="text-[11px] sm:text-xs font-medium text-text-secondary hidden sm:block">{step.label}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-6 h-px bg-surface-border hidden sm:block" aria-hidden />
                  )}
                </div>
              ))}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-3xl border border-surface-border bg-white shadow-soft px-6 py-16 sm:py-20 text-center max-w-lg mx-auto">
              <LeaseEmptyIllustration className="w-[200px] h-auto mx-auto mb-6 opacity-90" />
              <h3 className="text-lg font-bold text-text-primary tracking-tight mb-2">{tr.lease.emptyTitle}</h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-8 max-w-sm mx-auto">{tr.lease.emptyDesc}</p>
              <Link href="/contact" className="btn-primary inline-flex">
                {tr.lease.contactUs}
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {products.map(product => (
                <LeaseProductCard
                  key={product.id}
                  product={product}
                  lang={lang}
                  leaseBadge={tr.lease.badge}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
