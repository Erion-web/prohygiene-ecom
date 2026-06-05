import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

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
              telephone: '+38344000000',
              email: 'info@prohygiene.shop',
              address: {
                '@type': 'PostalAddress',
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
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 16px -4px rgba(0,0,0,0.12)',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
          }}
        />
      </body>
    </html>
  )
}
