import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

/**
 * Text wordmark until a real Fintara logo file is available.
 * Purple mark with the name in ink, for white surfaces.
 */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 text-lg font-bold tracking-tight',
        'text-foreground',
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center rounded-sm bg-primary text-sm font-bold text-primary-foreground"
      >
        {BRAND.name.charAt(0)}
      </span>
      {compact ? <span className="sr-only">{BRAND.name}</span> : BRAND.name}
    </span>
  )
}
