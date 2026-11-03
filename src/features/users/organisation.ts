import { useOrganisationOptions } from '@/features/organisations'
import type { ManagedUser } from './schemas'

/** Name of the organisation a user belongs to: their bank, their merchant, or Fintara */
export function useOrganisationName() {
  const { banks, merchants } = useOrganisationOptions()

  return (user: Pick<ManagedUser, 'userType' | 'bankId' | 'merchantId'>) => {
    if (user.userType === 'bank') return banks.find((b) => b.id === user.bankId)?.name ?? '—'
    if (user.userType === 'merchant')
      return merchants.find((m) => m.id === user.merchantId)?.name ?? '—'
    return 'Fintara'
  }
}
