import { queryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/api-client'

const optionSchema = z.object({ id: z.string(), name: z.string() })
export type OrganisationOption = z.infer<typeof optionSchema>

const optionsSchema = z.object({ banks: z.array(optionSchema), merchants: z.array(optionSchema) })

export const organisationKeys = {
  all: ['organisations'] as const,
  options: () => [...organisationKeys.all, 'options'] as const,
}

/** Bank and merchant names for dropdowns and labels; any signed-in user can read these. */
export const organisationOptionsQueryOptions = queryOptions({
  queryKey: organisationKeys.options(),
  queryFn: ({ signal }) => api.get('/organisations/options', optionsSchema, { signal }),
  staleTime: 5 * 60_000,
})

export function useOrganisationOptions() {
  const { data } = useQuery(organisationOptionsQueryOptions)
  return { banks: data?.banks ?? [], merchants: data?.merchants ?? [] }
}
