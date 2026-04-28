'use client'

import Link from 'next/link'
import { XCircle, RefreshCw, Phone, Home } from 'lucide-react'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'

export default function OrderFailedPage() {
  const { lang } = useLanguageStore()
  const tr = t(lang)

  return (
    <div className="section">
      <div className="container-custom">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-24 h-24 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <XCircle size={48} className="text-red-500" />
          </div>

          <h1 className="text-3xl font-extrabold text-text-primary mb-3">
            {tr.orderFailed.title}
          </h1>
          <p className="text-text-secondary text-lg mb-4">
            {tr.orderFailed.subtitle}
          </p>
          <p className="text-text-muted mb-8">
            {tr.orderFailed.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/checkout" className="btn-primary py-3 px-6">
              <RefreshCw size={16} />
              {tr.orderFailed.tryAgain}
            </Link>
            <Link href="/contact" className="btn-secondary py-3 px-6">
              <Phone size={16} />
              {tr.orderFailed.contactSupport}
            </Link>
            <Link href="/" className="btn-ghost py-3 px-6">
              <Home size={16} />
              {tr.orderFailed.goHome}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
