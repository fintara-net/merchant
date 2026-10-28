import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

/** Text wordmark until a real Fintara logo file is available. */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-xl font-extrabold tracking-[0.18em] uppercase',
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-linear-to-br from-brand-400 to-brand-600 text-sm tracking-normal text-white"
      >
        {BRAND.name.charAt(0)}
      </span>
      {compact ? <span className="sr-only">{BRAND.name}</span> : BRAND.name}
    </span>
  )
}
