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
  /** Signed in with a temporary password: must choose their own before using the dashboard */
  mustChangePassword: z.boolean(),
  /** Everyone must set up an authenticator app; until then the dashboard sends them to setup */
  twoFactorEnabled: z.boolean(),
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

/** The password was right but the account has 2FA: send a code with this ticket next */
const twoFactorChallengeSchema = z.object({
  twoFactorRequired: z.literal(true),
  ticket: z.string(),
  ticketExpiresAt: z.string(),
})
export type TwoFactorChallenge = z.infer<typeof twoFactorChallengeSchema>

const loginResponseSchema = z.union([twoFactorChallengeSchema, tokenResponseSchema])

export type LoginOutcome =
  { kind: 'signed-in'; user: User } | { kind: 'code-required'; challenge: TwoFactorChallenge }

/** Loads the user for a new session; ends it again if they may not use the dashboard */
async function startSession(): Promise<User> {
  try {
    return await fetchMe()
  } catch (error) {
    await logout().catch(() => undefined)
    throw error
  }
}

export async function login(input: LoginInput): Promise<LoginOutcome> {
  const response = await api.post('/auth/login', loginResponseSchema, { body: input })
  if ('twoFactorRequired' in response) return { kind: 'code-required', challenge: response }
  setSession(response)
  return { kind: 'signed-in', user: await startSession() }
}

export const twoFactorCodeSchema = z.object({
  code: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app')),
})

export const recoveryCodeSchema = z.object({
  recoveryCode: z
    .string()
    .trim()
    .min(1, 'Enter one of your recovery codes')
    .max(40, 'That is too long for a recovery code'),
})

/** Second sign-in step: one code from the authenticator app, or a recovery code */
export async function loginWithCode(
  ticket: string,
  code: { code: string } | { recoveryCode: string },
): Promise<User> {
  setSession(await api.post('/auth/login/2fa', tokenResponseSchema, { body: { ticket, ...code } }))
  return startSession()
}

export async function logout() {
  try {
    await api.post('/auth/logout', null)
  } finally {
    clearSession()
  }
}
