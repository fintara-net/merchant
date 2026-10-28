import { useId } from 'react'
import { cn } from '@/lib/utils'

const LINES = 48

/**
 * Flowing purple "silk" wave from the brand guideline cover,
 * drawn as many thin offset curves so it stays sharp at any size.
 */
export function BrandWave({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg
      aria-hidden
      viewBox="0 0 800 800"
      preserveAspectRatio="xMidYMid slice"
      className={cn('pointer-events-none', className)}
    >
      <defs>
        <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#796dff" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#3e3bca" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#796dff" stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="35%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#3e3bca" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="800" fill={`url(#${id}-glow)`} />
      <g fill="none" stroke={`url(#${id}-stroke)`} strokeWidth="1.25" className="brand-wave">
        {Array.from({ length: LINES }, (_, i) => {
          const t = i / (LINES - 1)
          const y = 180 + t * 140
          const c1 = 40 + t * 260
          const c2 = 720 - t * 220
          return (
            <path
              key={i}
              d={`M -60 ${y} C 260 ${c1}, 380 ${c2}, 860 ${520 + t * 120}`}
              strokeOpacity={0.25 + 0.75 * Math.sin(t * Math.PI)}
            />
          )
        })}
      </g>
    </svg>
  )
}
