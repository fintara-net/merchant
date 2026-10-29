import { z } from 'zod'

// Placeholder lists until the real API defines them — change values/labels here only.
export const USER_TYPES = ['admin', 'member-bank-user'] as const
export type UserType = (typeof USER_TYPES)[number]
export const USER_TYPE_LABELS: Record<UserType, string> = {
  admin: 'Admin',
  'member-bank-user': 'Member Bank User',
}
/** User types that must belong to an issuing bank */
export const BANK_USER_TYPES: readonly UserType[] = ['member-bank-user']

export const USER_STATUSES = ['active', 'inactive'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export interface ManagedUser {
  id: string
  username: string
  firstName: string
  /** null when the user has no middle name */
  middleName: string | null
  lastName: string
  phoneNumber: string
  email: string
  userType: UserType
  /** SWIFT code of the user's issuing bank; null for non-bank users */
  bankCode: string | null
  status: UserStatus
  /** Locked users can't sign in until unlocked (separate from active/inactive) */
  locked: boolean
}

export const userFormSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'At least 3 characters')
      .max(50, 'At most 50 characters')
      .regex(/^[A-Za-z0-9._-]+$/, 'Letters, numbers, dot, dash and underscore only'),
    firstName: z.string().trim().min(1, 'First name is required').max(50, 'At most 50 characters'),
    /** '' when there's no middle name */
    middleName: z.string().trim().max(50, 'At most 50 characters'),
    lastName: z.string().trim().min(1, 'Last name is required').max(50, 'At most 50 characters'),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^9\d{9}$/, 'Enter a 10-digit mobile number starting with 9'),
    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),
    userType: z.enum(USER_TYPES),
    /** '' when no bank is selected */
    bankCode: z.string(),
    status: z.enum(USER_STATUSES),
  })
  .refine((v) => !BANK_USER_TYPES.includes(v.userType) || v.bankCode !== '', {
    path: ['bankCode'],
    message: "Select the user's bank",
  })
export type UserFormInput = z.input<typeof userFormSchema>
export type UserFormValues = z.output<typeof userFormSchema>

export const usersSearchSchema = z.object({
  page: z.number().int().positive().optional().catch(undefined),
  pageSize: z.number().int().positive().max(100).optional().catch(undefined),
})

/** "Prakash Kumar Paudel" — skips the middle name when there isn't one */
export function fullName(user: Pick<ManagedUser, 'firstName' | 'middleName' | 'lastName'>) {
  return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ')
}
