import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { api, setSession } from '@/lib/api-client'
import { authKeys } from './api'

/**
 * The signed-in user's own two-factor authentication (authenticator app codes).
 * The backend side is in the backend's Features/Authentication/TwoFactor folder.
 */

/** Shown once while setting up: the QR code holds `otpAuthUri`; `secret` is for typing in */
const setupSchema = z.object({
  secret: z.string(),
  otpAuthUri: z.string().startsWith('otpauth://totp/'),
  issuer: z.string(),
  accountName: z.string(),
})
export type TwoFactorSetup = z.infer<typeof setupSchema>

const statusSchema = z.object({
  enabled: z.boolean(),
  enabledAt: z.string().nullable(),
  recoveryCodesLeft: z.number().int(),
})

const enabledSchema = z.object({
  accessToken: z.string(),
  expiresAt: z.string(),
  recoveryCodes: z.array(z.string()),
})

const recoveryCodesSchema = z.object({ recoveryCodes: z.array(z.string()) })

export const twoFactorKeys = {
  status: () => [...authKeys.all, 'two-factor'] as const,
  // Not under authKeys: refreshing the session must not make a new secret mid-setup
  setup: ['two-factor-setup'] as const,
}

/**
 * Each fetch makes a new secret on the server and replaces any unconfirmed one, so it is
 * fetched once per visit and never refetched in the background.
 */
export const twoFactorSetupQueryOptions = queryOptions({
  queryKey: twoFactorKeys.setup,
  queryFn: () => api.post('/me/2fa/setup', setupSchema),
  staleTime: Infinity,
  gcTime: 0,
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
})

export const twoFactorStatusQueryOptions = queryOptions({
  queryKey: twoFactorKeys.status(),
  queryFn: ({ signal }) => api.get('/me/2fa', statusSchema, { signal }),
})

/**
 * Turns 2FA on with the first code from the app. The server signs out other devices and
 * returns fresh tokens for this one, plus the recovery codes to show once.
 */
export async function confirmTwoFactor(code: string): Promise<string[]> {
  const result = await api.post('/me/2fa/confirm', enabledSchema, { body: { code } })
  setSession(result)
  return result.recoveryCodes
}

export const regenerateRecoveryCodesSchema = z.object({
  password: z.string().min(1, 'Enter your password'),
  code: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app')),
})

export async function regenerateRecoveryCodes(
  body: z.output<typeof regenerateRecoveryCodesSchema>,
): Promise<string[]> {
  return (await api.post('/me/2fa/recovery-codes', recoveryCodesSchema, { body })).recoveryCodes
}

/** "JBSWY3DPEHPK3PXP" → "JBSW Y3DP EHPK 3PXP", easier to type into an app by hand */
export const formatSecret = (secret: string) => secret.match(/.{1,4}/g)?.join(' ') ?? secret
