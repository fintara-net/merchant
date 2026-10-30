import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { USER_TYPES } from '@/features/users/schemas'
import { api } from '@/lib/api-client'

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: z.string(),
  /** Decides which data the user sees: everything, one bank's, or one merchant's */
  userType: z.enum(USER_TYPES),
  /** The bank or merchant the user belongs to; null for super admins */
  organisation: z.object({ id: z.string(), name: z.string() }).nullable(),
})
export type User = z.infer<typeof userSchema>

export const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
}

export const sessionQueryOptions = queryOptions({
  queryKey: authKeys.session(),
  queryFn: ({ signal }) => api.get('/auth/me', userSchema, { signal }),
  staleTime: 5 * 60_000,
  retry: false,
})

export const login = (input: LoginInput) => api.post('/auth/login', userSchema, { body: input })
export const logout = () => api.post('/auth/logout', null)
