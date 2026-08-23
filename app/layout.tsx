import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { CookieConsent } from '@/components/CookieConsent'

const APP_URL = 'https://prohygiene.shop'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'ProHygiene — Detergjente & Produkte Higjiene | Kosovë',
    template: '%s | ProHygiene Kosovë',
  },
  description: 'Bli detergjente, kimikate pastrimi dhe produkte higjiene online — dërgim 24h në tërë Kosovën. Çmime shumice për HORECA, hotele, restorante dhe biznese. Partner i Shtepiaku.',
  keywords: [
    'detergjent Kosovë', 'detergjente online', 'kimikate pastrimi Kosovë',
    'produkte higjiene Kosovë', 'dezinfektues Kosovë', 'sapun industriale',
    'letra higjienike shumice', 'furnizim HORECA Kosovë', 'kimikate profesionale',
    'pastrim zyre Kosovë', 'furnizim hotel restorant Kosovë', 'produkte pastrim shumice',
    'shtepiaku', 'detergjent me shumice', 'ProHygiene', 'higjienë Prishtinë',
  ],
  authors: [{ name: 'ProHygiene', url: APP_URL }],
  creator: 'ProHygiene',
  publisher: 'ProHygiene',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: APP_URL,
    languages: { 'sq': APP_URL },
  },
  openGraph: {
    type: 'website',
    locale: 'sq_AL',
    url: APP_URL,
    siteName: 'ProHygiene',
    title: 'ProHygiene — Detergjente & Produkte Higjiene | Kosovë',
    description: 'Bli detergjente, kimikate pastrimi dhe produkte higjiene online — dërgim 24h në tërë Kosovën. Çmime shumice për HORECA dhe biznese.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'ProHygiene — Produkte Higjiene Kosovë' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProHygiene — Detergjente & Produkte Higjiene | Kosovë',
    description: 'Detergjente, kimikate pastrimi dhe produkte higjiene — dërgim 24h në tërë Kosovën.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? undefined,
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sq" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* JSON-LD Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': ['Organization', 'OnlineStore'],
              name: 'ProHygiene',
              alternateName: ['ProHygiene Kosovë', 'Pro Hygiene Kosovo'],
              url: APP_URL,
              logo: `${APP_URL}/logo.svg`,
              description: 'Furnizues i detergjenteve, kimikate pastrimi dhe produkteve të higjienës në Kosovë.',
              telephone: '+38346108040',
              email: 'info@prohygiene.shop',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Rruga Rexhep Krasniqi',
                addressLocality: 'Prishtinë',
                addressRegion: 'Prishtinë',
                addressCountry: 'XK',
              },
              areaServed: {
                '@type': 'Country',
                name: 'Kosovo',
              },
              sameAs: [
                'https://shtepiaku.com',
              ],
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Detergjente & Produkte Higjiene',
                itemListElement: [
                  { '@type': 'OfferCatalog', name: 'Detergjente dhe Kimikate' },
                  { '@type': 'OfferCatalog', name: 'Dezinfektues & Sanitarë' },
                  { '@type': 'OfferCatalog', name: 'Letra Higjienike & Peshqirë' },
                  { '@type': 'OfferCatalog', name: 'Produkte HORECA Profesionale' },
                ],
              },
            }),
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <CookieConsent />
        <Toaster
          position="top-right"
          gutter={10}
          containerStyle={{ top: 88, right: 16, zIndex: 60 }}
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(18px) saturate(180%)',
              WebkitBackdropFilter: 'blur(18px) saturate(180%)',
              color: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.65)',
              borderRadius: '16px',
              boxShadow: '0 10px 36px -10px rgba(15, 23, 42, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.55)',
              fontSize: '13.5px',
              fontWeight: '600',
              lineHeight: '1.35',
              maxWidth: '340px',
              padding: '12px 14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
          }}
        />
      </body>
    </html>
  )
}
