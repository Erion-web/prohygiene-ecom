import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Na Kontaktoni — Porosit & Pyetje',
  description: 'Na kontaktoni për porosi, çmime shumice ose pyetje. Tel: +383 44 000 000 · info@prohygiene.shop · Prishtinë, Kosovë. Përgjigjemi brenda 1 ore gjatë orarit të punës.',
  alternates: { canonical: 'https://prohygiene.shop/contact' },
  keywords: ['kontakt ProHygiene', 'porosi detergjente Kosovë', 'çmim shumice higjienë'],
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
