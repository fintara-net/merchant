import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { USER_TYPES } from '@/features/users/schemas'
import { api, clearSession, ensureSession, setSession, tokenResponseSchema } from '@/lib/api-client'

/** The signed-in user, as returned by GET /me */
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  username: z.string(),
  role: z.string(),
  /** Decides which data the user sees: everything, one bank's, or one merchant's */
  userType: z.enum(USER_TYPES),
  /** The bank or merchant the user belongs to; null for super admins */
  organisation: z.object({ id: z.string(), name: z.string() }).nullable(),
  permissions: z.array(z.string()),
})
export type User = z.infer<typeof userSchema>

export const loginSchema = z.object({
  login: z.string().trim().min(1, 'Enter your email or username'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
}

const fetchMe = (signal?: AbortSignal) => api.get('/me', userSchema, { signal })

export const sessionQueryOptions = queryOptions({
  queryKey: authKeys.session(),
  // After a page reload there is no access token yet: get one from the refresh cookie first
  queryFn: async ({ signal }) => {
    await ensureSession()
    return fetchMe(signal)
  },
  staleTime: 5 * 60_000,
  retry: false,
})

export async function login(input: LoginInput): Promise<User> {
  setSession(await api.post('/auth/login', tokenResponseSchema, { body: input }))
  try {
    return await fetchMe()
  } catch (error) {
    // Signed in but not allowed to use the dashboard: end the session again
    await logout().catch(() => undefined)
    throw error
  }
}

export async function logout() {
  try {
    await api.post('/auth/logout', null)
  } finally {
    clearSession()
  }
}
