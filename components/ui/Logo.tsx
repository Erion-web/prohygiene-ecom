'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { h: 32, maxW: 160 },
  md: { h: 40, maxW: 200 },
  lg: { h: 52, maxW: 260 },
}

/**
 * Place your logo at /public/logo.svg — it loads automatically.
 * Falls back to the inline SVG wordmark if the file is missing.
 */
export function Logo({ className, size = 'sm' }: LogoProps) {
  const [fileOk, setFileOk] = useState(true)
  const { h, maxW } = sizes[size]

  if (fileOk) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo.svg"
        alt="ProHygiene"
        height={h}
        style={{ height: h, width: 'auto', maxWidth: maxW }}
        className={cn('object-contain', className)}
        onError={() => setFileOk(false)}
      />
    )
  }

  return <InlineLogo className={className} size={size} />
}

export function InlineLogo({ className, size = 'sm' }: LogoProps) {
  const { h } = sizes[size]

  return (
    <span
      className={cn('inline-flex items-center gap-2', className)}
      style={{ height: h }}
    >
      <svg
        width={h}
        height={h}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M20 4C20 4 8 16.5 8 24C8 30.627 13.373 36 20 36C26.627 36 32 30.627 32 24C32 16.5 20 4 20 4Z"
          fill="#5CCEF2"
        />
        <ellipse cx="15" cy="21" rx="3" ry="5" fill="white" fillOpacity="0.3" transform="rotate(-20 15 21)" />
        <path d="M20 19V29M15 24H25" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span
        className="font-extrabold leading-none select-none"
        style={{ fontSize: h * 0.52 }}
      >
        <span className="text-text-primary">Pro</span>
        <span style={{ color: '#5CCEF2' }}>Hygiene</span>
      </span>
    </span>
  )
}
