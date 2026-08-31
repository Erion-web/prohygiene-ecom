import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Home, Building2, ChefHat, Check } from 'lucide-react'
import { MopCleaner } from '@/components/store/MopCleaner'
import type { HomepagePackage, PackageAudience } from '@/types'

const BUNDLES: {
  key: PackageAudience
  href: string
  icon: typeof Home
  label: string
  tag: string
  desc: string
  items: string[]
  accent: string
  cta: string
}[] = [
  {
    key: 'home',
    href: '/shop?audience=home',
    icon: Home,
    label: 'Paketa Shtëpie',
    tag: 'Ideal për familje',
    desc: 'Gjithçka për pastrim dhe higjienë personale në shtëpi.',
    items: ['Detergjentë rrobalarëse', 'Dezinfektues sipërfaqesh', 'Letra higjienike', 'Sapun & gel dush'],
    accent: '#0e95bd',
    cta: 'Shfleto Paketën',
  },
  {
    key: 'office',
    href: '/shop?audience=business',
    icon: Building2,
    label: 'Paketa Zyre',
    tag: 'Për ambiente biznesi',
    desc: 'Produkte profesionale për pastrim dhe higjienë zyrtare.',
    items: ['Dezinfektues duarsh', 'Letër WC & peshqir', 'Produkte dyshemeje', 'Shporta hedhurinash'],
    accent: '#6366f1',
    cta: 'Shfleto Paketën',
  },
  {
    key: 'horeca',
    href: '/business',
    icon: ChefHat,
    label: 'Paketa HORECA',
    tag: 'Hotel · Restorant · Kafe',
    desc: 'Furnizim profesional për industrinë e hotelerisë.',
    items: ['Kimikate profesionale', 'Produkte sanitare', 'Letër & aksesore WC', 'Çmime shumice'],
    accent: '#10b981',
    cta: 'Kontakto për Çmime',
  },
]

export function BundlesSection({ packages = [] }: { packages?: HomepagePackage[] }) {
  const images = Object.fromEntries(packages.map(p => [p.audience, p.image_url])) as Partial<Record<PackageAudience, string>>

  return (
    <section className="section relative">
      <div className="container-custom relative">
        <MopCleaner />
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-brand-400 rounded-full" />
          <div>
            <h2 className="text-xl font-extrabold text-text-primary">Paketa Gati për Ju</h2>
            <p className="text-text-muted text-xs mt-0.5">Zgjidhni paketën sipas nevojës — shtëpi, zyrë apo HORECA</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0 md:grid md:grid-cols-3 md:gap-5">
          {BUNDLES.map(({ key, href, icon: Icon, label, tag, desc, items, accent, cta }) => (
            <Link
              key={key}
              href={href}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm
                flex-shrink-0 w-[80vw] sm:w-[56vw] md:w-auto
                transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
            >
              <div className="px-5 pt-5 pb-4">
                <span
                  className="inline-block text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full mb-3"
                  style={{ background: `${accent}15`, color: accent }}
                >
                  {tag}
                </span>
                <h3 className="text-lg font-extrabold text-gray-900 leading-snug mb-1">{label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>

              <div
                className="mx-4 rounded-xl overflow-hidden flex items-center justify-center relative"
                style={{ background: `${accent}08`, height: 140 }}
              >
                {images[key] ? (
                  <Image
                    src={images[key]!}
                    alt={label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 80vw, 33vw"
                  />
                ) : (
                  <>
                    <div
                      className="absolute inset-0 opacity-30 blur-2xl"
                      style={{ background: `radial-gradient(circle at 50% 70%, ${accent}60, transparent 70%)` }}
                    />
                    <div className="absolute w-28 h-28 rounded-full border border-gray-100" />
                    <div className="absolute w-20 h-20 rounded-full border border-gray-100" />
                    <div
                      className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                      style={{ background: `${accent}18`, border: `1.5px solid ${accent}40` }}
                    >
                      <Icon size={28} style={{ color: accent }} strokeWidth={1.6} />
                    </div>
                    {[[-40, -16], [40, -22], [-46, 20], [46, 16]].map(([x, y], i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 rounded-full opacity-50"
                        style={{ background: accent, left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                      />
                    ))}
                  </>
                )}
              </div>

              <ul className="px-5 pt-4 pb-3 space-y-2 flex-1">
                {items.map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <span
                      className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: `${accent}20` }}
                    >
                      <Check size={9} strokeWidth={3} style={{ color: accent }} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="px-4 pb-4 pt-2">
                <span
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 group-hover:gap-3 group-hover:opacity-90"
                  style={{ background: accent }}
                >
                  {cta}
                  <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </div>

              <div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
