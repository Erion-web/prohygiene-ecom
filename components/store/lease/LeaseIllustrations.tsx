interface SvgProps {
  className?: string
}

export function LeaseHeroIllustration({ className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 480 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="240" cy="180" r="140" fill="url(#lease-hero-glow)" opacity="0.35" />
      <rect x="168" y="72" width="144" height="216" rx="20" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
      <rect x="188" y="92" width="104" height="56" rx="10" fill="white" fillOpacity="0.08" stroke="white" strokeOpacity="0.2" />
      <circle cx="240" cy="120" r="8" fill="#5ccef2" />
      <path d="M240 128v24" stroke="#5ccef2" strokeWidth="2" strokeLinecap="round" />
      <rect x="204" y="168" width="72" height="88" rx="12" fill="url(#lease-liquid)" stroke="white" strokeOpacity="0.15" />
      <path d="M220 200h40M220 216h28M220 232h34" stroke="white" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
      <rect x="196" y="268" width="88" height="12" rx="6" fill="white" fillOpacity="0.15" />
      <path d="M120 140c24-32 56-48 96-48" stroke="#5ccef2" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
      <path d="M360 140c-24-32-56-48-96-48" stroke="#5ccef2" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
      <circle cx="96" cy="128" r="6" fill="#5ccef2" fillOpacity="0.5" />
      <circle cx="384" cy="128" r="6" fill="#5ccef2" fillOpacity="0.5" />
      <path d="M80 220c40 24 88 36 136 36s96-12 136-36" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" />
      <defs>
        <radialGradient id="lease-hero-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(240 180) scale(140)">
          <stop stopColor="#5ccef2" />
          <stop offset="1" stopColor="#5ccef2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lease-liquid" x1="204" y1="168" x2="276" y2="256" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0e95bd" stopOpacity="0.45" />
          <stop offset="1" stopColor="#175269" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function LeaseEmptyIllustration({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <rect x="60" y="24" width="80" height="112" rx="14" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
      <rect x="76" y="44" width="48" height="32" rx="8" fill="#ecfafd" stroke="#d2f4fb" />
      <rect x="84" y="88" width="32" height="36" rx="6" fill="#ecfafd" stroke="#a8eaf7" strokeWidth="1.5" strokeDasharray="4 4" />
      <circle cx="100" cy="60" r="4" fill="#0e95bd" fillOpacity="0.4" />
      <path d="M40 120h120" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function LeaseInstallIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <rect x="8" y="6" width="16" height="20" rx="4" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 14h8M12 18h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M16 26v4M12 30h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function LeaseMaintainIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 10v6l4 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 6l2 2M10 6L8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function LeaseRefillIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <path d="M16 6v14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M11 15l5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 24h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function LeaseModalIllustration({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 120 96" fill="none" className={className} aria-hidden>
      <rect width="120" height="96" rx="16" fill="#ecfafd" />
      <rect x="36" y="16" width="48" height="64" rx="10" fill="white" stroke="#d2f4fb" strokeWidth="1.5" />
      <rect x="46" y="28" width="28" height="16" rx="4" fill="#d2f4fb" />
      <rect x="46" y="52" width="28" height="20" rx="4" fill="#0e95bd" fillOpacity="0.15" stroke="#0e95bd" strokeOpacity="0.3" />
      <circle cx="60" cy="36" r="3" fill="#0e95bd" />
    </svg>
  )
}
