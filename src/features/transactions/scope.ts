import type { User } from '@/features/auth/api'
import type { TransactionSearch } from './schemas'

/**
 * What a signed-in user may see on the Transactions page.
 *
 * This only shapes the screen. The backend must still return only the bank's
 * or merchant's own transactions, based on the signed-in user, whatever
 * filters the browser sends.
 */
export interface TransactionScope {
  showBankFilter: boolean
  showMerchantFilter: boolean
  /** Bank users only ever see their own bank, so the column adds nothing */
  showBankColumn: boolean
  /** Filters that are fixed for this user and override anything in the URL */
  locked: Pick<TransactionSearch, 'bank' | 'merchant'>
  /** Shown under the page title, e.g. the bank's name */
  organisationName: string | null
}

export function transactionScope(user: Pick<User, 'userType' | 'organisation'>): TransactionScope {
  const orgId = user.organisation?.id
  const organisationName = user.organisation?.name ?? null

  switch (user.userType) {
    case 'bank':
      return {
        showBankFilter: false,
        showMerchantFilter: true,
        showBankColumn: false,
        locked: { bank: orgId },
        organisationName,
      }
    case 'merchant':
      return {
        showBankFilter: true,
        showMerchantFilter: false,
        showBankColumn: true,
        locked: { merchant: orgId },
        organisationName,
      }
    case 'super-admin':
      return {
        showBankFilter: true,
        showMerchantFilter: true,
        showBankColumn: true,
        locked: {},
        organisationName: null,
      }
  }
}

/** The filters actually applied: the URL's, with this user's fixed filters on top */
export function applyScope(search: TransactionSearch, scope: TransactionScope): TransactionSearch {
  return { ...search, ...scope.locked }
}
