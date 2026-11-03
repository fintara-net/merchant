import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { organisationKeys } from '@/features/organisations'
import { api } from '@/lib/api-client'
import { issuingBankSchema, type IssuingBankFormValues } from './schemas'

export const issuingBankKeys = {
  all: ['issuing-banks'] as const,
}

export const issuingBanksQueryOptions = queryOptions({
  queryKey: issuingBankKeys.all,
  queryFn: ({ signal }) => api.get('/issuing-banks', z.array(issuingBankSchema), { signal }),
})

/** Adds a bank, or updates it when an id is given. Refreshes every list that shows banks. */
export function useSaveIssuingBank() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: IssuingBankFormValues }) =>
      id
        ? api.put(`/issuing-banks/${id}`, issuingBankSchema, { body: values })
        : api.post('/issuing-banks', issuingBankSchema, { body: values }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: issuingBankKeys.all }),
        queryClient.invalidateQueries({ queryKey: organisationKeys.all }),
      ]),
  })
}
