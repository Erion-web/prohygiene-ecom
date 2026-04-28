import type { Metadata } from 'next'
import { CheckCircle, Users, Award, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Rreth Nesh | ProHygiene',
}

export default function AboutPage() {
  const values = [
    { icon: CheckCircle, title: 'Cilësia', desc: 'Ofrojmë vetëm produkte të certifikuara dhe të testuara nga furnitorë të njohur evropianë dhe globalë.' },
    { icon: Users, title: 'Klientët', desc: 'Klienti është në qendër të çdo vendimi tonë. Shërbim i personalizuar për çdo lloj biznesi.' },
    { icon: Award, title: 'Besueshmëria', desc: 'Mbi 5 vite eksperiencë në tregun e Kosovës. Mbi 500 klientë të kënaqur.' },
    { icon: Globe, title: 'Qëndrueshmëria', desc: 'Produkte miqësore me mjedisin. Paketim i riciklueshëm kur është e mundur.' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-900 py-20">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Rreth ProHygiene
          </h1>
          <p className="text-brand-100 text-xl max-w-2xl mx-auto">
            Partneri juaj i besuar në pastërti dhe higjienë — për shtëpi dhe biznese
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="section">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-text-primary mb-6">Historia Jonë</h2>
            <p className="text-text-secondary leading-relaxed text-lg mb-4">
              ProHygiene u themelua me misionin për të sjellë produkte higjiene të cilësisë së lartë në treg kosovar me çmime të arsyeshme dhe shërbim profesional.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Filluar si furnizues i vogël lokal, sot ProHygiene është partneri kryesor i shumë hoteleve, restoranteve, spitaleve dhe familjeve në Kosovë. Ofrojmë gamën e plotë të produkteve — nga detergjentët shtëpiak deri te solucionet e pastrimit industrial.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section bg-surface-soft">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '500+', label: 'Klientë të Kënaqur' },
              { value: '1000+', label: 'Produkte' },
              { value: '5+', label: 'Vite Eksperiencë' },
              { value: '24/48h', label: 'Dërgim Kosovë' },
            ].map(stat => (
              <div key={stat.label} className="card p-6 text-center">
                <p className="text-4xl font-black text-brand-600 mb-2">{stat.value}</p>
                <p className="text-text-secondary text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="container-custom">
          <h2 className="text-3xl font-extrabold text-text-primary text-center mb-12">Vlerat Tona</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                  <Icon size={26} className="text-brand-600" />
                </div>
                <h3 className="font-bold text-text-primary mb-2">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
