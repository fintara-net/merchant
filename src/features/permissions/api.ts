import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/api-client'
import { authKeys } from '@/features/auth/api'

const permissionsResponseSchema = z.object({ permissions: z.array(z.string()) })

export const permissionsQueryOptions = queryOptions({
  queryKey: [...authKeys.all, 'permissions'] as const,
  queryFn: async ({ signal }) =>
    (await api.get('/me/permissions', permissionsResponseSchema, { signal })).permissions,
  staleTime: 5 * 60_000,
})
