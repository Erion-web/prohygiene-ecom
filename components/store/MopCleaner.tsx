'use client'

import { useEffect, useRef } from 'react'

export function MopCleaner() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rest = -128
    const setVars = (progress: number) => {
      const tick = Math.sin(progress * Math.PI * 2)
      root.style.setProperty('--mop-angle', `${rest + tick * 5}deg`)
      root.style.setProperty('--spark', (0.25 + Math.abs(tick) * 0.35).toFixed(3))
    }

    if (reduced) {
      setVars(0.4)
      return
    }

    let frame = 0
    const update = () => {
      const rect = root.getBoundingClientRect()
      const vh = window.innerHeight
      const start = vh * 0.95
      const end = vh * 0.22
      const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)))
      setVars(progress)
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none hidden lg:block absolute right-0 bottom-full w-[240px] xl:w-[280px] select-none translate-y-[12%]"
      style={{
        '--mop-angle': '-128deg',
        '--spark': 0.3,
      } as React.CSSProperties}
    >
      <svg viewBox="0 0 280 230" className="w-full h-auto overflow-visible" fill="none">
        <ellipse cx="150" cy="214" rx="88" ry="8" fill="#0e95bd" opacity="0.07" />
        <path d="M40 212h200" stroke="#0e95bd" strokeWidth="2.5" strokeLinecap="round" opacity="0.1" />

        <g>
          <path d="M188 140c-4 22-6 42-2 62" stroke="#175269" strokeWidth="13" strokeLinecap="round" />
          <path d="M202 140c4 20 8 40 12 62" stroke="#175269" strokeWidth="13" strokeLinecap="round" />
          <path d="M174 200h24" stroke="#0b3346" strokeWidth="8" strokeLinecap="round" />
          <path d="M202 200h26" stroke="#0b3346" strokeWidth="8" strokeLinecap="round" />

          <path d="M180 94c-2 22 2 46 10 58 10 3 26 1 32-10 0-20-4-42-8-56-8-6-24-4-34 8Z" fill="#0e95bd" />
          <path d="M200 110c4 16 6 30 4 42" stroke="#5ccef2" strokeWidth="8" strokeLinecap="round" opacity="0.4" />

          <path d="M190 88c1 8 3 14 6 16h10c-1-6-2-14-1-18-5-2-12-2-15 2Z" fill="#f3c4a4" />
          <path
            fill="#f3c4a4"
            d="M189 49C203 49 213 60 213 74C213 86 206 95 195 96C189 97 185 94 183 90C179 88 173 83 172 78C171 74 175 71 178 70C175 65 180 51 189 49Z"
          />
          <path
            fill="#1e3a4c"
            d="M175 61C173 53 180 45 191 44C203 43 214 52 217 66C219 78 214 90 205 92C198 93 196 86 198 80C196 72 190 66 183 64C178 63 175 62 175 61Z"
          />
          <circle cx="177" cy="54" r="5.2" fill="#1e3a4c" />
          <circle cx="185" cy="47" r="5.6" fill="#1e3a4c" />
          <circle cx="195" cy="45" r="5.8" fill="#1e3a4c" />
          <circle cx="205" cy="49" r="5.4" fill="#1e3a4c" />
          <circle cx="213" cy="58" r="5.2" fill="#1e3a4c" />
          <circle cx="214" cy="70" r="5" fill="#1e3a4c" />
          <circle cx="209" cy="80" r="4.8" fill="#1e3a4c" />
          <circle cx="190" cy="52" r="5.4" fill="#1e3a4c" />
          <circle cx="200" cy="55" r="5.2" fill="#1e3a4c" />
          <circle cx="186" cy="58" r="5" fill="#1e3a4c" />
          <circle cx="194" cy="62" r="5" fill="#1e3a4c" />
          <circle cx="204" cy="64" r="5" fill="#1e3a4c" />
          <circle cx="182" cy="62" r="4.6" fill="#1e3a4c" />
          <circle cx="198" cy="70" r="4.8" fill="#1e3a4c" />
          <ellipse cx="200" cy="74" rx="3.6" ry="5" fill="#e8b496" />
          <path d="M175 65c3-2 9-3 12-1" stroke="#1e3a4c" strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="180" cy="72" rx="2.5" ry="3" fill="#fff" />
          <ellipse cx="180.2" cy="70.4" rx="2.1" ry="2.2" fill="#0b3346" />
          <circle cx="180.6" cy="69.4" r="0.65" fill="#fff" />
          <path d="M174 82c2.5 1.6 6 1.6 8.5 0" stroke="#c4786a" strokeWidth="1.4" strokeLinecap="round" />
        </g>

        <path d="M206 128C202 118 198 112 196 108" stroke="#f3c4a4" strokeWidth="11" strokeLinecap="round" />

        <g
          style={{
            transform: 'rotate(var(--mop-angle))',
            transformOrigin: '196px 108px',
            transformBox: 'view-box',
          }}
        >
          <path d="M196 108h148" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
          <path d="M196 108h148" stroke="#e2e8f0" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="196" cy="108" r="7" fill="#f3c4a4" />
          <circle cx="214" cy="108" r="6" fill="#e8b496" />
          <g
            style={{
              transform: 'rotate(calc(var(--mop-angle) * -1))',
              transformOrigin: '344px 108px',
              transformBox: 'view-box',
            }}
          >
            <rect x="320" y="98" width="50" height="20" rx="8" fill="#7dd3f0" />
            <rect x="324" y="102" width="42" height="14" rx="6" fill="#ecfafd" />
            <path d="M328 118h6M338 120h6M348 118h6M358 120h5" stroke="#0e95bd" strokeWidth="2.2" strokeLinecap="round" opacity="0.4" />
            <circle cx="318" cy="96" r="3.5" fill="#5ccef2" style={{ opacity: 'var(--spark)' }} />
            <circle cx="366" cy="94" r="2.5" fill="#0e95bd" style={{ opacity: 'calc(var(--spark) * 0.75)' }} />
          </g>
        </g>
      </svg>
    </div>
  )
}
