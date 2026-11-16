import { Badge } from '@/components/ui/badge'
import type { IssuingBankStatus } from '../schemas'

/** Active / Inactive label, shared by banks and merchants */
export function IssuingBankStatusBadge({ status }: { status: IssuingBankStatus }) {
  return status === 'active' ? (
    <Badge tone="success">Active</Badge>
  ) : (
    <Badge tone="neutral">Inactive</Badge>
  )
}
