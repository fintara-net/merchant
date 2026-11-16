import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

/**
 * Text wordmark until a real Fintara logo file is available.
 * `tone="navy"` is for navy surfaces (sidebar, bands); `light` for white ones.
 */
export function Logo({
  className,
  compact = false,
  tone = 'navy',
}: {
  className?: string
  compact?: boolean
  tone?: 'navy' | 'light'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 text-lg font-bold tracking-tight',
        tone === 'navy' ? 'text-on-navy' : 'text-navy',
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center rounded-sm bg-gold text-sm font-bold text-navy"
      >
        {BRAND.name.charAt(0)}
      </span>
      {compact ? <span className="sr-only">{BRAND.name}</span> : BRAND.name}
    </span>
  )
}
