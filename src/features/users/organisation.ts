import { useIssuingBanks } from '@/features/issuing-banks'
import { useMerchants } from '@/features/merchants'
import type { ManagedUser } from './schemas'

/** Name of the organisation a user belongs to: their bank, their merchant, or Fintara */
export function useOrganisationName() {
  const banks = useIssuingBanks((s) => s.banks)
  const merchants = useMerchants((s) => s.merchants)

  return (user: Pick<ManagedUser, 'userType' | 'bankId' | 'merchantId'>) => {
    if (user.userType === 'bank') return banks.find((b) => b.id === user.bankId)?.name ?? '—'
    if (user.userType === 'merchant')
      return merchants.find((m) => m.id === user.merchantId)?.name ?? '—'
    return 'Fintara'
  }
}
