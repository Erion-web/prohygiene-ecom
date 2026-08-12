import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Na Kontaktoni — Porosit & Pyetje',
  description: 'Na kontaktoni për porosi, çmime shumice ose pyetje. Tel: 046 10 80 40 · info@prohygiene.shop · Prishtinë, Kosovë. Përgjigjemi brenda 1 ore gjatë orarit të punës.',
  alternates: { canonical: 'https://prohygiene.shop/contact' },
  keywords: ['kontakt ProHygiene', 'porosi detergjente Kosovë', 'çmim shumice higjienë'],
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
