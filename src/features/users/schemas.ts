import { z } from 'zod'
import { emailField, personNameField, phoneField, usernameField } from '@/lib/schemas'

/**
 * Who the user works for decides which data they can see:
 * - super-admin: Fintara staff, sees everything, no organisation
 * - bank: belongs to one issuing bank, sees only that bank's transactions
 * - merchant: belongs to one merchant, sees only that merchant's transactions
 */
export const USER_TYPES = ['super-admin', 'bank', 'merchant'] as const
export type UserType = (typeof USER_TYPES)[number]
export const USER_TYPE_LABELS: Record<UserType, string> = {
  'super-admin': 'Super Admin',
  bank: 'Bank',
  merchant: 'Merchant',
}
/**
 * Types that can be created from the Users page. Merchant logins are created
 * together with their merchant on the Merchants page (one login per merchant
 * for now). Add 'merchant' back here when merchants can have several staff logins.
 */
export const CREATABLE_USER_TYPES: readonly UserType[] = ['super-admin', 'bank']

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
  /** Can't change after the user is created */
  userType: UserType
  /** Issuing bank id; set only for bank users */
  bankId: string | null
  /** Merchant id; set only for merchant users */
  merchantId: string | null
  status: UserStatus
  /** Locked users can't sign in until unlocked (separate from active/inactive) */
  locked: boolean
}

export const userFormSchema = z
  .object({
    username: usernameField,
    firstName: personNameField('First name'),
    /** '' when there's no middle name */
    middleName: z.string().trim().max(50, 'At most 50 characters'),
    lastName: personNameField('Last name'),
    phoneNumber: phoneField,
    email: emailField,
    userType: z.enum(USER_TYPES),
    /** '' when no bank is selected */
    bankId: z.string(),
    /** '' when no merchant is selected */
    merchantId: z.string(),
    status: z.enum(USER_STATUSES),
  })
  .refine((v) => v.userType !== 'bank' || v.bankId !== '', {
    path: ['bankId'],
    message: "Select the user's bank",
  })
  .refine((v) => v.userType !== 'merchant' || v.merchantId !== '', {
    path: ['merchantId'],
    message: "Select the user's merchant",
  })
  // Keep only the link that matches the type, so a user can never end up
  // tied to both a bank and a merchant
  .transform((v) => ({
    ...v,
    bankId: v.userType === 'bank' ? v.bankId : '',
    merchantId: v.userType === 'merchant' ? v.merchantId : '',
  }))
export type UserFormInput = z.input<typeof userFormSchema>
export type UserFormValues = z.output<typeof userFormSchema>

export const usersSearchSchema = z.object({
  type: z.enum(USER_TYPES).optional().catch(undefined),
  /** Show only the logins of one merchant (from the Merchants page "Manage login" link) */
  merchant: z.string().optional().catch(undefined),
  page: z.number().int().positive().optional().catch(undefined),
  pageSize: z.number().int().positive().max(100).optional().catch(undefined),
})

/** "Prakash Kumar Paudel" — skips the middle name when there isn't one */
export function fullName(user: Pick<ManagedUser, 'firstName' | 'middleName' | 'lastName'>) {
  return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ')
}
