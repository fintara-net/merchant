import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/api-client'
import { managedUserSchema, type UserFormValues, type UserType } from './schemas'

export interface UsersQuery {
  type?: UserType
  merchant?: string
  page: number
  pageSize: number
}

const usersPageSchema = z.object({
  items: z.array(managedUserSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  /** Active, unlocked users across all pages */
  activeCount: z.number().int(),
})

export const userKeys = {
  all: ['users'] as const,
  list: (query: UsersQuery) => [...userKeys.all, 'list', query] as const,
}

/**
 * Bank and merchant users get only their own organisation's users; the backend decides
 * that from the signed-in user, whatever filters are sent.
 */
export const usersQueryOptions = (query: UsersQuery) =>
  queryOptions({
    queryKey: userKeys.list(query),
    queryFn: ({ signal }) =>
      api.get('/users', usersPageSchema, {
        signal,
        query: {
          type: query.type,
          merchant: query.merchant,
          page: query.page,
          pageSize: query.pageSize,
        },
      }),
    // Keep the current page on screen while the next one loads
    placeholderData: keepPreviousData,
  })

const createdUserSchema = z.object({
  user: managedUserSchema,
  /** Shown once to the admin; the backend keeps only its hash */
  temporaryPassword: z.string(),
})
export type CreatedUser = z.infer<typeof createdUserSchema>

const detailsOf = (values: UserFormValues) => ({
  username: values.username,
  firstName: values.firstName,
  middleName: values.middleName || null,
  lastName: values.lastName,
  phoneNumber: values.phoneNumber,
  email: values.email,
  status: values.status,
})

function useInvalidateUsers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: userKeys.all })
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: (values: UserFormValues) =>
      api.post('/users', createdUserSchema, {
        body: { ...detailsOf(values), userType: values.userType, bankId: values.bankId || null },
      }),
    onSuccess: invalidate,
  })
}

/** Type and organisation never change after creation, so they aren't sent */
export function useUpdateUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserFormValues }) =>
      api.put(`/users/${id}`, managedUserSchema, { body: detailsOf(values) }),
    onSuccess: invalidate,
  })
}

export type UserCommand = 'lock' | 'unlock' | 'activate' | 'deactivate'

export function useUserCommand() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ id, command }: { id: string; command: UserCommand }) =>
      api.post(`/users/${id}/${command}`, managedUserSchema),
    onSuccess: invalidate,
  })
}
