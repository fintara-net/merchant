import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { organisationKeys } from '@/features/organisations'
import { api } from '@/lib/api-client'
import { merchantSchema, type MerchantCreateFormValues, type MerchantFormValues } from './schemas'

export const merchantKeys = {
  all: ['merchants'] as const,
}

export const merchantsQueryOptions = queryOptions({
  queryKey: merchantKeys.all,
  queryFn: ({ signal }) => api.get('/merchants', z.array(merchantSchema), { signal }),
})

const createdMerchantSchema = z.object({
  merchant: merchantSchema,
  loginUsername: z.string(),
  /** Shown once to the admin; the backend keeps only its hash */
  temporaryPassword: z.string(),
})
export type CreatedMerchant = z.infer<typeof createdMerchantSchema>

const invalidateAll = (queryClient: ReturnType<typeof useQueryClient>) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: merchantKeys.all }),
    queryClient.invalidateQueries({ queryKey: organisationKeys.all }),
    // The new login shows up on the Users page
    queryClient.invalidateQueries({ queryKey: ['users'] }),
  ])

/** Creates the merchant together with its first login (one request, saved together). */
export function useCreateMerchant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: MerchantCreateFormValues) =>
      api.post('/merchants', createdMerchantSchema, { body: values }),
    onSuccess: () => invalidateAll(queryClient),
  })
}

export function useUpdateMerchant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: MerchantFormValues }) =>
      api.put(`/merchants/${id}`, merchantSchema, { body: values }),
    onSuccess: () => invalidateAll(queryClient),
  })
}
