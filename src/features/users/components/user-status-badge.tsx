import { cn } from '@/lib/utils'
import type { ManagedUser } from '../schemas'

export function UserStatusBadge({ user }: { user: Pick<ManagedUser, 'status' | 'locked'> }) {
  const { label, tone } = user.locked
    ? { label: 'Locked', tone: 'bg-warning-soft text-warning' }
    : user.status === 'active'
      ? { label: 'Active', tone: 'bg-success-soft text-success' }
      : { label: 'Inactive', tone: 'bg-foreground/8 text-muted' }

  return (
    <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', tone)}>
      {label}
    </span>
  )
}
