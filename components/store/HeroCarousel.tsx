'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BannerSlide {
  id: string
  image_url: string
}

interface Slide {
  id: number
  badge: string
  title: string
  highlight: string
  subtitle: string
  cta: string
  href: string
  bg: string
  accent: string
}

const slides: Slide[] = [
  {
    id: 1,
    badge: 'Lider në Treg',
    title: 'Pastërti &',
    highlight: 'Higjienë',
    subtitle: 'Furnizues i besuar i produkteve të higjienës dhe pastrimit në Kosovë. Dërgim 24-48 orë.',
    cta: 'Shiko Produktet',
    href: '/shop',
    bg: 'from-[#0b3346] via-[#175269] to-[#0e95bd]',
    accent: '#5CCEF2',
  },
  {
    id: 2,
    badge: 'HORECA & Biznese',
    title: 'Furnizim',
    highlight: 'Profesional',
    subtitle: 'Çmime preferenciale për hotele, restorante, kafene dhe biznese. Me faturë fiskale.',
    cta: 'Kontakto për Çmime',
    href: '/business',
    bg: 'from-slate-900 via-slate-800 to-[#146380]',
    accent: '#5CCEF2',
  },
  {
    id: 3,
    badge: 'Oferta Javore',
    title: 'Zbritje deri',
    highlight: '30% OFF',
    subtitle: 'Produkte premium me çmime të reduktuara. Porosi mbi €50 — transport falas në tërë Kosovën.',
    cta: 'Shiko Ofertat',
    href: '/campaigns',
    bg: 'from-[#146380] via-[#0e95bd] to-[#1ab5de]',
    accent: '#ffffff',
  },
]

interface Props {
  banners?: BannerSlide[]
}

export function HeroCarousel({ banners }: Props) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const useImageMode = banners && banners.length > 0
  const slideCount = useImageMode ? banners.length : slides.length

  const next = useCallback(() => setCurrent(c => (c + 1) % slideCount), [slideCount])
  const prev = useCallback(() => setCurrent(c => (c - 1 + slideCount) % slideCount), [slideCount])

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [paused, next])

  return (
    <div
      className="relative overflow-hidden rounded-2xl select-none aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/7]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* IMAGE BANNERS from DB */}
      {useImageMode ? (
        banners.map((banner, i) => (
          <div
            key={banner.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            )}
          >
            <Image
              src={banner.image_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1200px"
              priority={i === 0}
            />
          </div>
        ))
      ) : (
        /* FALLBACK: hardcoded text slides */
        slides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'absolute inset-0 bg-gradient-to-br transition-opacity duration-700',
              s.bg,
              i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            )}
          >
            <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-10 bg-white" />
            <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full opacity-10 bg-white" />
            <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8 md:px-14 py-5 sm:py-8">
              <span
                className="inline-block text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full mb-3 w-fit"
                style={{ backgroundColor: `${s.accent}22`, color: s.accent, border: `1px solid ${s.accent}55` }}
              >
                {s.badge}
              </span>
              <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2">
                {s.title}{' '}
                <span style={{ color: s.accent }}>{s.highlight}</span>
              </h2>
              <p className="text-white/75 text-xs sm:text-sm md:text-base mb-4 max-w-xs sm:max-w-md leading-relaxed line-clamp-2 sm:line-clamp-none">
                {s.subtitle}
              </p>
              <Link
                href={s.href}
                className="inline-flex items-center gap-2 w-fit text-xs sm:text-sm font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: s.accent, color: '#0b3346' }}
              >
                {s.cta}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))
      )}

      {/* Arrow controls */}
      <button
        onClick={prev}
        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200"
        aria-label="Previous slide"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={next}
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200"
        aria-label="Next slide"
      >
        <ChevronRight size={16} />
      </button>

      {/* Dot navigation */}
      {slideCount > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === current ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/75'
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
