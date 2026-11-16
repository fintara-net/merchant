import { cn } from '@/lib/utils'
import type { IssuingBankStatus } from '../schemas'

export function IssuingBankStatusBadge({ status }: { status: IssuingBankStatus }) {
  const active = status === 'active'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        active ? 'bg-success-soft text-success' : 'bg-foreground/8 text-muted',
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}
