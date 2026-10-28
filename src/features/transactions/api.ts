import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/api-client'
import { paginated } from '@/lib/schemas'

export const transactionStatusSchema = z.enum(['pending', 'completed', 'failed', 'reversed'])
export type TransactionStatus = z.infer<typeof transactionStatusSchema>

export const transactionSchema = z.object({
  id: z.string(),
  reference: z.string(),
  amount: z.number().int(), // minor units
  currency: z.string().length(3),
  status: transactionStatusSchema,
  issuingBankName: z.string(),
  createdAt: z.string(),
})
export type Transaction = z.infer<typeof transactionSchema>

export interface TransactionFilters {
  page?: number
  q?: string
  status?: TransactionStatus
}

export const transactionsQueryOptions = (filters: TransactionFilters) =>
  queryOptions({
    queryKey: ['transactions', 'list', filters] as const,
    queryFn: ({ signal }) =>
      api.get('/transactions', paginated(transactionSchema), {
        query: { pageSize: 20, ...filters },
        signal,
      }),
    placeholderData: keepPreviousData,
  })
