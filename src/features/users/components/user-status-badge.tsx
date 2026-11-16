import { Badge } from '@/components/ui/badge'
import type { ManagedUser } from '../schemas'

export function UserStatusBadge({ user }: { user: Pick<ManagedUser, 'status' | 'locked'> }) {
  if (user.locked) return <Badge tone="warning">Locked</Badge>
  return user.status === 'active' ? (
    <Badge tone="success">Active</Badge>
  ) : (
    <Badge tone="neutral">Inactive</Badge>
  )
}
