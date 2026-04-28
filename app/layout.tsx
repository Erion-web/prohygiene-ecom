import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: {
    default: 'ProHygiene — Produkte Higjiene & Pastrimi | Kosovë',
    template: '%s | ProHygiene',
  },
  description: 'Furnizues premium i produkteve të higjienës dhe pastrimit në Kosovë. Dërgim i shpejtë, çmime të mira, shërbim profesional.',
  keywords: ['higjienë', 'pastrim', 'dezinfektues', 'detergjent', 'HORECA', 'Kosovë'],
  openGraph: {
    type: 'website',
    locale: 'sq_AL',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'ProHygiene',
    title: 'ProHygiene — Produkte Higjiene & Pastrimi',
    description: 'Furnizues premium i produkteve të higjienës dhe pastrimit në Kosovë.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sq" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
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
            success: {
              iconTheme: { primary: '#10b981', secondary: '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
            },
          }}
        />
      </body>
    </html>
  )
}
