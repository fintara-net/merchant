import { z } from 'zod'
import { api, setSession, tokenResponseSchema } from '@/lib/api-client'

/**
 * Rules for passwords users choose. They match PasswordRules in
 * Backend/src/Application/Features/Auth/ChangePassword.cs, which checks them again.
 */
export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128

export const PASSWORD_RULES = [
  {
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (p: string) => p.length >= PASSWORD_MIN_LENGTH,
  },
  { label: 'A lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'A number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'A symbol, like ! or #', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters`)
      .refine((p) => PASSWORD_RULES.every((r) => r.test(p)), "Password doesn't meet all the rules"),
    confirmPassword: z.string().min(1, 'Type the new password again'),
  })
  .refine((v) => v.confirmPassword === v.newPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match",
  })
  .refine((v) => !v.newPassword || v.newPassword !== v.currentPassword, {
    path: ['newPassword'],
    message: 'Choose a password different from your current one',
  })
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

/**
 * Changes the signed-in user's password. The server signs out every other device and
 * returns new tokens for this one.
 */
export async function changePassword({ currentPassword, newPassword }: ChangePasswordInput) {
  setSession(
    await api.post('/me/password', tokenResponseSchema, { body: { currentPassword, newPassword } }),
  )
}
