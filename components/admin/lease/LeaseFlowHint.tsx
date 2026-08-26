export function LeaseFlowHint({ step }: { step: 'contract' | 'install' }) {
  if (step === 'install') return null

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2.5 text-xs text-text-secondary leading-relaxed">
      Pajisjet që shtoni këtu regjistrohen automatikisht te klienti. Nuk ka hap tjetër instalimi.
    </div>
  )
}
