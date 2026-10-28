import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/api-client'
import { paginated } from '@/lib/schemas'

export const managedUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: z.string(),
  status: z.enum(['active', 'invited', 'disabled']),
})
export type ManagedUser = z.infer<typeof managedUserSchema>

export const usersQueryOptions = (filters: { page?: number; q?: string }) =>
  queryOptions({
    queryKey: ['users', 'list', filters] as const,
    queryFn: ({ signal }) =>
      api.get('/users', paginated(managedUserSchema), { query: filters, signal }),
  })
