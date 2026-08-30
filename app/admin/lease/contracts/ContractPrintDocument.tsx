import { formatClientAddress, primaryClientAddress } from '@/lib/lease/addresses'
import type { LeaseContract } from '@/types'

function Val({ children }: { children?: string | number | null }) {
  const text = children === null || children === undefined || String(children).trim() === ''
    ? ''
    : String(children)
  if (!text) return <span>________</span>
  return <strong className="underline decoration-slate-400 underline-offset-2 font-semibold">{text}</strong>
}

function formatSqDate(iso: string) {
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return iso
  return `${day}/${month}/${year}`
}

export function ContractPrintDocument({
  contract,
  fiscalNumber,
}: {
  contract: LeaseContract
  fiscalNumber?: string | null
}) {
  const client = contract.client
  const address = primaryClientAddress(client?.addresses)
  const location = address
    ? formatClientAddress(address).replace(/^.*? — /, '')
    : [client?.address, client?.city].filter(Boolean).join(', ')
  const devices = (contract.contract_devices ?? [])
    .map(d => {
      const name = d.product?.name_sq ?? 'Pajisje'
      return d.quantity > 1 ? `${name} × ${d.quantity}` : name
    })
    .join(', ')
  const aromas = (contract.contract_materials ?? [])
    .map(m => m.material?.name_sq)
    .filter(Boolean)
    .join(', ')
  const deviceValue = (contract.contract_devices ?? []).reduce((sum, d) => {
    const price = d.product?.price ?? 0
    return sum + price * (d.quantity || 1)
  }, 0)
  const paymentDay = Number(contract.starts_at.split('-')[2] || '') || null

  return (
    <article className="mx-auto max-w-[210mm] bg-white px-8 py-10 text-[13px] leading-relaxed text-slate-800 print:max-w-none print:px-[16mm] print:py-[16mm]">
      <style>{`@page { size: A4; margin: 0; }`}</style>
      <h1 className="text-center text-lg font-extrabold tracking-tight text-slate-900 mb-1">
        KONTRATË PËR SHËRBIMIN E AROMATIZIMIT PROFESIONAL
      </h1>
      <p className="text-center text-sm font-semibold text-slate-600 mb-6">
        {contract.contract_number != null ? `Nr. ${contract.contract_number}` : ' '}
      </p>

      <section className="mb-4">
        <h2 className="font-bold text-slate-900 mb-1">Neni 1: Palët Kontraktuese</h2>
        <p>
          Kjo kontratë lidhet sot më datë <Val>{formatSqDate(contract.starts_at)}</Val> në Prishtinë, ndërmjet:
        </p>
        <p className="mt-2">
          <strong>Pro Hygiene sh.p.k.</strong> Prishtinë. Ofruesi i Shërbimit
        </p>
        <p className="mt-2">
          <Val>{client?.company_name}</Val> me adresë në <Val>{location}</Val>, përfaqësuar nga{' '}
          <Val>{client?.contact_name}</Val>, me Numër Biznesi: <Val>{fiscalNumber}</Val> (në tekstin e mëposhtëm: Klienti).
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-bold text-slate-900 mb-1">Neni 2: Objekti i Kontratës</h2>
        <p>
          Ofruesi ofron shërbimin e aromatizimit profesional ambientit të Klientit përmes pajisjeve inteligjente SCENTA dhe furnizimit të rregullt me vajra aromatizues premium.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-bold text-slate-900 mb-1">Neni 3: Pronësia e Pajisjes</h2>
        <p>
          Pajisja e vendosur në ambientin e Klientit (Modeli: <Val>{devices}</Val>) mbetet pronë e plotë dhe e patjetërsueshme e Pro Hygiene sh.p.k. Klienti nuk ka të drejtë ta shesë, ta transferojë ose ta dëmtojë pajisjen. Në rast të ndërprerjes së kontratës, pajisja duhet t&apos;i kthehet Ofruesit brenda 48 orëve.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-bold text-slate-900 mb-1">Neni 4: Paketa e Shërbimit dhe Pagesa</h2>
        <p>Klienti përzgjedh paketën e shërbimit të specifikuar si më poshtë:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>
            Tarifa Mujore e Shërbimit: <Val>{contract.monthly_fee ? `${contract.monthly_fee.toFixed(2)}` : null}</Val> € / muaj (përfshin difuzorin, rimbushjen e rregullt me vaj dhe mirëmbajtjen).
          </li>
          <li>
            Depozita e Sigurisë (Nëse ka): ________ € (Kthehet në fund të kontratës pas dorëzimit të pajisjes pa dëmtime).
          </li>
          <li>
            Aroma e Përzgjedhur: <Val>{aromas}</Val>
          </li>
          <li>
            Data e Pagesës: Pagesa realizohet në baza mujore, më së largu deri me datën <Val>{paymentDay}</Val> të muajit vijues.
          </li>
        </ul>
      </section>

      <section className="mb-4">
        <h2 className="font-bold text-slate-900 mb-1">Neni 5: Kohëzgjatja e Kontratës</h2>
        <p>
          Kjo kontratë lidhet për një periudhë minimale prej <Val>{contract.duration_months}</Val> muajsh, nga{' '}
          <Val>{formatSqDate(contract.starts_at)}</Val> deri më <Val>{formatSqDate(contract.ends_at)}</Val>. Kontrata vazhdohet automatikisht me kushte të njëjta, përveç nëse njëra nga palët njofton shpërbërjen e saj 30 ditë përpara.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-bold text-slate-900 mb-1">Neni 6: Detyrimet e Pro Hygiene</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Të sigurojë montimin dhe konfigurimin e pajisjes përmes aplikacionit smart sipas orarit të biznesit të Klientit.</li>
          <li>Të bëjë rimbushjen me vaj aromatizues çdo 30 ditë dhe të pastrojë pajisjen për të siguruar funksionim perfekt.</li>
          <li>Në rast të ndonjë defekti teknik, të zëvendësojë pajisjen pa asnjë pagesë shtesë brenda 24 orëve nga njoftimi.</li>
        </ul>
      </section>

      <section className="mb-4">
        <h2 className="font-bold text-slate-900 mb-1">Neni 7: Detyrimet e Klientit</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Të sigurojë energji elektrike të vazhdueshme për pajisjen dhe të mos ndërhyjë në mekanizmin e saj pa autorizim.</li>
          <li>Të paguajë faturën mujore rregullisht sipas afatit të specifikuar në Nenin 4.</li>
          <li>
            Në rast të vjedhjes apo dëmtimit të qëllimshëm të pajisjes, Klienti obligohet të dëmshpërblejë Ofruesin me vlerën e plotë tregtare të pajisjes (
            <Val>{deviceValue > 0 ? deviceValue.toFixed(2) : null}</Val> €).
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-slate-900 mb-1">Neni 8: Zgjidhja e Mosmarrëveshjeve</h2>
        <p>
          Për çdo mosmarrëveshje që mund të lindë, palët do të përpiqen t&apos;i zgjidhin me mirëkuptim. Në të kundërt, kompetente është Gjykata Themelore në Prishtinë.
        </p>
        <p className="mt-2">
          Kontrata është përpiluar në dy (2) kopje identike, ku secila palë mban nga një kopje.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-10 pt-6">
        <div>
          <p className="font-bold text-slate-900 mb-10">PËR OFRUESIN (PRO HYGIENE)</p>
          <p className="border-t border-slate-400 pt-2 text-xs text-slate-500">Nënshkrimi dhe Vula</p>
        </div>
        <div>
          <p className="font-bold text-slate-900 mb-1">PËR KLIENTIN</p>
          <p className="text-sm mb-8"><Val>{client?.company_name}</Val></p>
          <p className="border-t border-slate-400 pt-2 text-xs text-slate-500">Nënshkrimi dhe Vula</p>
        </div>
      </div>
    </article>
  )
}
