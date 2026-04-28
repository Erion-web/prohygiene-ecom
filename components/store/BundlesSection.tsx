import Link from 'next/link'
import { ArrowRight, Home, Building2, ChefHat, CheckCircle2 } from 'lucide-react'

const BUNDLES = [
  {
    key:   'shtepie',
    href:  '/shop?audience=home',
    icon:  Home,
    label: 'Paketa Shtëpie',
    tag:   'Ideal për familje',
    desc:  'Gjithçka për pastrim dhe higjienë personale në shtëpi.',
    items: ['Detergjentë për rrobalarëse', 'Dezinfektues sipërfaqesh', 'Letra higjienike', 'Sapun dhe gel dush'],
    gradient: 'from-sky-500 to-brand-600',
    badge: 'bg-white/20 text-white',
    cta:  'Shfleto Paketën',
  },
  {
    key:   'zyra',
    href:  '/shop?audience=business',
    icon:  Building2,
    label: 'Paketa Zyre',
    tag:   'Për ambiente biznesi',
    desc:  'Produkte profesionale për pastrim dhe higjienë në ambiente zyrtare.',
    items: ['Dezinfektues duarsh', 'Letër WC & peshqir letre', 'Produkte pastrimi dysheme', 'Shporta hedhurinash'],
    gradient: 'from-slate-700 to-slate-900',
    badge: 'bg-white/20 text-white',
    cta:  'Shfleto Paketën',
  },
  {
    key:   'horeca',
    href:  '/business',
    icon:  ChefHat,
    label: 'Paketa HORECA',
    tag:   'Hotel · Restorant · Kafe',
    desc:  'Furnizim profesional për industrinë e hotelerisë dhe restoranteve.',
    items: ['Kimikate profesionale', 'Produkte sanitare industri', 'Letër & aksesore WC', 'Çmime shumice'],
    gradient: 'from-brand-600 to-teal-600',
    badge: 'bg-white/20 text-white',
    cta:  'Kontakto për Çmime',
  },
]

export function BundlesSection() {
  return (
    <section className="section">
      <div className="container-custom">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-brand-400 rounded-full" />
          <div>
            <h2 className="text-xl font-extrabold text-text-primary">Paketa Gati për Ju</h2>
            <p className="text-text-muted text-xs mt-0.5">Zgjidhni paketën sipas nevojës — shtëpi, zyrë apo HORECA</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {BUNDLES.map(({ key, href, icon: Icon, label, tag, desc, items, gradient, cta }) => (
            <Link
              key={key}
              href={href}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
            >
              {/* Background orb */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />

              {/* Tag */}
              <span className="inline-flex items-center self-start text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 mb-4">
                {tag}
              </span>

              {/* Icon + title */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-extrabold leading-tight">{label}</h3>
              </div>

              <p className="text-white/80 text-sm mb-4 leading-relaxed">{desc}</p>

              {/* Items */}
              <ul className="space-y-1.5 mb-6 flex-1">
                {items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-white/90">
                    <CheckCircle2 size={12} className="text-white/60 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex items-center gap-2 text-sm font-bold group-hover:gap-3 transition-all">
                {cta}
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
