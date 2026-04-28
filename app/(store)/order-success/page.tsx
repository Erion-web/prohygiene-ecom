'use client'

import Link from 'next/link'
import { CheckCircle, Package, Clock, ArrowRight } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useLanguageStore } from '@/store/language'
import { t } from '@/lib/i18n'
import { Suspense } from 'react'

function OrderSuccessContent() {
  const { lang } = useLanguageStore()
  const tr = t(lang)
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')

  return (
    <div className="section">
      <div className="container-custom">
        <div className="max-w-lg mx-auto text-center">
          {/* Icon */}
          <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-emerald-500" />
          </div>

          <h1 className="text-3xl font-extrabold text-text-primary mb-3">
            {tr.orderSuccess.title}
          </h1>
          <p className="text-text-secondary text-lg mb-6">
            {tr.orderSuccess.subtitle}
          </p>
          <p className="text-text-muted mb-8">
            {tr.orderSuccess.description}
          </p>

          {orderNumber && (
            <div className="card p-6 mb-8 text-left">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">
                    {tr.orderSuccess.orderNumber}
                  </p>
                  <p className="text-xl font-black text-text-primary tracking-wide">{orderNumber}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">
                  <Package size={22} className="text-brand-600" />
                </div>
              </div>

              <div className="divider my-4" />

              <div className="flex items-center gap-3 text-sm">
                <Clock size={16} className="text-text-muted" />
                <span className="text-text-secondary">
                  {tr.orderSuccess.estimatedDelivery}: <strong className="text-text-primary">{tr.orderSuccess.deliveryDays}</strong>
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/shop" className="btn-primary py-3 px-8">
              {tr.orderSuccess.continueShopping}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense>
      <OrderSuccessContent />
    </Suspense>
  )
}
