import { cn } from '@/lib/utils'
import type { IssuingBankStatus } from '../schemas'

export function IssuingBankStatusBadge({ status }: { status: IssuingBankStatus }) {
  const active = status === 'active'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        active
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'bg-foreground/8 text-muted',
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}
