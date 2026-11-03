import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { paginated } from '@/lib/schemas'
import { api } from '@/lib/api-client'
import {
  DEFAULT_DATE_RANGE,
  DEFAULT_PAGE_SIZE,
  transactionSchema,
  type TransactionSearch,
} from './schemas'

/**
 * The transactions list. The backend applies the bank or merchant restriction from the
 * signed-in user, whatever `bank`/`merchant` the browser sends.
 */
export const transactionsQueryOptions = (search: TransactionSearch) =>
  queryOptions({
    queryKey: ['transactions', search] as const,
    queryFn: ({ signal }) =>
      api.get('/transactions', paginated(transactionSchema), {
        signal,
        query: {
          range: search.range ?? DEFAULT_DATE_RANGE,
          status: search.status,
          mode: search.mode,
          bank: search.bank,
          merchant: search.merchant,
          searchBy: search.q ? (search.searchBy ?? 'tid') : undefined,
          q: search.q,
          page: search.page ?? 1,
          pageSize: search.pageSize ?? DEFAULT_PAGE_SIZE,
        },
      }),
    placeholderData: keepPreviousData,
  })
