'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { useLanguageStore } from '@/store/language'

type Consent = 'accepted' | 'rejected' | null

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export function CookieConsent() {
  const { lang } = useLanguageStore()
  const [consent, setConsent] = useState<Consent>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setConsent((localStorage.getItem('cookie_consent') as Consent) ?? null)
    setHydrated(true)
  }, [])

  const decide = (value: 'accepted' | 'rejected') => {
    localStorage.setItem('cookie_consent', value)
    setConsent(value)
  }

  return (
    <>
      {/* Analytics & ad-pixel scripts only load after explicit consent */}
      {consent === 'accepted' && GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');`}
          </Script>
        </>
      )}
      {consent === 'accepted' && META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');`}
        </Script>
      )}

      {hydrated && consent === null && (
        <div className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6 animate-slide-up">
          <div className="max-w-3xl mx-auto bg-slate-950 text-white rounded-2xl shadow-elevated p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-slate-800">
            <p className="text-sm text-slate-300 flex-1 leading-relaxed">
              {lang === 'sq'
                ? 'Ne përdorim cookies për të përmirësuar përvojën tuaj dhe për analitika/marketing. Duke klikuar "Prano", pranoni përdorimin e tyre.'
                : 'We use cookies to improve your experience and for analytics/marketing. By clicking "Accept", you agree to their use.'}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => decide('rejected')} className="btn-secondary py-2 px-4 text-sm">
                {lang === 'sq' ? 'Refuzo' : 'Reject'}
              </button>
              <button onClick={() => decide('accepted')} className="btn-primary py-2 px-4 text-sm">
                {lang === 'sq' ? 'Prano' : 'Accept'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
